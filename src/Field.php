<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor;

use Craft;
use craft\base\CrossSiteCopyableFieldInterface;
use craft\base\ElementContainerFieldInterface;
use craft\base\ElementInterface;
use craft\base\Event;
use craft\base\FieldInterface;
use craft\base\MergeableFieldInterface;
use craft\base\NestedElementInterface;
use craft\behaviors\EventBehavior;
use craft\ckeditor\data\BaseChunk;
use craft\ckeditor\data\Entry as EntryChunk;
use craft\ckeditor\data\FieldData;
use craft\ckeditor\data\Markup;
use craft\ckeditor\events\DefineLinkOptionsEvent;
use craft\ckeditor\events\ModifyConfigEvent;
use craft\ckeditor\gql\Generator;
use craft\ckeditor\helpers\CkeditorConfig;
use craft\ckeditor\helpers\CkeditorConfigSchema;
use craft\ckeditor\models\EntryType as CkeEntryType;
use craft\ckeditor\web\assets\BaseCkeditorPackageAsset;
use craft\ckeditor\web\assets\ckeditor\CkeditorAsset;
use craft\ckeditor\web\assets\fieldsettings\FieldSettingsAsset;
use craft\db\FixedOrderExpression;
use craft\db\Query;
use craft\db\Table;
use craft\db\Table as DbTable;
use craft\elements\Asset;
use craft\elements\Category;
use craft\elements\db\ElementQuery;
use craft\elements\db\EntryQuery;
use craft\elements\Entry;
use craft\elements\NestedElementManager;
use craft\elements\User;
use craft\enums\PropagationMethod;
use craft\errors\InvalidHtmlTagException;
use craft\events\CancelableEvent;
use craft\events\DraftEvent;
use craft\events\DuplicateNestedElementsEvent;
use craft\fieldlayoutelements\CustomField;
use craft\fields\Assets;
use craft\helpers\ArrayHelper;
use craft\helpers\Assets as AssetsHelper;
use craft\helpers\Cp;
use craft\helpers\Db;
use craft\helpers\ElementHelper;
use craft\helpers\Html;
use craft\helpers\Json;
use craft\helpers\StringHelper;
use craft\helpers\UrlHelper;
use craft\htmlfield\events\ModifyPurifierConfigEvent;
use craft\htmlfield\HtmlField;
use craft\htmlfield\HtmlFieldData;
use craft\i18n\Locale;
use craft\models\CategoryGroup;
use craft\models\EntryType;
use craft\models\ImageTransform;
use craft\models\Section;
use craft\models\Volume;
use craft\services\Drafts;
use craft\services\ElementSources;
use craft\web\View;
use GraphQL\Type\Definition\Type;
use HTMLPurifier_Config;
use HTMLPurifier_Exception;
use HTMLPurifier_HTMLDefinition;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Throwable;
use yii\base\InvalidArgumentException;
use yii\base\InvalidConfigException;
use yii\validators\Validator;

/**
 * CKEditor field type
 *
 * @property string|null $json
 * @property CkeEntryType[] $entryTypes
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 */
class Field extends HtmlField implements ElementContainerFieldInterface, MergeableFieldInterface, CrossSiteCopyableFieldInterface
{
    /**
     * @event ModifyPurifierConfigEvent The event that is triggered when creating HTML Purifier config
     *
     * Plugins can get notified when HTML Purifier config is being constructed.
     *
     * ```php
     * use craft\htmlfield\events\ModifyPurifierConfigEvent;
     * use craft\ckeditor\Field;
     * use HTMLPurifier_Config;
     * use yii\base\Event;
     *
     * Event::on(
     *     Field::class,
     *     Field::EVENT_MODIFY_PURIFIER_CONFIG,
     *     function(ModifyPurifierConfigEvent $event) {
     *         // @var HTMLPurifier_Config $config
     *         $config = $event->config;
     *         // ...
     *     }
     * );
     * ```
     */
    public const EVENT_MODIFY_PURIFIER_CONFIG = 'modifyPurifierConfig';

    /**
     * @event DefineLinkOptionsEvent The event that is triggered when registering the link options for the field.
     * @since 3.0.0
     */
    public const EVENT_DEFINE_LINK_OPTIONS = 'defineLinkOptions';

    /**
     * @event ModifyConfigEvent The event that is triggered when registering the link options for the field.
     * @since 3.1.0
     */
    public const EVENT_MODIFY_CONFIG = 'modifyConfig';

    /** @since 5.0.0 */
    public const IMAGE_MODE_IMG = 'img';
    /** @since 5.0.0 */
    public const IMAGE_MODE_ENTRIES = 'entries';

    /**
     * @var NestedElementManager[]
     */
    private static array $entryManagers = [];

    /**
     * @inheritdoc
     */
    public static function displayName(): string
    {
        return 'CKEditor';
    }

    /**
     * @inheritdoc
     */
    public static function icon(): string
    {
        return '@craft/ckeditor/icon.svg';
    }

    /**
     * @return array Returns the default `language.textPartLanguage` config option that should be used.
     * @since 3.5.0
     * @see https://ckeditor.com/docs/ckeditor5/latest/api/module_core_editor_editorconfig-LanguageConfig.html#member-textPartLanguage
     */
    public static function textPartLanguage(): array
    {
        return Collection::make(Craft::$app->getI18n()->getSiteLocales())
            ->map(fn(Locale $locale) => array_filter([
                'title' => $locale->getDisplayName(Craft::$app->language),
                'languageCode' => $locale->id,
                'textDirection' => $locale->getOrientation() === 'rtl' ? 'rtl' : null,
            ]))
            ->sortBy('title')
            ->values()
            ->all();
    }

    /**
     * @inheritdoc
     */
    public static function phpType(): string
    {
        return sprintf('%s|null', FieldData::class);
    }

    /**
     * Returns the nested element manager for a given CKEditor field.
     *
     * @param self $field
     * @return NestedElementManager
     * @since 4.0.0
     */
    public static function entryManager(self $field): NestedElementManager
    {
        if (!isset(self::$entryManagers[$field->id])) {
            self::$entryManagers[$field->id] = $entryManager = new NestedElementManager(
                Entry::class,
                fn(ElementInterface $owner) => self::createEntryQuery($owner, $field),
                [
                    'field' => $field,
                    'propagationMethod' => match ($field->translationMethod) {
                        self::TRANSLATION_METHOD_NONE => PropagationMethod::All,
                        self::TRANSLATION_METHOD_SITE => PropagationMethod::None,
                        self::TRANSLATION_METHOD_SITE_GROUP => PropagationMethod::SiteGroup,
                        self::TRANSLATION_METHOD_LANGUAGE => PropagationMethod::Language,
                        self::TRANSLATION_METHOD_CUSTOM => PropagationMethod::Custom,
                    },
                    'propagationKeyFormat' => $field->translationKeyFormat,
                    'criteria' => [
                        'fieldId' => $field->id,
                    ],
                    'valueGetter' => function(ElementInterface $owner, bool $fetchAll = false) use ($field) {
                        $entryIds = array_merge(...array_map(function(self $fieldInstance) use ($owner) {
                            /** @var FieldData|null $value */
                            $value = $owner->getFieldValue($fieldInstance->handle);
                            if (!$value) {
                                return [];
                            }
                            // ensure the siteId is set;
                            // see https://github.com/craftcms/ckeditor/issues/500 for details
                            if ($value->getSiteId() === null) {
                                $value->setSiteId($owner->siteId);
                            }
                            return $value->getChunks(false)
                                ->filter(fn(BaseChunk $chunk) => $chunk instanceof EntryChunk)
                                ->map(fn(EntryChunk $chunk) => $chunk->entryId)
                                ->all();
                        }, self::fieldInstances($owner, $field)));

                        $query = self::createEntryQuery($owner, $field)
                            ->where(['in', 'elements.id', $entryIds])
                            ->status(null)
                            ->trashed(null);

                        if (!empty($entryIds)) {
                            $query->orderBy(new FixedOrderExpression('elements.id', $entryIds, Craft::$app->getDb()));
                        }

                        $entries = $query->collect();

                        // make sure all the expected entries came back
                        $queriedEntryIds = [];
                        foreach ($entries as $entry) {
                            $queriedEntryIds[$entry->id] = true;
                        }

                        $missingEntryIds = [];
                        foreach ($entryIds as $entryId) {
                            if (!isset($queriedEntryIds[$entryId])) {
                                $missingEntryIds[] = $entryId;
                            }
                        }

                        if (!empty($missingEntryIds)) {
                            // this could happen if any entries had been removed from the content,
                            // so their ownership had been deleted from the draft.
                            $missingEntries = self::createEntryQuery($owner, $field, false)
                                ->where(['in', 'elements.id', $missingEntryIds])
                                ->trashed(null)
                                ->all();

                            if (!empty($missingEntries)) {
                                $maxSortOrder = $entries->max(fn(Entry $entry) => $entry->getSortOrder()) ?? 0;
                                foreach ($missingEntries as $i => $entry) {
                                    $entry->setSortOrder($maxSortOrder + $i + 1);
                                }
                            }

                            $entries->push(...$missingEntries);
                        }

                        return $entries;
                    },
                    'valueSetter' => false,
                ],
            );
            $entryManager->on(
                NestedElementManager::EVENT_AFTER_DUPLICATE_NESTED_ELEMENTS,
                function(DuplicateNestedElementsEvent $event) use ($field) {
                    self::afterDuplicateNestedElements($event, $field);
                },
            );
            $entryManager->on(
                NestedElementManager::EVENT_AFTER_CREATE_REVISIONS,
                function(DuplicateNestedElementsEvent $event) use ($field) {
                    self::afterCreateRevisions($event, $field);
                },
            );
        }

        return self::$entryManagers[$field->id];
    }

    private static function fieldInstances(ElementInterface $element, self $field): array
    {
        $customFields = $element->getFieldLayout()?->getCustomFields() ?? [];
        return array_values(array_filter($customFields, fn(FieldInterface $f) => $f->id === $field->id));
    }

    private static function createEntryQuery(?ElementInterface $owner, self $field, bool $setOwner = true): EntryQuery
    {
        $query = Entry::find();

        // Existing element?
        if ($owner && $owner->id) {
            /** @phpstan-ignore-next-line */
            $query->attachBehavior(self::class, new EventBehavior([
                ElementQuery::EVENT_BEFORE_PREPARE => function(
                    CancelableEvent $event,
                    EntryQuery $query,
                ) use ($owner, $setOwner) {
                    if ($setOwner) {
                        $query->ownerId = $owner->id;
                    }

                    // Clear out id=false if this query was populated previously
                    if ($query->id === false) {
                        $query->id = null;
                    }

                    // If the owner is a revision, allow revision entries to be returned as well
                    if ($owner->getIsRevision()) {
                        $query
                            ->revisions(null)
                            ->trashed(null);
                    }
                },
            ], true));

            // Prepare the query for lazy eager loading
            $query->prepForEagerLoading($field->handle, $owner);
        } else {
            $query->id = false;
        }

        $query
            ->fieldId($field->id)
            ->siteId($owner->siteId ?? null);

        return $query;
    }

    private static function afterDuplicateNestedElements(DuplicateNestedElementsEvent $event, self $field): void
    {
        self::adjustFieldValues($event->target, $field, $event->newElementIds, true);
    }

    private static function afterCreateRevisions(DuplicateNestedElementsEvent $event, self $field): void
    {
        $revisionOwners = [
            $event->target,
            ...$event->target->getLocalized()->status(null)->all(),
        ];

        foreach ($revisionOwners as $revisionOwner) {
            self::adjustFieldValues($revisionOwner, $field, $event->newElementIds, false);
        }
    }

    private static function adjustFieldValues(
        ElementInterface $owner,
        self $field,
        array $newEntryIds,
        bool $propagate,
    ): void {
        // Filter out any IDs that haven't changed
        $newEntryIds = Collection::make($newEntryIds)
            ->filter(fn(int $newId, int $oldId) => $newId !== $oldId)
            ->all();
        if (empty($newEntryIds)) {
            return;
        }

        $resave = false;

        foreach (self::fieldInstances($owner, $field) as $fieldInstance) {
            /** @var FieldData|null $value */
            $value = $owner->getFieldValue($fieldInstance->handle);
            if (!$value) {
                continue;
            }

            $chunks = $value->getChunks(false);
            if (!$chunks->contains(fn(BaseChunk $chunk) => (
                $chunk instanceof EntryChunk &&
                isset($newEntryIds[$chunk->entryId])
            ))) {
                continue;
            }

            $newValue = $chunks
                ->map(function(BaseChunk $chunk) use ($newEntryIds) {
                    if ($chunk instanceof Markup) {
                        return $chunk->rawHtml;
                    }

                    /** @var EntryChunk $chunk */
                    $id = $newEntryIds[$chunk->entryId] ?? $chunk->entryId;
                    return sprintf('<craft-entry data-entry-id="%s">&nbsp;</craft-entry>', $id);
                })
                ->join('');

            $owner->setFieldValue($fieldInstance->handle, $newValue);
            $resave = true;
        }

        if ($resave) {
            if (version_compare(Craft::$app->getVersion(), '5.9.0', '>=')) {
                $owner->propagateRequired = false;
            }
            Craft::$app->getElements()->saveElement($owner, false, $propagate, false);
        }
    }

    /** @var array<string|false> */
    private static array $cssFileContents = [];
    /** @var array<array|false> */
    private static array $jsonFileContents = [];
    /** @var array<string|false> */
    private static array $jsFileContents = [];

    private static function cssFileContents(string $file): ?string
    {
        if (!isset(self::$cssFileContents[$file])) {
            $path = self::configFilePath($file);
            if (file_exists($path)) {
                self::$cssFileContents[$file] = file_get_contents($path);
            } else {
                self::$cssFileContents[$file] = false;
                Craft::warning("Could not load CKEditor CSS file \"$file\".", __METHOD__);
            }
        }
        return self::$cssFileContents[$file] ?: null;
    }

    private static function jsonFileContents(string $file): array
    {
        if (!isset(self::$jsonFileContents[$file])) {
            $path = self::configFilePath($file);
            try {
                self::$jsonFileContents[$file] = Json::decodeFromFile($path) ?? [];
            } catch (InvalidArgumentException $e) {
                Craft::warning("Could not decode JSON from CKEditor config file \"$file\": " . $e->getMessage(), __METHOD__);
                self::$jsonFileContents[$file] = [];
            }
        }

        return self::$jsonFileContents[$file];
    }

    private static function jsFileContents(string $file): ?string
    {
        if (!isset(self::$jsFileContents[$file])) {
            $path = self::configFilePath($file);
            if (file_exists($path)) {
                self::$jsFileContents[$file] = file_get_contents($path);
            } else {
                self::$jsFileContents[$file] = false;
                Craft::warning("Could not load CKEditor config JS file \"$file\".", __METHOD__);
            }
        }
        return self::$jsFileContents[$file] ?: null;
    }

    /**
     * @since 5.3.0
     */
    public static function configFilePath(string $file): string
    {
        return sprintf('%s/ckeditor/%s', Craft::$app->getPath()->getConfigPath(), $file);
    }

    /**
     * Normalizes an entry type into a `craft\ckeditor\models\EntryType` object.
     *
     * @param EntryType|CkeEntryType|string|array $entryType
     * @return CkeEntryType|null
     * @since 5.0.0
     */
    public static function entryType(EntryType|CkeEntryType|string|array $entryType): ?CkeEntryType
    {
        if ($entryType instanceof CkeEntryType) {
            return $entryType;
        }

        if (is_string($entryType)) {
            $entryType = Json::decodeIfJson($entryType);
        }

        if ($entryType instanceof EntryType) {
            $craftEntryType = $entryType;
        } else {
            $craftEntryType = Craft::$app->getEntries()->getEntryType($entryType);
        }

        if (!$craftEntryType) {
            return null;
        }

        $config = get_object_vars($craftEntryType);

        if (is_array($entryType)) {
            $config += $entryType;
        }

        return new CkeEntryType($config);
    }

    /**
     * @var string[] Toolbar configuration
     * @since 5.0.0
     */
    public array $toolbar = ['heading', '|', 'bold', 'italic', 'link'];

    /**
     * @var int[]|false The available heading levels
     * @since 5.0.0
     */
    public array|false $headingLevels = [1, 2, 3, 4, 5, 6];

    /**
     * @var array|null The advanced link options available when adding a link
     * @since 5.0.0
     */
    public ?array $advancedLinkFields = [];

    /**
     * @var array|null Additional CKEditor config options
     * @since 5.0.0
     */
    public ?array $options = null;

    /**
     * @var string|null JavaScript code that returns additional CKEditor config properties as an object
     * @since 5.0.0
     */
    public ?string $js = null;

    /**
     * @var string|null The config file that should be used to configure CKEditor.
     * @since 5.3.0
     */
    public ?string $jsFile = null;

    /**
     * @var string|null CSS styles that should be registered for the field.
     * @since 5.0.0
     */
    public ?string $css = null;

    /**
     * @var string|null The CSS file that should be used to style CKEditor contents.
     * @since 5.3.0
     */
    public ?string $cssFile = null;

    /**
     * @var int|null The total number of words allowed.
     * @since 3.5.0
     */
    public ?int $wordLimit = null;

    /**
     * @var int|null The total number of characters allowed.
     * @since 4.8.0
     */
    public ?int $characterLimit = null;

    /**
     * @var bool Whether the word count should be shown below the field.
     * @since 3.2.0
     */
    public bool $showWordCount = false;

    /**
     * @var bool Whether `<oembed>` tags should be parsed and replaced with the provider’s embed code.
     * @since 4.9.0
     */
    public bool $parseEmbeds = false;

    /**
     * @var string How new images should be added to the field contents
     * @since 5.0.0
     */
    public string $imageMode = self::IMAGE_MODE_IMG;

    /**
     * @var string|array|null The volumes that should be available for image selection.
     * @since 1.2.0
     */
    public string|array|null $availableVolumes = '*';

    /**
     * @var string|null The default volume used to upload images into field via drag & drop mechanism
     * @since 4.12.0
     */
    public string|null $defaultUploadLocationVolume = null;

    /**
     * @var string|null The default subpath used to upload images into field via drag & drop mechanism
     * @since 4.12.0
     */
    public string|null $defaultUploadLocationSubpath = null;

    /**
     * @var string|array|null The transforms available when selecting an image.
     * @since 1.2.0
     */
    public string|array|null $availableTransforms = '*';

    /**
     * @var string|null The default transform to use.
     */
    public ?string $defaultTransform = null;

    /**
     * @var string|null The entry type UUID used to store images.
     * @see getImageEntryType()
     * @since 5.0.0
     */
    public ?string $imageEntryTypeUid = null;

    /**
     * @var string|null The Assets field’s layout element UUID used to store images.
     * @see getImageField()
     * @since 5.0.0
     */
    public ?string $imageFieldUid = null;

    /**
     * @var string|string[]|null User groups whose members should be able to see the “Source” button
     * @since 4.5.0
     */
    public string|array|null $sourceEditingGroups = ['__ADMINS__'];

    /**
     * @var bool Whether to show volumes the user doesn’t have permission to view.
     * @since 1.2.0
     */
    public bool $showUnpermittedVolumes = false;

    /**
     * @var bool Whether to show files the user doesn’t have permission to view, per the
     * “View files uploaded by other users” permission.
     * @since 1.2.0
     */
    public bool $showUnpermittedFiles = false;

    /**
     * @var bool Whether GraphQL values should be returned as objects with `content`, `chunks`, etc., sub-fields.
     * @since 4.8.0
     */
    public bool $fullGraphqlData = true;

    /**
     * @var string|null JSON code that defines additional CKEditor config properties as an object
     * @see getJson()
     * @see setJson()
     */
    private ?string $_json = null;

    /**
     * @var CkeEntryType[] The field’s available entry types
     * @see getEntryTypes()
     * @see setEntryTypes()
     */
    private array $_entryTypes = [];

    /**
     * @inheritdoc
     */
    public function __construct($config = [])
    {
        unset(
            $config['initJs'],
            $config['removeInlineStyles'],
            $config['removeEmptyTags'],
            $config['removeNbsp'],
            $config['createButtonLabel'],
            $config['expandEntryButtons'],
            $config['ckeConfig'],
        );

        if (isset($config['configMode'])) {
            switch ($config['configMode']) {
                case 'js':
                    $config['js'] = trim($config['js']);
                    if ($config['js'] === '' || preg_match('/^return\s*\{\s*\}$/', $config['js'])) {
                        unset($config['js']);
                    }
                    unset($config['json'], $config['jsFile']);
                    break;
                case 'file':
                    if (empty($config['jsFile'])) {
                        $config['jsFile'] = null;
                    }
                    unset($config['json'], $config['js']);
                    break;
                default:
                    $config['json'] = trim($config['json']);
                    if ($config['json'] === '' || preg_match('/^\{\s*\}$/', $config['json'])) {
                        unset($config['json']);
                    }
                    unset($config['js'], $config['jsFile']);
                    break;
            }

            unset($config['configMode']);
        }

        if (isset($config['cssMode'])) {
            switch ($config['cssMode']) {
                case 'file':
                    if (empty($config['cssFile'])) {
                        $config['cssFile'] = null;
                    }
                    unset($config['css']);
                    break;
                default:
                    $config['css'] = trim($config['css']);
                    if ($config['css'] === '') {
                        unset($config['css']);
                    }
                    unset($config['cssFile']);
                    break;
            }

            unset($config['cssMode']);
        }

        if (isset($config['entryTypes']) && $config['entryTypes'] === '') {
            $config['entryTypes'] = [];
        }

        if (isset($config['headingLevels']) && $config['headingLevels'] === '') {
            $config['headingLevels'] = [];
        }

        if (isset($config['imageFieldPath'])) {
            [$config['imageEntryTypeUid'], $config['imageFieldUid']] = explode('.', $config['imageFieldPath'], 2);
            unset($config['imageFieldPath']);
        }

        if (isset($config['enableSourceEditingForNonAdmins'])) {
            $config['sourceEditingGroups'] = $config['enableSourceEditingForNonAdmins'] ? '*' : ['__ADMINS__'];
            unset($config['enableSourceEditingForNonAdmins']);
        } elseif (array_key_exists('sourceEditingGroups', $config) && empty($config['sourceEditingGroups'])) {
            $config['sourceEditingGroups'] = null;
        }

        if (isset($config['limitUnit'], $config['fieldLimit'])) {
            if ($config['limitUnit'] === 'chars') {
                $config['characterLimit'] = (int)$config['fieldLimit'] ?: null;
            } else {
                $config['wordLimit'] = (int)$config['fieldLimit'] ?: null;
            }
            unset($config['limitUnit'], $config['fieldLimit']);
        }

        if (isset($config['graphqlMode'])) {
            $config['fullGraphqlData'] = ArrayHelper::remove($config, 'graphqlMode') === 'full';
        }

        parent::__construct($config);
    }

    /**
     * @inheritdoc
     */
    public function init(): void
    {
        parent::init();

        if ($this->wordLimit === 0) {
            $this->wordLimit = null;
        }
        if ($this->characterLimit === 0) {
            $this->characterLimit = null;
        }
    }

    public function attributeLabels(): array
    {
        return [
            'toolbar' => Craft::t('ckeditor', 'Toolbar'),
            'json' => Craft::t('ckeditor', 'Config Options'),
            'js' => Craft::t('ckeditor', 'Config Options'),
            'css' => Craft::t('ckeditor', 'Custom Styles'),
        ];
    }

    /**
     * @since 5.0.0
     */
    public function getJson(): ?string
    {
        if (!isset($this->_json)) {
            if (isset($this->options)) {
                $json = Json::encode($this->options, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                $this->_json = str_replace('    ', '  ', $json);
            }
        }
        return $this->_json;
    }

    /**
     * @since 5.0.0
     */
    public function setJson(?string $json): void
    {
        $this->_json = $json;

        try {
            $this->options = Json::decode($json);
        } catch (InvalidArgumentException) {
            $this->options = null;
        }
    }

    /**
     * Returns the available entry types.
     *
     * @return CkeEntryType[]
     * @since 4.0.0
     */
    public function getEntryTypes(): array
    {
        return $this->_entryTypes;
    }

    /**
     * Sets the available entry types.
     *
     * @param array<EntryType|CkeEntryType|string|array> $entryTypes The entry types, or their IDs or UUIDs
     * @since 4.0.0
     */
    public function setEntryTypes(array $entryTypes): void
    {
        $this->_entryTypes = array_values(array_filter(array_map(
            fn($config) => static::entryType($config),
            $entryTypes
        )));
    }

    /**
     * Returns the entry type used to store images.
     *
     * @since 5.0.0
     */
    public function getImageEntryType(): ?CkeEntryType
    {
        if (!$this->imageEntryTypeUid) {
            return null;
        }

        return Arr::first(
            $this->getEntryTypes(),
            fn(CkeEntryType $entryType) => $entryType->uid === $this->imageEntryTypeUid,
        );
    }

    /**
     * Returns the Assets field used to store images.
     *
     * @since 5.0.0
     */
    public function getImageField(): ?Assets
    {
        if (!$this->imageFieldUid) {
            return null;
        }

        /** @var CustomField|null $layoutElement */
        $layoutElement = $this->getImageEntryType()?->getFieldLayout()->getElementByUid($this->imageFieldUid);
        $field = $layoutElement?->getField();
        return $field instanceof Assets ? $field : null;
    }

    /**
     * @inheritdoc
     */
    protected function defineRules(): array
    {
        return array_merge(parent::defineRules(), [
            ['wordLimit', 'number', 'min' => 1],
            ['characterLimit', 'number', 'min' => 1],
            [
                'json',
                function(string $attribute, ?array $params, Validator $validator) {
                    try {
                        $this->options = Json::decode($this->_json);
                    } catch (InvalidArgumentException) {
                        $validator->addError($this, $attribute, Craft::t('ckeditor', '{attribute} isn’t valid JSON.'));
                        return;
                    }
                },
                'when' => fn() => isset($this->_json),
            ],
        ]);
    }

    /**
     * @inheritdoc
     */
    public function getElementValidationRules(): array
    {
        $rules = [];

        if ($this->characterLimit) {
            $rules[] = [
                function(ElementInterface $element) {
                    $value = strip_tags((string)$element->getFieldValue($this->handle));
                    $value = preg_replace(StringHelper::invisibleCharsRegex(), '', $value);
                    if (mb_strlen($value) > $this->characterLimit) {
                        $element->addError(
                            "field:$this->handle",
                            Craft::t('ckeditor', '{field} should contain at most {max, number} {max, plural, one{character} other{characters}}.', [
                                'field' => Craft::t('site', $this->name),
                                'max' => $this->characterLimit,
                            ]),
                        );
                    }
                },
            ];
        } elseif ($this->wordLimit) {
            $rules[] = [
                function(ElementInterface $element) {
                    $value = html_entity_decode((string)$element->getFieldValue($this->handle));
                    $value = preg_replace(
                        ['/<br>/', '/></'],
                        [' ', '/> </'],
                        $value
                    );
                    $value = strip_tags($value);
                    if (
                        // regex copied from the WordCount plugin, for consistency
                        preg_match_all('/(?:[\p{L}\p{N}]+\S?)+/u', $value, $matches) &&
                        count($matches[0]) > $this->wordLimit
                    ) {
                        $element->addError(
                            "field:$this->handle",
                            Craft::t('ckeditor', '{field} should contain at most {max, number} {max, plural, one{word} other{words}}.', [
                                'field' => Craft::t('site', $this->name),
                                'max' => $this->wordLimit,
                            ]),
                        );
                    }
                },
            ];
        }

        return $rules;
    }

    /**
     * @inheritdoc
     */
    public function getContentGqlType(): Type|array
    {
        if (!$this->fullGraphqlData) {
            return parent::getContentGqlType();
        }

        return Generator::generateType($this);
    }

    /**
     * @inheritdoc
     */

    public function getUriFormatForElement(NestedElementInterface $element): ?string
    {
        return null;
    }

    /**
     * @inheritdoc
     */
    public function getRouteForElement(NestedElementInterface $element): mixed
    {
        return null;
    }

    /**
     * @inheritdoc
     */
    public function getSupportedSitesForElement(NestedElementInterface $element): array
    {
        try {
            $owner = $element->getOwner();
        } catch (InvalidConfigException) {
            $owner = $element->duplicateOf;
        }

        if (!$owner) {
            return [Craft::$app->getSites()->getPrimarySite()->id];
        }

        return self::entryManager($this)->getSupportedSiteIds($owner);
    }

    /**
     * @inheritdoc
     */
    public function canViewElement(NestedElementInterface $element, User $user): ?bool
    {
        return Craft::$app->getElements()->canView($element->getOwner(), $user);
    }

    /**
     * @inheritdoc
     */
    public function canSaveElement(NestedElementInterface $element, User $user): ?bool
    {
        return Craft::$app->getElements()->canSave($element->getOwner(), $user);
    }

    /**
     * @inheritdoc
     */
    public function canDuplicateElement(NestedElementInterface $element, User $user): ?bool
    {
        return Craft::$app->getElements()->canSave($element->getOwner(), $user);
    }

    /**
     * @inheritdoc
     */
    public function canDeleteElement(NestedElementInterface $element, User $user): ?bool
    {
        return Craft::$app->getElements()->canSave($element->getOwner(), $user);
    }

    /**
     * @inheritdoc
     */
    public function canDeleteElementForSite(NestedElementInterface $element, User $user): ?bool
    {
        return false;
    }

    /**
     * @inheritdoc
     */
    public function getSettingsHtml(): ?string
    {
        return $this->settingsHtml(false);
    }

    public function getReadOnlySettingsHtml(): ?string
    {
        return $this->settingsHtml(true);
    }

    private function settingsHtml(bool $readOnly): string
    {
        $view = Craft::$app->getView();
        $bundle = $view->registerAssetBundle(FieldSettingsAsset::class);

        $userGroupOptions = [
            [
                'label' => Craft::t('app', 'Admins'),
                'value' => '__ADMINS__',
            ],
        ];

        foreach (Craft::$app->getUserGroups()->getAllGroups() as $group) {
            if ($group->can('accessCp')) {
                $userGroupOptions[] = [
                    'label' => $group->name,
                    'value' => $group->uid,
                ];
            }
        }

        $volumeOptions = [];
        foreach (Craft::$app->getVolumes()->getAllVolumes() as $volume) {
            if ($volume->getFs()->hasUrls) {
                $volumeOptions[] = [
                    'label' => $volume->name,
                    'value' => $volume->uid,
                ];
            }
        }

        $transformOptions = [];
        foreach (Craft::$app->getImageTransforms()->getAllTransforms() as $transform) {
            $transformOptions[] = [
                'label' => $transform->name,
                'value' => $transform->uid,
            ];
        }

        $jsonSchemaUri = sprintf('https://craft-code-editor.com/%s', $view->namespaceInputId('config-options-json'));

        $configMode = match (true) {
            !empty($this->js) => 'js',
            !empty($this->jsFile) => 'file',
            default => 'json',
        };

        $cssMode = match (true) {
            !empty($this->cssFile) => 'file',
            default => 'css',
        };

        return $view->renderTemplate('ckeditor/_field-settings.twig', [
            'field' => $this,
            'importStatements' => CkeditorConfig::getImportStatements(),
            'toolbarBuilderId' => $view->namespaceInputId('toolbar-builder'),
            'configOptionsId' => $view->namespaceInputId('config-options'),
            'cssOptionsId' => $view->namespaceInputId('css-options'),
            'toolbarItems' => CkeditorConfig::normalizeToolbarItems(CkeditorConfig::$toolbarItems),
            'plugins' => CkeditorConfig::getAllPlugins(),
            'jsonSchema' => CkeditorConfigSchema::create(),
            'jsonSchemaUri' => $jsonSchemaUri,
            'advanceLinkOptions' => CkeditorConfig::advanceLinkOptions(),
            'entryTypes' => $this->getEntryTypes(),
            'userGroupOptions' => $userGroupOptions,
            'jsFileOptions' => $this->configOptions(
                dir: 'ckeditor',
                only: ['*.json', '*.js'],
                includeDefault: false,
                includeExtensions: true,
            ),
            'cssFileOptions' => $this->configOptions(
                dir: 'ckeditor',
                only: ['*.css'],
                includeDefault: false,
                includeExtensions: true,
            ),
            'purifierConfigOptions' => $this->configOptions('htmlpurifier'),
            'baseIconsUrl' => "$bundle->baseUrl/images",
            'volumeOptions' => $volumeOptions,
            'transformOptions' => $transformOptions,
            'defaultTransformOptions' => array_merge([
                [
                    'label' => Craft::t('ckeditor', 'No transform'),
                    'value' => null,
                ],
            ], $transformOptions),
            'configMode' => $configMode,
            'cssMode' => $cssMode,
            'readOnly' => $readOnly,
        ]);
    }

    /**
     * @inheritdoc
     */
    public function getFieldLayoutProviders(): array
    {
        return $this->getEntryTypes();
    }

    /**
     * @inheritdoc
     */
    public function getSettings(): array
    {
        $settings = [
            ...parent::getSettings(),
            'headingLevels' => $this->headingLevels ?: false,
            'entryTypes' => array_map(
                fn(CkeEntryType $entryType) => $entryType->getUsageConfig(),
                $this->getEntryTypes(),
            ),
        ];

        // Cleanup
        unset(
            $settings['removeInlineStyles'],
            $settings['removeEmptyTags'],
            $settings['removeNbsp'],
            $settings['createButtonLabel'],
        );

        return $settings;
    }

    /**
     * @inheritdoc
     */
    public function serializeValue(mixed $value, ?ElementInterface $element): mixed
    {
        if ($value instanceof HtmlFieldData) {
            $value = $value->getRawContent();
        }

        if (!$value) {
            return null;
        }

        // Redactor to CKEditor syntax for <figure>
        // (https://github.com/craftcms/ckeditor/issues/96)
        $value = $this->_normalizeFigures($value);

        // Protect page breaks
        $this->escapePageBreaks($value);
        $value = parent::serializeValue($value, $element);
        return str_replace(
            '{PAGEBREAK_MARKER}',
            '<div class="page-break" style="page-break-after:always;"><span style="display:none;">&nbsp;</span></div>',
            $value,
        );
    }

    /**
     * @inheritdoc
     */
    public function copyCrossSiteValue(ElementInterface $from, ElementInterface $to): void
    {
        /** @var FieldData|null $fromValue */
        $fromValue = $from->getFieldValue($this->handle);
        $chunks = $fromValue->getChunks(false);
        if ($chunks->contains(fn(BaseChunk $chunk) => $chunk instanceof EntryChunk)) {
            $elementsService = Craft::$app->getElements();
            $toValue = $chunks
                ->map(function(BaseChunk $chunk) use ($to, $elementsService) {
                    if ($chunk instanceof Markup) {
                        return $chunk->rawHtml;
                    }

                    /** @var EntryChunk $chunk */
                    $entry = $elementsService->duplicateElement($chunk->getEntry(), [
                        'siteId' => $to->siteId,
                    ]);

                    return sprintf('<craft-entry data-entry-id="%s">&nbsp;</craft-entry>', $entry->id);
                })
                ->join('');
        } else {
            $toValue = $fromValue->getRawContent();
        }

        $to->setFieldValue($this->handle, $toValue);
    }

    private function escapePageBreaks(string &$html): void
    {
        $offset = 0;
        $r = '';

        while (($pos = stripos($html, '<div class="page-break"', $offset)) !== false) {
            $endPos = strpos($html, '</div>', $pos + 23);
            if ($endPos === false) {
                break;
            }
            $r .= substr($html, $offset, $pos - $offset) . '{PAGEBREAK_MARKER}';
            $offset = $endPos + 6;
        }

        if ($offset !== 0) {
            $html = $r . substr($html, $offset);
        }
    }

    /**
     * Return HTML for the entry card or a placeholder one if entry can't be found
     *
     * @param ElementInterface $entry
     * @return string
     */
    public function getCardHtml(ElementInterface $entry): string
    {
        $isRevision = $entry->getIsRevision();

        return Cp::elementCardHtml($entry, [
            'autoReload' => !$isRevision,
            'showDraftName' => !$isRevision,
            'showStatus' => !$isRevision,
            'showThumb' => !$isRevision,
            'attributes' => [
                'class' => array_filter([$isRevision ? 'cke-entry-card' : null]),
            ],
            'hyperlink' => false,
            'showEditButton' => false,
        ]);
    }

    /**
     * @inheritdoc
     */
    public function getEagerLoadingMap(array $sourceElements): array|null|false
    {
        // Get the source element IDs
        $sourceElementIds = [];

        foreach ($sourceElements as $sourceElement) {
            $sourceElementIds[] = $sourceElement->id;
        }

        // Return any relation data on these elements, defined with this field
        $map = (new Query())
            ->select([
                'source' => 'elements_owners.ownerId',
                'target' => 'entries.id',
            ])
            ->from(['entries' => Table::ENTRIES])
            ->innerJoin(['elements_owners' => Table::ELEMENTS_OWNERS], [
                'and',
                '[[elements_owners.elementId]] = [[entries.id]]',
                ['elements_owners.ownerId' => $sourceElementIds],
            ])
            ->where(['entries.fieldId' => $this->id])
            ->orderBy(['elements_owners.sortOrder' => SORT_ASC])
            ->all();

        return [
            'elementType' => Entry::class,
            'map' => $map,
            'criteria' => [
                'fieldId' => $this->id,
                'allowOwnerDrafts' => true,
                'allowOwnerRevisions' => true,
            ],
        ];
    }

    /**
     * @innheritdoc
     */
    public function canMergeInto(FieldInterface $persistingField, ?string &$reason): bool
    {
        if (!$persistingField instanceof self) {
            $reason = 'CKEditor fields can only be merged into other CKEditor fields.';
            return false;
        }

        return true;
    }

    /**
     * @inheritdoc
     */
    public function afterMergeFrom(FieldInterface $outgoingField)
    {
        Db::update(DbTable::ENTRIES, ['fieldId' => $this->id], ['fieldId' => $outgoingField->id]);
        parent::afterMergeFrom($outgoingField);
    }

    /**
     * @inheritdoc
     */
    protected function createFieldData(string $content, ?int $siteId): HtmlFieldData
    {
        return new FieldData($content, $siteId, $this);
    }

    /**
     * @inheritdoc
     */
    protected function inputHtml(mixed $value, ?ElementInterface $element, bool $inline): string
    {
        return $this->_inputHtml($value, $element, false);
    }

    /**
     * @inheritdoc
     */
    public function getStaticHtml(mixed $value, ?ElementInterface $element): string
    {
        return $this->_inputHtml($value, $element, true);
    }

    /**
     * Return the HTML for the CKEditor field.
     *
     * @param mixed $value
     * @param ElementInterface $element
     * @param bool $static
     * @return string
     * @throws InvalidConfigException
     * @throws Throwable
     */
    private function _inputHtml(mixed $value, ?ElementInterface $element, bool $static): string
    {
        $view = Craft::$app->getView();
        $view->registerAssetBundle(CkeditorAsset::class);

        $transforms = $this->_transforms();

        if ($this->defaultTransform) {
            $defaultTransform = Craft::$app->getImageTransforms()->getTransformByUid($this->defaultTransform);
        } else {
            $defaultTransform = null;
        }

        // Toolbar cleanup
        $toolbar = array_merge($this->toolbar);

        if ($element?->id) {
            // rewrite createEntry into per-entry-type buttons
            $toolbar = array_merge($this->toolbar);
            $createEntryBtnPos = array_search('createEntry', $toolbar);
            if ($createEntryBtnPos !== false) {
                $entryTypes = $this->getEntryTypes();
                if (!empty($entryTypes)) {
                    $buttons = [
                        ...array_map(fn(CkeEntryType $entryType) => "createEntry-$entryType->uid", $entryTypes),
                        'createEntry',
                    ];
                } else {
                    $buttons = [];
                }
                array_splice($toolbar, $createEntryBtnPos, 1, $buttons);
            }
        } else {
            // remove the createEntry button
            ArrayHelper::removeValue($toolbar, 'createEntry');
        }

        if (!$this->isSourceEditingAllowed(Craft::$app->getUser()->getIdentity())) {
            ArrayHelper::removeValue($toolbar, 'sourceEditing');
        }

        $toolbar = array_values($toolbar);

        $id = Html::id($this->handle);
        $idJs = Json::encode($view->namespaceInputId($id));
        $wordCountId = "$id-counts";
        $wordCountIdJs = Json::encode($view->namespaceInputId($wordCountId));

        $baseConfig = array_filter([
            'defaultTransform' => $defaultTransform?->handle,
            'elementSiteId' => $element?->siteId,
            'accessibleFieldName' => $this->_accessibleFieldName($element),
            'describedBy' => $this->_describedBy($view),
            'entryTypeOptions' => $this->_entryTypeOptions(),
            'findAndReplace' => [
                'uiType' => 'dropdown',
            ],
            'nestedElementAttributes' => $element?->id ? array_filter([
                'elementType' => Entry::class,
                'ownerId' => $element->id,
                'fieldId' => $this->id,
                'siteId' => Entry::isLocalized() ? $element->siteId : null,
            ]) : null,
            'heading' => [
                'options' => [
                    [
                        'model' => 'paragraph',
                        'title' => 'Paragraph',
                        'class' => 'ck-heading_paragraph',
                    ],
                    ...array_map(fn(int $level) => [
                        'model' => "heading$level",
                        'view' => "h$level",
                        'title' => "Heading $level",
                        'class' => "ck-heading_heading$level",
                    ], $this->headingLevels ?: []),
                ],
            ],
            'image' => [
                'toolbar' => [
                    ...(!empty($transforms) ? ['transformImage', '|'] : []),
                    'toggleImageCaption',
                    'imageTextAlternative',
                    '|',
                    'imageEditor',
                ],
            ],
            'imageMode' => $this->imageMode,
            'imageSources' => $this->_imageSources(),
            'imageModalSettings' => $this->_imageModalSettings(),
            'imageFieldHandle' => $this->getImageField()?->handle,
            'assetSelectionCriteria' => $this->_assetSelectionCriteria(),
            'defaultUploadFolderId' => $this->_defaultUploadFolderId(),
            'linkOptions' => $this->_linkOptions($element),
            'advancedLinkFields' => $this->_advancedLinkFields(),
            'table' => [
                'contentToolbar' => [
                    'tableRow',
                    'tableColumn',
                    'mergeTableCells',
                ],
            ],
            'transforms' => $transforms,
            'ui' => [
                'viewportOffset' => ['top' => 44],
                'poweredBy' => [
                    'position' => 'outside',
                    'label' => '',
                ],
            ],
        ]);

        // Give plugins/modules a chance to modify the config
        $event = new ModifyConfigEvent([
            'baseConfig' => $baseConfig,
            'toolbar' => $toolbar,
        ]);
        $this->trigger(self::EVENT_MODIFY_CONFIG, $event);

        $removePlugins = Collection::empty();

        // remove MediaEmbedToolbar for now
        // see: https://github.com/ckeditor/ckeditor5-react/issues/267
        // and: https://github.com/ckeditor/ckeditor5/issues/9824
        // for more info
        $removePlugins->push('MediaEmbedToolbar');

        if (count($transforms) === 0) {
            $removePlugins->push('ImageTransforms');
        }

        // Avoid loading plugins not included in the toolbar
        $unusedPlugins = collect(CkeditorConfig::$pluginButtonMap)
            ->filter(function(array $item) use ($event) {
                $buttons = $item['buttons'] ?? [];

                // If there are no buttons defined, always load it
                if (empty($buttons)) {
                    return false;
                }

                return collect($event->toolbar)
                    ->doesntContain(function(string $toolbarItem) use ($buttons) {
                        return in_array($toolbarItem, $buttons);
                    });
            })
            ->map(fn(array $item) => $item['plugins'] ?? [])
            ->flatten();

        $removePlugins->push(...$unusedPlugins->all());

        $plugins = CkeditorConfig::getPluginsByPackage();

        $plugins = collect($plugins)
            ->mapWithKeys(fn(array $plugins, string $namespace) => [
                $namespace => collect($plugins)
                    ->reject(fn($plugin) => in_array($plugin, $removePlugins->toArray())),
            ]);

        $configPlugins = '[' . $plugins->flatten()->join(',') . ']';

        $imports = CkeditorConfig::getImportStatements();

        // Add the translation import
        $uiLanguage = BaseCkeditorPackageAsset::uiLanguage();
        $importCompliantUiLanguage = BaseCkeditorPackageAsset::getImportCompliantLanguage(BaseCkeditorPackageAsset::uiLanguage());
        $uiTranslationImport = "import coreTranslations from 'ckeditor5/translations/$importCompliantUiLanguage.js';";

        $configJs = $this->configJs();

        $view->registerScriptWithVars(fn(
            $baseConfigJs,
            $toolbarJs,
            $languageJs,
            $showWordCountJs,
            $wordLimitJs,
            $characterLimitJs,
            $imageMode,
        ) => <<<JS
$imports
$uiTranslationImport
import {create} from '@craftcms/ckeditor';

(($) => {
  let instance;
  const customConfig = $configJs;
  const config = Object.assign({
    translations: [coreTranslations],
    language: $languageJs,
  }, $baseConfigJs, customConfig, {
    plugins: $configPlugins,
    removePlugins: []
  });


  if (!jQuery.isPlainObject(config.toolbar)) {
    config.toolbar = {};
  }
  config.toolbar.items = $toolbarJs;

  // special case for heading config, because of the Heading Levels
  // see https://github.com/craftcms/ckeditor/issues/431
  const baseHeadings = $baseConfigJs?.heading?.options;
  const configOptionHeadings = customConfig?.heading?.options;
  const nativeHeadingModels = ['paragraph', 'heading1', 'heading2', 'heading3', 'heading4', 'heading5', 'heading6'];

  if (baseHeadings && configOptionHeadings && baseHeadings != configOptionHeadings) {
    let headings = new Object();

    // allow all options from baseHeading
    baseHeadings.forEach((baseHeading) => {
      headings[baseHeading.model] = baseHeading;
    });

    configOptionHeadings.forEach((configOptionHeading) => {
      // if a baseHeading option has a custom config in the configOptionHeadings - use that custom config
      if (typeof headings[configOptionHeading.model] !== 'undefined') {
        headings[configOptionHeading.model] = configOptionHeading;
      }
      // if custom config contains a fully custom option (not a native heading model) - allow it
      if (!nativeHeadingModels.includes(configOptionHeading.model)) {
        headings[configOptionHeading.model] = configOptionHeading;
      }
    });

    // use the headings
    config.heading.options = Object.values(headings);
  }

  const extraRemovePlugins = [];
  if ($showWordCountJs) {
    if (typeof config.wordCount === 'undefined') {
      config.wordCount = {};
    }
    const onUpdate = config.wordCount.onUpdate || (() => {});
    config.wordCount.onUpdate = (stats) => {
      const statText = [];
      if (config.wordCount.displayWords || typeof config.wordCount.displayWords === 'undefined') {
        statText.push(Craft.t('ckeditor', '{num, number} {num, plural, =1{word} other{words}}', {
          num: stats.words
        }));
      }
      if (config.wordCount.displayCharacters) { // false by default
        statText.push(Craft.t('ckeditor', '{num, number} {num, plural, =1{character} other{characters}}', {
          num: stats.characters
        }));
      }
      const container = $('#' + $wordCountIdJs);
      container.html(Craft.escapeHtml(statText.join(', ')) || '&nbsp;');
      if ($wordLimitJs) {
        if (stats.words > $wordLimitJs) {
          container.addClass('error');
        } else if (stats.words >= Math.floor($wordLimitJs * .9)) {
          container.addClass('warning');
        } else {
          container.removeClass('error warning');
        }
      }
      if ($characterLimitJs) {
        if (stats.characters > $characterLimitJs) {
          container.addClass('error');
        } else if (stats.characters >= Math.floor($characterLimitJs * .9)) {
          container.addClass('warning');
        } else {
          container.removeClass('error warning');
        }
      }
      onUpdate(stats);
    };
  } else {
    extraRemovePlugins.push('WordCount');
  }
  if (extraRemovePlugins.length) {
    config.removePlugins.push(...extraRemovePlugins);
  }

  instance = create($idJs, config);

  if (Boolean($static)) {
    instance.then((editor) => {
      editor.enableReadOnlyMode($idJs);
    });
  }
})(jQuery);
JS,
            [
                $event->baseConfig,
                $event->toolbar,
                [
                    'ui' => $uiLanguage,
                    'content' => $element?->getSite()->language ?? Craft::$app->language,
                    'textPartLanguage' => static::textPartLanguage(),
                ],
                $this->showWordCount,
                $this->wordLimit ?: 0,
                $this->characterLimit ?: 0,
                $this->imageMode,
            ],
            View::POS_END,
            ['type' => 'module']
        );

        $value = $this->prepValueForInput($value, $element);
        $inputId = Html::id('input-ckeditor-' . $id);
        $html = Html::textarea($this->handle, $value, [
            'id' => $id,
            'class' => 'hidden',
        ]);

        if ($this->showWordCount) {
            $html .= Html::tag('div', '&nbsp;', [
                'id' => $wordCountId,
                'class' => ['ck-word-count', 'light', 'smalltext'],
            ]);
        }

        $css = $this->css();
        if ($css) {
            $imports = [];
            preg_match_all('/@import .+;?/m', $css, $importMatches);
            for ($i = 0; $i < count($importMatches[0]); $i++) {
                $imports[] = $importMatches[0][$i];
                $css = str_replace($importMatches[0][$i], '', $css);
            }
            if (!empty($imports)) {
                $view->registerCss(implode("\n", $imports));
            }
            $css = trim($css);
            if ($css !== '') {
                $view->registerCss("#{$view->namespaceInputId($inputId)} { $css }");
            }
        }

        return Html::tag('div', $html, [
            'class' => array_keys(array_filter([
                'ckeditor-container' => true,
                'ck-with-show-word-count' => $this->showWordCount,
            ])),
            'id' => $inputId,
            'data' => [
                'element-id' => $element?->id,
            ],
        ]);
    }

    private function configJs(): string
    {
        if (isset($this->jsFile) && strtolower(pathinfo($this->jsFile, PATHINFO_EXTENSION)) === 'json') {
            $this->options = self::jsonFileContents($this->jsFile);
        }

        if (isset($this->options)) {
            // translate the placeholder text
            if (isset($this->options['placeholder']) && is_string($this->options['placeholder'])) {
                $this->options['placeholder'] = Craft::t('site', $this->options['placeholder']);
            }

            return Json::encode($this->options);
        }

        if (isset($this->jsFile)) {
            $js = self::jsFileContents($this->jsFile);
        } else {
            $js = $this->js;
        }

        if ($js === null) {
            return '{}';
        }

        return <<<JS
(() => {
  $js
})()
JS;
    }

    private function css(): ?string
    {
        if (isset($this->cssFile)) {
            return self::cssFileContents($this->cssFile);
        }

        return $this->css;
    }

    /**
     * @inheritdoc
     */
    protected function purifierConfig(): HTMLPurifier_Config
    {
        $purifierConfig = parent::purifierConfig();

        // adjust the purifier config based on the CKEditor config
        $purifierConfig = $this->_adjustPurifierConfig($purifierConfig);

        // Give plugins a chance to modify the HTML Purifier config, or add new ones
        $event = new ModifyPurifierConfigEvent([
            'config' => $purifierConfig,
        ]);

        $this->trigger(self::EVENT_MODIFY_PURIFIER_CONFIG, $event);

        return $event->config;
    }

    /**
     * @inheritdoc
     */
    protected function prepValueForInput($value, ?ElementInterface $element, bool $static = false): string
    {
        if ($value instanceof FieldData) {
            $chunks = $value->getChunks(false)
                ->filter(fn(BaseChunk $chunk) => !$chunk instanceof EntryChunk || $chunk->getEntry() !== null);

            /** @var Entry[] $entries */
            $entries = $chunks
                ->filter(fn(BaseChunk $chunk) => $chunk instanceof EntryChunk)
                ->keyBy(fn(EntryChunk $chunk) => $chunk->entryId)
                ->map(fn(EntryChunk $chunk) => $chunk->getEntry())
                ->all();

            if (!$static) {
                ElementHelper::swapInProvisionalDrafts($entries);
            }

            $value = $chunks
                ->map(function(BaseChunk $chunk) use ($static, $entries, $element) {
                    if ($chunk instanceof Markup) {
                        return $chunk->rawHtml;
                    }

                    /** @var EntryChunk $chunk */
                    $entry = $entries[$chunk->entryId];

                    try {
                        // set up-to-date owner on the entry
                        // e.g. when provisional draft was created for the owner and the page was reloaded
                        $entry->setOwner($element);
                        if ($entry->id === $entry->getPrimaryOwnerId()) {
                            $entry->setPrimaryOwner($element);
                        }

                        $cardHtml = $this->getCardHtml($entry);
                    } catch (InvalidConfigException) {
                        // this can happen e.g. when the entry type has been deleted
                        return '';
                    }

                    if ($static) {
                        return $cardHtml;
                    }

                    return Html::tag('craft-entry', options: [
                        'data' => [
                            'entry-id' => $entry->isProvisionalDraft ? $entry->getCanonicalId() : $entry->id,
                            'site-id' => $entry->siteId,
                            'card-html' => $cardHtml,
                        ],
                    ]);
                })
                ->join('');
        }

        if ($value !== null) {
            // Replace NBSP chars with entities, and remove XHTML formatting from  self-closing HTML elements,
            // so CKEditor doesn’t need to normalize them and cause the input value to change
            // (https://github.com/craftcms/cms/issues/13112)
            $pairs = [
                ' ' => '&nbsp;',
            ];
            foreach (array_keys(Html::$voidElements) as $tag) {
                $pairs["<$tag />"] = "<$tag>";
            }
            $value = strtr($value, $pairs);

            // Redactor to CKEditor syntax for <figure>
            // (https://github.com/craftcms/ckeditor/issues/96)
            $value = $this->_normalizeFigures($value);
            // Redactor to CKEditor syntax for <pre>
            // (https://github.com/craftcms/ckeditor/issues/258)
            $value = $this->_normalizePreTags($value);
        }

        return parent::prepValueForInput($value, $element);
    }

    /**
     * Returns if user belongs to a group whose members are allowed to edit source even if they're not admins
     *
     * @param User $user
     * @return bool
     */
    private function isSourceEditingAllowed(User $user): bool
    {
        if ($this->sourceEditingGroups === '*') {
            return true;
        }

        if ($this->sourceEditingGroups === null) {
            return false;
        }

        $sourceEditingGroups = array_flip($this->sourceEditingGroups);

        if ($user->admin && isset($sourceEditingGroups['__ADMINS__'])) {
            return true;
        }

        foreach ($user->getGroups() as $group) {
            if (isset($sourceEditingGroups[$group->uid])) {
                return true;
            }
        }

        return false;
    }

    /**
     * @inheritdoc
     */
    protected function searchKeywords(mixed $value, ElementInterface $element): string
    {
        /** @var FieldData|null $value */
        if (!$value) {
            return '';
        }

        $keywords = $value->getChunks()
            ->filter(fn(BaseChunk $chunk) => $chunk instanceof Markup)
            ->map(fn(Markup $chunk) => $chunk->getHtml())
            ->join(' ');

        if (!Craft::$app->getDb()->getSupportsMb4()) {
            $keywords = StringHelper::encodeMb4($keywords);
        }

        $keywords .= self::entryManager($this)->getSearchKeywords($element);

        return $keywords;
    }

    /**
     * Normalizes <figure> tags, ensuring they have an `image` or `media` class depending on their contents,
     * and they contain a <div data-oembed-url> or <oembed> tag, depending on the `mediaEmbed.previewsInData`
     * CKEditor config option.
     *
     * @param string $value
     * @return string
     */
    private function _normalizeFigures(string $value): string
    {
        // Ensure <figure> tags have `image` or `media` classes
        $offset = 0;
        while (preg_match('/<figure\b[^>]*>\s*<(img|iframe)\b.*?<\/figure>/is', $value, $match, PREG_OFFSET_CAPTURE, $offset)) {
            /** @var int $startPos */
            $startPos = $match[0][1];
            $endPos = $startPos + strlen($match[0][0]);

            $class = strtolower($match[1][0]) === 'img' ? 'image' : 'media';
            try {
                $tag = Html::modifyTagAttributes($match[0][0], [
                    'class' => [$class],
                ]);
            } catch (InvalidHtmlTagException) {
                $offset = $endPos;
                continue;
            }

            $value = substr($value, 0, $startPos) . $tag . substr($value, $endPos);
            $offset = $startPos + strlen($tag);
        }

        $previewsInData = $this->options['mediaEmbed']['previewsInData'] ?? false;

        return preg_replace_callback(
            '/(<figure\b[^>]*>\s*)(<iframe\b([^>]*)src="([^"]+)"([^>]*)>(.*?)<\/iframe>)/i',
            function(array $match) use ($previewsInData) {
                $absUrl = UrlHelper::isProtocolRelativeUrl($match[4]) ? "https:$match[4]" : $match[4];
                return $previewsInData
                    ? sprintf(
                        '%s<div data-oembed-url="%s">%s</div>',
                        $match[1],
                        $absUrl,
                        $match[2],
                    )
                    : sprintf(
                        '%s<oembed%surl="%s"%s>%s</oembed>',
                        $match[1],
                        $match[3],
                        $absUrl,
                        $match[5],
                        $match[6],
                    );
            },
            $value,
        );
    }

    /**
     * Normalizes <pre> tags, ensuring they have a <code> tag inside them.
     * If there's no <code> tag in there, ensure it's added with class="language-plaintext".
     *
     * @param string $value
     * @return string
     */
    private function _normalizePreTags(string $value): string
    {
        $offset = 0;
        while (preg_match('/<pre\b[^>]*>\s*(.*?)<\/pre>/is', $value, $match, PREG_OFFSET_CAPTURE, $offset)) {
            /** @var int $startPos */
            $startPos = $match[1][1];
            $endPos = $startPos + strlen($match[1][0]);
            $preContent = $match[1][0];

            // if there's already a <code tag inside, leave it alone and carry on
            if (str_starts_with($preContent, '<code')) {
                $offset = $startPos + strlen($preContent);
                continue;
            }

            $preContent = Html::tag('code', $preContent, [
                'class' => 'language-plaintext',
            ]);

            $value = substr($value, 0, $startPos) . $preContent . substr($value, $endPos);
            $offset = $startPos + strlen($preContent);
        }

        return $value;
    }

    /**
     * Returns an array of selected advanced link fields that the field should show to the author.
     * The fields are returned in the order defined in the field's settings.
     *
     * @return array
     */
    private function _advancedLinkFields(): array
    {
        if (empty($this->advancedLinkFields)) {
            return [];
        }

        $fields = [];
        foreach (CkeditorConfig::advanceLinkOptions() as $option) {
            if (in_array($option['value'], $this->advancedLinkFields)) {
                $fields[] = $option;
            }
        }

        // sort by the order of $this->advancedLinkFields
        $fields = array_column($fields, null, 'value');
        $order = array_flip($this->advancedLinkFields);
        uksort($fields, function($a, $b) use ($order) {
            return $order[$a] <=> $order[$b];
        });

        return array_values($fields);
    }

    /**
     * Returns the link options available to the field.
     *
     * Each link option is represented by an array with the following keys:
     * - `label` (required) – the user-facing option label that appears in the Link dropdown menu
     * - `elementType` (required) – the element type class that the option should be linking to
     * - `sources` (optional) – the sources that the user should be able to select elements from
     * - `criteria` (optional) – any specific element criteria parameters that should limit which elements the user can select
     *
     * @param ElementInterface|null $element The element the field is associated with, if there is one
     * @return array
     */
    private function _linkOptions(?ElementInterface $element): array
    {
        $linkOptions = [];

        $sectionSources = $this->_entrySources($element);
        $categorySources = $this->_categorySources($element);
        $volumeSources = $this->_assetSources(true);

        if (!empty($sectionSources)) {
            $linkOptions[] = [
                'label' => Entry::displayName(),
                'elementType' => Entry::class,
                'refHandle' => Entry::refHandle(),
                'sources' => $sectionSources,
                'criteria' => ['uri' => ':notempty:'],
            ];
        }

        if (!empty($categorySources)) {
            $linkOptions[] = [
                'label' => Category::displayName(),
                'elementType' => Category::class,
                'refHandle' => Category::refHandle(),
                'sources' => $categorySources,
                'criteria' => ['uri' => ':notempty:'],
            ];
        }

        if (!empty($volumeSources)) {
            $linkOptions[] = [
                'label' => Asset::displayName(),
                'elementType' => Asset::class,
                'refHandle' => Asset::refHandle(),
                'sources' => $volumeSources,
                'criteria' => $this->_assetSelectionCriteria(),
            ];
        }

        // Give plugins a chance to add their own
        $event = new DefineLinkOptionsEvent([
            'linkOptions' => $linkOptions,
        ]);
        $this->trigger(self::EVENT_DEFINE_LINK_OPTIONS, $event);
        $linkOptions = $event->linkOptions;

        // Fill in any missing ref handles
        foreach ($linkOptions as &$linkOption) {
            if (!isset($linkOption['refHandle'])) {
                /** @var class-string<ElementInterface> $class */
                $class = $linkOption['elementType'];
                $linkOption['refHandle'] = $class::refHandle() ?? $class;
            }
        }

        return $linkOptions;
    }

    /**
     * Returns the available entry sources.
     *
     * @param ElementInterface|null $element The element the field is associated with, if there is one
     * @param bool $showSingles Whether to include Singles in the available sources
     * @return array
     */
    private function _entrySources(?ElementInterface $element, bool $showSingles = false): array
    {
        $sources = [];
        $sections = Craft::$app->getEntries()->getAllSections();

        // Get all sites
        $sites = Craft::$app->getSites()->getAllSites();

        foreach ($sections as $section) {
            if ($section->type === Section::TYPE_SINGLE) {
                $showSingles = true;
            } elseif ($element) {
                $sectionSiteSettings = $section->getSiteSettings();
                foreach ($sites as $site) {
                    if (isset($sectionSiteSettings[$site->id]) && $sectionSiteSettings[$site->id]->hasUrls) {
                        $sources[] = 'section:' . $section->uid;
                        break;
                    }
                }
            }
        }

        $sources = array_values(array_unique($sources));

        if ($showSingles) {
            array_unshift($sources, 'singles');
        }

        if (!empty($sources)) {
            array_unshift($sources, '*');
        }

        // include custom sources
        $customSources = $this->_getCustomSources(Entry::class);
        if (!empty($customSources)) {
            $sources = array_merge($sources, $customSources);
        }

        return $sources;
    }

    /**
     * Returns the available category sources.
     *
     * @param ElementInterface|null $element The element the field is associated with, if there is one
     * @return array
     */
    private function _categorySources(?ElementInterface $element): array
    {
        if (!$element) {
            return [];
        }

        $sources = Collection::make(Craft::$app->getCategories()->getAllGroups())
            ->filter(fn(CategoryGroup $group) => $group->getSiteSettings()[$element->siteId]?->hasUrls ?? false)
            ->map(fn(CategoryGroup $group) => "group:$group->uid")
            ->values()
            ->all();

        // include custom sources
        $customSources = $this->_getCustomSources(Category::class);
        if (!empty($customSources)) {
            $sources = array_merge($sources, $customSources);
        }

        return $sources;
    }

    private function _imageSources(): array
    {
        return $this->imageMode === self::IMAGE_MODE_IMG
            ? $this->_assetSources()
            : $this->getImageField()?->getInputSources() ?? [];
    }

    private function _imageModalSettings(): array
    {
        $settings = [];

        if ($this->imageMode === self::IMAGE_MODE_ENTRIES) {
            $field = $this->getImageField();
            if ($field) {
                $settings += [
                    'indexSettings' => [
                        'showFolders' => !$field->restrictLocation || $field->allowSubfolders,
                    ],
                ];
            }
        }

        return $settings;
    }

    /**
     * Returns the available asset sources.
     *
     * @param bool $withUrlsOnly Whether to only return volumes that have filesystems that have public URLs
     * @return string[]
     */
    private function _assetSources(bool $withUrlsOnly = false): array
    {
        if (!$this->availableVolumes) {
            return [];
        }

        $volumes = Collection::make(Craft::$app->getVolumes()->getAllVolumes());

        if (is_array($this->availableVolumes)) {
            $volumes = $volumes->filter(fn(Volume $volume) => in_array($volume->uid, $this->availableVolumes));
        }

        if (!$this->showUnpermittedVolumes) {
            $userService = Craft::$app->getUser();
            $volumes = $volumes->filter(fn(Volume $volume) => $userService->checkPermission("viewAssets:$volume->uid"));
        }

        if ($withUrlsOnly) {
            // only allow volumes that belong to FS that have public URLs
            $volumes = $volumes->filter(fn(Volume $volume) => $volume->getFs()->hasUrls);
        }

        $sources = $volumes
            ->map(fn(Volume $volume) => "volume:$volume->uid")
            ->values()
            ->all();

        // include custom sources
        $customSources = $this->_getCustomSources(Asset::class);
        if (!empty($customSources)) {
            $sources = array_merge($sources, $customSources);
        }

        return $sources;
    }

    /**
     * Returns the asset selection criteria.
     *
     * @return array
     */
    private function _assetSelectionCriteria(): array
    {
        $criteria = [];
        if ($this->showUnpermittedFiles) {
            $criteria['uploaderId'] = null;
        }

        return $criteria;
    }

    /**
     * Returns the default upload folder ID.
     *
     * @return int|null
     */
    private function _defaultUploadFolderId(): ?int
    {
        if ($this->imageMode === self::IMAGE_MODE_ENTRIES) {
            $imageField = $this->getImageField();
            if (
                !$imageField?->defaultUploadLocationSource ||
                !preg_match('/^volume:(.+)$/', $imageField->defaultUploadLocationSource, $matches)
            ) {
                return null;
            }

            $volume = Craft::$app->getVolumes()->getVolumeByUid($matches[1]);
            $subpath = $imageField->defaultUploadLocationSubpath;
        } else {
            if (!$this->defaultUploadLocationVolume) {
                return null;
            }

            $volume = Craft::$app->getVolumes()->getVolumeByUid($this->defaultUploadLocationVolume);
            $subpath = $this->defaultUploadLocationSubpath;
        }

        if (!$volume) {
            return null;
        }

        [$subpath, $folder] = AssetsHelper::resolveSubpath($volume, trim($subpath ?? '', '/'));

        // Ensure that the folder exists
        if (!$folder) {
            $folder = Craft::$app->getAssets()->ensureFolderByFullPathAndVolume($subpath, $volume);
        }

        return $folder->id;
    }

    /**
     * Returns custom element sources keys for given element type.
     *
     * @param string $elementType
     * @return array
     */
    private function _getCustomSources(string $elementType): array
    {
        $customSources = [];
        $elementSources = Craft::$app->getElementSources()->getSources($elementType, 'modal');
        foreach ($elementSources as $elementSource) {
            if ($elementSource['type'] === ElementSources::TYPE_CUSTOM && isset($elementSource['key'])) {
                $customSources[] = $elementSource['key'];
            }
        }

        return $customSources;
    }

    /**
     * Get available transforms.
     *
     * @return array
     */
    private function _transforms(): array
    {
        if ($this->imageMode !== self::IMAGE_MODE_IMG || !$this->availableTransforms) {
            return [];
        }

        $transforms = Collection::make(Craft::$app->getImageTransforms()->getAllTransforms());

        if (is_array($this->availableTransforms)) {
            $transforms = $transforms->filter(fn(ImageTransform $transform) => in_array($transform->uid, $this->availableTransforms));
        }

        return $transforms->map(fn(ImageTransform $transform) => [
            'handle' => $transform->handle,
            'name' => $transform->name,
        ])->values()->all();
    }

    /**
     * Adjust HTML Purifier based on items added to the toolbar
     *
     * @param HTMLPurifier_Config $purifierConfig
     * @return HTMLPurifier_Config
     * @throws HTMLPurifier_Exception
     */
    private function _adjustPurifierConfig(HTMLPurifier_Config $purifierConfig): HTMLPurifier_Config
    {
        // These will come back as indexed (key => true) arrays
        $allowedTargets = $purifierConfig->get('Attr.AllowedFrameTargets');
        $allowedRels = $purifierConfig->get('Attr.AllowedRel');
        if (isset($this->options['link']['addTargetToExternalLinks'])) {
            $allowedTargets['_blank'] = true;
        }
        foreach ($this->options['link']['decorators'] ?? [] as $decorator) {
            if (isset($decorator['attributes']['target'])) {
                $allowedTargets[$decorator['attributes']['target']] = true;
            }
            if (isset($decorator['attributes']['rel'])) {
                foreach (explode(' ', $decorator['attributes']['rel']) as $rel) {
                    $allowedRels[$rel] = true;
                }
            }
        }
        $purifierConfig->set('Attr.AllowedFrameTargets', array_keys($allowedTargets));
        $purifierConfig->set('Attr.AllowedRel', array_keys($allowedRels));

        // advanced link fields
        if (!empty($this->advancedLinkFields)) {
            if (in_array('rel', $this->advancedLinkFields)) {
                $allowedRels = $purifierConfig->get('Attr.AllowedRel');
                // allow any rel values
                $allowedRels['*'] = true;
                $purifierConfig->set('Attr.AllowedRel', array_keys($allowedRels));
            }

            // This is needed so that the noopener and noreferrer rel attributes
            // are not added by default on save when you turn on target="_blank".
            // This then messes with the ability to add rel attributes independently.
            if (in_array('target', $this->advancedLinkFields)) {
                $purifierConfig->set('HTML.TargetNoopener', false);
                $purifierConfig->set('HTML.TargetNoreferrer', false);
            }
        }

        // we have to get the HTML definition AFTER setting HTML.TargetNoopener, HTML.TargetNoreferrer
        // otherwise none of the adjustments below will work!
        /** @var HTMLPurifier_HTMLDefinition|null $def */
        $def = $purifierConfig->getDefinition('HTML', true);

        if (!empty($this->advancedLinkFields) && in_array('ariaLabel', $this->advancedLinkFields)) {
            $def?->addAttribute('a', 'aria-label', 'Text');
        }

        if (in_array('todoList', $this->toolbar)) {
            // Add input[type=checkbox][disabled][checked] to the definition
            $def?->addElement('input', 'Inline', 'Inline', '', [
                'type' => 'Enum#checkbox',
                'disabled' => 'Enum#disabled',
                'checked' => 'Enum#checked',
            ]);
        }

        if (in_array('numberedList', $this->toolbar)) {
            $def?->addAttribute('ol', 'style', 'Text');
            $def?->addAttribute('ol', 'reversed', 'Text');
        }

        if (in_array('bulletedList', $this->toolbar)) {
            $def?->addAttribute('ul', 'style', 'Text');
        }

        if ($this->imageMode === self::IMAGE_MODE_ENTRIES || in_array('createEntry', $this->toolbar)) {
            $def?->addElement('craft-entry', 'Inline', 'Inline', '', [
                'data-entry-id' => 'Number',
                'data-site-id' => 'Number',
            ]);
        }

        return $purifierConfig;
    }

    /**
     * Returns an accessible name for the field (to be plugged into CKEditor's main editing area aria-label).
     *
     * @param ElementInterface|null $element
     * @return string
     */
    private function _accessibleFieldName(?ElementInterface $element = null): string
    {
        return Craft::t('site', $this->name) .
            ($element?->getFieldLayout()?->getField($this->handle)?->required ? ' ' . Craft::t('site', 'Required') : '') .
            ($this->getIsTranslatable($element) ? ' ' . $this->getTranslationDescription($element) : '');
    }

    /**
     * Namespaces field's $describedBy value to be passed to the field.
     *
     * @param View $view
     * @return string
     */
    private function _describedBy(View $view): string
    {
        if (!empty($this->describedBy)) {
            $describedByArray = explode(' ', $this->describedBy);
            $namespace = trim(preg_replace('/\[|\]/', '-', $view->getNamespace()), '-');
            foreach ($describedByArray as $key => $item) {
                $describedByArray[$key] = "$namespace-$item";
            }

            return implode(' ', $describedByArray);
        }

        return '';
    }

    private function _entryTypeOptions(): array
    {
        return array_map(fn(CkeEntryType $entryType) => [
            'color' => $entryType->getColor()?->value,
            'expanded' => $entryType['expanded'] ?? false,
            'icon' => $entryType->icon ? Cp::iconSvg($entryType->icon) : null,
            'label' => Craft::t('site', $entryType->name),
            'uid' => $entryType->uid,
            'value' => $entryType->id,
        ], $this->getEntryTypes());
    }

    /**
     * @deprecated in 4.5.0
     */
    public function getEnableSourceEditingForNonAdmins(): bool
    {
        return $this->sourceEditingGroups === '*';
    }

    /**
     * @deprecated in 4.5.0
     */
    public function setEnableSourceEditingForNonAdmins(bool $value): void
    {
        $this->sourceEditingGroups = $value ? '*' : ['__ADMINS__'];
    }

    /**
     * @inheritdoc
     */
    public function propagateValue(ElementInterface $from, ElementInterface $to): void
    {
        $wasValueEmpty = $this->isValueEmpty($to->getFieldValue($this->handle), $to);
        parent::propagateValue($from, $to);

        if (!$from->propagateAll && $wasValueEmpty) {
            // NestedElementManager won't duplicate the nested entries automatically,
            // because the field has a value in the target site (the HTML content), so isValueEmpty() is false.
            self::entryManager($this)->duplicateNestedElements($from, $to, force: true);
        }

        // when the field is translatable (e.g. for each site);
        // you create a new entry and add nested entry into a cke field while the entry is fresh
        // during autosave, that nested entry gets duplicated into the other site correctly (along with value adjustment)
        // however when you then fully save the owner,
        // the duplication is triggered twice - from ElementsController::actionApplyDraft() and from Drafts::removeDraftData()
        // the changes in 5.9.0 mean that the nested entries get duplicated and adjusted twice
        // (via NEM::saveNestedElements > duplicateNestedElements() route)
        // causing the nested entry in the site we propagated to, to have a wrong ID
        // the CKE content references X, but X nested entry is marked as deleted and Y nested entry  was created in its place
        Event::on(Drafts::class, Drafts::EVENT_BEFORE_APPLY_DRAFT, function(DraftEvent $event) {
            if ($event->draft->propagateAll && $event->draft->getIsUnpublishedDraft()) {
                $event->draft->propagateAll = false;
            }
        });
    }
}
