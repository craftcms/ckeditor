<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace CraftCms\Ckeditor;

use Closure;
use CraftCms\Ckeditor\Data\BaseChunk;
use CraftCms\Ckeditor\Data\Entry as EntryChunk;
use CraftCms\Ckeditor\Data\FieldData;
use CraftCms\Ckeditor\Data\Markup;
use CraftCms\Ckeditor\Events\EditorConfigResolving;
use CraftCms\Ckeditor\Events\HtmlSanitizerConfigResolving;
use CraftCms\Ckeditor\Events\LinkOptionsResolving;
use CraftCms\Ckeditor\Gql\Generator;
use CraftCms\Ckeditor\Support\CkeditorAssets;
use CraftCms\Ckeditor\Ui\Controls\CkeditorControl;
use CraftCms\Ckeditor\Support\CkeditorConfig;
use CraftCms\Ckeditor\Support\CkeditorConfigSchema;
use CraftCms\Ckeditor\Data\EntryType as CkeEntryType;
use CraftCms\Cms\Asset\AssetsHelper;
use CraftCms\Cms\Cms;
use CraftCms\Cms\Asset\Data\Volume;
use CraftCms\Cms\Asset\Elements\Asset;
use CraftCms\Cms\Cp\Html\ElementHtml;
use CraftCms\Cms\Cp\Icons;
use CraftCms\Cms\Database\Expressions\FixedOrderExpression;
use CraftCms\Cms\Database\Table;
use CraftCms\Cms\Element\Contracts\ElementInterface;
use CraftCms\Cms\Element\Contracts\NestedElementInterface;
use CraftCms\Cms\Element\ElementHelper;
use CraftCms\Cms\Element\ElementSources as ElementSourcesService;
use CraftCms\Cms\Element\Enums\PropagationMethod;
use CraftCms\Cms\Element\Events\DraftApplying;
use CraftCms\Cms\Element\Events\NestedElementRevisionsCreated;
use CraftCms\Cms\Element\Events\NestedElementsDuplicated;
use CraftCms\Cms\Element\NestedElementManager;
use CraftCms\Cms\Element\Queries\EntryQuery;
use CraftCms\Cms\Element\Validation\ElementRules;
use CraftCms\Cms\Entry\Data\EntryType;
use CraftCms\Cms\Entry\Elements\Entry;
use CraftCms\Cms\Field\Assets;
use CraftCms\Cms\Field\Contracts\CrossSiteCopyableFieldInterface;
use CraftCms\Cms\Field\Contracts\ElementContainerFieldInterface;
use CraftCms\Cms\Field\Contracts\FieldInterface;
use CraftCms\Cms\Field\Contracts\MergeableFieldInterface;
use CraftCms\Cms\Field\Enums\TranslationMethod;
use CraftCms\Cms\Field\FieldContext;
use CraftCms\Cms\FieldLayout\LayoutElements\CustomField;
use CraftCms\Cms\Filesystem\Exceptions\FsObjectNotFoundException;
use CraftCms\Cms\Filesystem\Exceptions\InvalidFsException;
use CraftCms\Cms\Filesystem\Exceptions\InvalidSubpathException;
use CraftCms\Cms\Image\Data\ImageTransform;
use CraftCms\Cms\Section\Enums\SectionType;
use CraftCms\Cms\Support\Exceptions\InvalidHtmlTagException;
use CraftCms\Cms\Support\Facades\Assets as AssetsService;
use CraftCms\Cms\Support\Facades\Drafts;
use CraftCms\Cms\Support\Facades\Elements;
use CraftCms\Cms\Support\Facades\ElementSources;
use CraftCms\Cms\Support\Facades\EntryTypes;
use CraftCms\Cms\Support\Facades\Folders;
use CraftCms\Cms\Support\Facades\HtmlSanitizers;
use CraftCms\Cms\Support\Facades\I18N;
use CraftCms\Cms\Support\Facades\ImageTransforms;
use CraftCms\Cms\Support\Facades\InputNamespace;
use CraftCms\Cms\Support\Facades\Sections;
use CraftCms\Cms\Support\Facades\Sites;
use CraftCms\Cms\Support\Facades\UserGroups;
use CraftCms\Cms\Support\Facades\Volumes;
use CraftCms\Cms\Support\Html;
use CraftCms\Cms\Support\Json;
use CraftCms\Cms\Support\Query;
use CraftCms\Cms\Support\Str;
use CraftCms\Cms\Support\Url;
use CraftCms\Cms\Translation\Locale;
use CraftCms\Cms\Ui\Contracts\Control;
use CraftCms\Cms\Ui\Enums\ControlMode;
use CraftCms\Cms\User\Elements\User;
use CraftCms\HtmlField\HtmlField;
use CraftCms\HtmlField\HtmlFieldData;
use CraftCms\Yii2Adapter\Ui\Contracts\LegacySettingsComponent;
use CraftCms\Yii2Adapter\Ui\Concerns\LegacySettingsUi;
use GraphQL\Type\Definition\Type;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;
use Override;
use RuntimeException;
use Symfony\Component\HtmlSanitizer\HtmlSanitizer;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerInterface;

use function CraftCms\Cms\currentUserElement;
use function CraftCms\Cms\t;
use function CraftCms\Cms\template;

/**
 * CKEditor field type
 *
 * @property string|null $json
 * @property CkeEntryType[] $entryTypes
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 */
class Field extends HtmlField implements
    ElementContainerFieldInterface,
    MergeableFieldInterface,
    CrossSiteCopyableFieldInterface,
    LegacySettingsComponent
{
    // The settings UI still renders legacy HTML through the Yii 2 adapter until native UI controls replace it.
    use LegacySettingsUi;

    /** @since 5.0.0 */
    public const IMAGE_MODE_IMG = 'img';
    /** @since 5.0.0 */
    public const IMAGE_MODE_ENTRIES = 'entries';

    private const VOID_ELEMENTS = [
        'area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input',
        'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr',
    ];

    /**
     * @var NestedElementManager[]
     */
    private static array $entryManagers = [];

    private static bool $registeredListeners = false;

    #[Override]
    public static function displayName(): string
    {
        return 'CKEditor';
    }

    #[Override]
    public static function icon(): string
    {
        return 'paragraph';
    }

    /**
     * @return array Returns the default `language.textPartLanguage` config option that should be used.
     * @since 3.5.0
     * @see https://ckeditor.com/docs/ckeditor5/latest/api/module_core_editor_editorconfig-LanguageConfig.html#member-textPartLanguage
     */
    public static function textPartLanguage(): array
    {
        $appLanguage = app()->getLocale();

        return Collection::make(I18N::getSiteLocales())
            ->map(fn(Locale $locale) => array_filter([
                'title' => $locale->getDisplayName($appLanguage),
                'languageCode' => $locale->id,
                'textDirection' => $locale->getOrientation() === 'rtl' ? 'rtl' : null,
            ]))
            ->sortBy('title')
            ->values()
            ->all();
    }

    #[Override]
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
        self::registerListeners();

        if (!isset(self::$entryManagers[$field->id])) {
            self::$entryManagers[$field->id] = new NestedElementManager(
                Entry::class,
                fn(ElementInterface $owner) => self::createEntryQuery($owner, $field),
                [
                    'field' => $field,
                    'propagationMethod' => match (TranslationMethod::from($field->translationMethod)) {
                        TranslationMethod::None => PropagationMethod::All,
                        TranslationMethod::Site => PropagationMethod::None,
                        TranslationMethod::SiteGroup => PropagationMethod::SiteGroup,
                        TranslationMethod::Language => PropagationMethod::Language,
                        TranslationMethod::Custom => PropagationMethod::Custom,
                    },
                    'propagationKeyFormat' => $field->translationKeyFormat,
                    'criteria' => [
                        'fieldId' => $field->id,
                    ],
                    'valueGetter' => fn(ElementInterface $owner, bool $fetchAll = false) => self::nestedEntries($owner, $field),
                    'valueSetter' => false,
                ],
            );
        }

        return self::$entryManagers[$field->id];
    }

    /**
     * Registers the Laravel event listeners the field relies on.
     */
    private static function registerListeners(): void
    {
        if (self::$registeredListeners) {
            return;
        }

        self::$registeredListeners = true;

        // NestedElementRevisionsCreated extends NestedElementsDuplicated, so this catches both
        Event::listen(NestedElementsDuplicated::class, function(NestedElementsDuplicated $event) {
            $field = $event->manager->field;
            if (!$field instanceof self) {
                return;
            }

            if ($event instanceof NestedElementRevisionsCreated) {
                self::afterCreateRevisions($event, $field);
            } else {
                self::adjustFieldValues($event->target, $field, $event->newElementIds, true);
            }
        });

        // when the field is translatable (e.g. for each site);
        // you create a new entry and add nested entry into a cke field while the entry is fresh
        // during autosave, that nested entry gets duplicated into the other site correctly (along with value adjustment)
        // however when you then fully save the owner,
        // the duplication is triggered twice - from applying the draft and from removing the draft data,
        // so the nested entries get duplicated and adjusted twice
        // causing the nested entry in the site we propagated to, to have a wrong ID
        Event::listen(DraftApplying::class, function(DraftApplying $event) {
            if ($event->draft?->propagateAll && $event->draft->getIsUnpublishedDraft()) {
                $event->draft->propagateAll = false;
            }
        });
    }

    /**
     * Returns the nested entries referenced by the field’s values on the given owner.
     */
    private static function nestedEntries(ElementInterface $owner, self $field): Collection
    {
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
            ->whereIn('elements.id', $entryIds)
            ->status(null)
            ->trashed(null);

        if (!empty($entryIds)) {
            $query->orderBy(new FixedOrderExpression('elements.id', $entryIds));
        }

        $entries = $query->collect();

        // make sure all the expected entries came back
        $queriedEntryIds = [];
        foreach ($entries as $entry) {
            $queriedEntryIds[$entry->id] = true;
        }

        $missingEntryIds = array_values(array_filter($entryIds, fn($entryId) => !isset($queriedEntryIds[$entryId])));

        if (!empty($missingEntryIds)) {
            // this could happen if any entries had been removed from the content,
            // so their ownership had been deleted from the draft.
            $missingEntries = self::createEntryQuery($owner, $field, false)
                ->whereIn('elements.id', $missingEntryIds)
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
            if ($setOwner) {
                $query
                    ->owner($owner)
                    ->excludeEagerLoadCriteria(['ownerId', 'primaryOwnerId']);
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

    private static function afterCreateRevisions(NestedElementRevisionsCreated $event, self $field): void
    {
        $localized = $event->target->getLocalized();
        if (!$localized instanceof Collection) {
            $localized = $localized->status(null)->all();
        }

        $revisionOwners = [
            $event->target,
            ...$localized,
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
            $owner->propagateRequired = false;
            Elements::saveElement($owner, false, $propagate, false);
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
                Log::warning("Could not load CKEditor CSS file \"$file\".", [__METHOD__]);
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
                Log::warning("Could not decode JSON from CKEditor config file \"$file\": " . $e->getMessage(), [__METHOD__]);
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
                Log::warning("Could not load CKEditor config JS file \"$file\".", [__METHOD__]);
            }
        }
        return self::$jsFileContents[$file] ?: null;
    }

    /**
     * Returns the path to a file in the `config/craft/ckeditor/` folder.
     *
     * @param string $file
     * @return string
     * @since 5.3.0
     */
    public static function configFilePath(string $file): string
    {
        return config_path(sprintf('craft/ckeditor/%s', $file));
    }

    /**
     * Normalizes an entry type into a `CraftCms\Ckeditor\Data\EntryType` object.
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

        try {
            $craftEntryType = EntryTypes::getEntryType($entryType);
        } catch (InvalidArgumentException) {
            return null;
        }

        if (!$craftEntryType) {
            return null;
        }

        return CkeEntryType::fromEntryType(
            $craftEntryType,
            is_array($entryType) ? (bool)($entryType['expanded'] ?? false) : false,
        );
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
     * @see htmlSanitizer()
     */
    private HtmlSanitizerInterface $_htmlSanitizer;

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
            $config['fullGraphqlData'] = Arr::pull($config, 'graphqlMode') === 'full';
        }

        foreach (['wordLimit', 'characterLimit'] as $attribute) {
            if (isset($config[$attribute]) && in_array($config[$attribute], ['', '0', 0], true)) {
                $config[$attribute] = null;
            }
        }

        parent::__construct($config);
    }

    #[Override]
    public function attributeLabels(): array
    {
        return [
            ...parent::attributeLabels(),
            'toolbar' => t('Toolbar', category: 'ckeditor'),
            'json' => t('Config Options', category: 'ckeditor'),
            'js' => t('Config Options', category: 'ckeditor'),
            'css' => t('Custom Styles', category: 'ckeditor'),
        ];
    }

    /**
     * Returns the JSON-encoded config options.
     *
     * @return string|null
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
     * Sets the config options from a JSON string.
     *
     * @param string|null $json
     * @since 5.0.0
     */
    public function setJson(?string $json): void
    {
        $this->_json = $json;

        try {
            $this->options = $json !== null ? Json::decode($json) : null;
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
     * @return CkeEntryType|null
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
     * @return Assets|null
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

    #[Override]
    public function validationData(): array
    {
        return [
            ...parent::validationData(),
            'json' => $this->_json,
        ];
    }

    #[Override]
    public function getRules(): array
    {
        return array_merge(parent::getRules(), [
            'wordLimit' => ['nullable', 'integer', 'min:1'],
            'characterLimit' => ['nullable', 'integer', 'min:1'],
            'json' => [
                'nullable',
                function(string $attribute, mixed $value, Closure $fail) {
                    try {
                        $this->options = Json::decode($value);
                    } catch (InvalidArgumentException) {
                        $fail(t('{attribute} isn’t valid JSON.', [
                            'attribute' => $this->getAttributeLabel('json'),
                        ], 'ckeditor'));
                    }
                },
            ],
        ]);
    }

    #[Override]
    public function getElementRules(ElementInterface $element): array
    {
        $rules = [];

        if ($element->ruleset->inScenarios(
            ElementRules::SCENARIO_ESSENTIALS,
            ElementRules::SCENARIO_DEFAULT,
            ElementRules::SCENARIO_LIVE,
        )) {
            $rules[] = fn(string $attribute, mixed $value, Closure $fail) => $this->validateEntries($element, $value, $fail);
        }

        if ($this->characterLimit) {
            $rules[] = function(string $attribute, mixed $value, Closure $fail) {
                $value = strip_tags((string)$value);
                $value = preg_replace(Str::invisibleCharsPattern(), '', $value);
                if (mb_strlen($value) > $this->characterLimit) {
                    $fail(t('{field} should contain at most {max, number} {max, plural, one{character} other{characters}}.', [
                        'field' => t($this->name, category: 'site'),
                        'max' => $this->characterLimit,
                    ], 'ckeditor'));
                }
            };
        } elseif ($this->wordLimit) {
            $rules[] = function(string $attribute, mixed $value, Closure $fail) {
                $value = html_entity_decode((string)$value);
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
                    $fail(t('{field} should contain at most {max, number} {max, plural, one{word} other{words}}.', [
                        'field' => t($this->name, category: 'site'),
                        'max' => $this->wordLimit,
                    ], 'ckeditor'));
                }
            };
        }

        return $rules;
    }

    private function validateEntries(ElementInterface $element, mixed $value, Closure $fail): void
    {
        if (!$value instanceof FieldData) {
            return;
        }

        $chunks = $value->getChunks(false)
            ->filter(fn(BaseChunk $chunk) => !$chunk instanceof EntryChunk || $chunk->getEntry() !== null);

        /** @var Entry[] $entries */
        $entries = $chunks
            ->filter(fn(BaseChunk $chunk) => $chunk instanceof EntryChunk)
            ->keyBy(fn(EntryChunk $chunk) => $chunk->entryId)
            ->map(fn(EntryChunk $chunk) => $chunk->getEntry())
            ->all();

        $scenario = $element->ruleset->getScenario();
        $invalidEntryIds = [];

        foreach ($entries as $entry) {
            $entry->setOwner($element);

            if (
                $scenario === ElementRules::SCENARIO_ESSENTIALS ||
                ($entry->enabled && $scenario === ElementRules::SCENARIO_LIVE)
            ) {
                $entry->ruleset->useScenario($scenario);
            }

            if (!$entry->validate()) {
                $invalidEntryIds[] = $entry->id;
            }
        }

        if (!empty($invalidEntryIds)) {
            $element->addInvalidNestedElementIds($invalidEntryIds);
            $fail(t('Validation errors found in {count, plural, =1{one nested entry} other{{count, spellout} nested entries}} within the *{fieldName}* field; please fix them.', [
                'count' => count($invalidEntryIds),
                'fieldName' => $this->getUiLabel(),
            ]));
        }
    }

    #[Override]
    public function getContentGqlType(): Type|array
    {
        if (!$this->fullGraphqlData) {
            return parent::getContentGqlType();
        }

        return Generator::generateType($this);
    }

    #[Override]
    public function getUriFormatForElement(NestedElementInterface $element): ?string
    {
        return null;
    }

    #[Override]
    public function getRouteForElement(NestedElementInterface $element): mixed
    {
        return null;
    }

    #[Override]
    public function getSupportedSitesForElement(NestedElementInterface $element): array
    {
        try {
            $owner = $element->getOwner();
        } catch (RuntimeException) {
            $owner = null;
        }

        $owner ??= $element->duplicateOf;

        if (!$owner) {
            return [Sites::getPrimarySite()->id];
        }

        return self::entryManager($this)->getSupportedSiteIds($owner);
    }

    #[Override]
    public function canViewElement(NestedElementInterface $element, User $user): ?bool
    {
        $owner = $element->getOwner();
        return $owner && $user->can('view', $owner);
    }

    #[Override]
    public function canSaveElement(NestedElementInterface $element, User $user): ?bool
    {
        $owner = $element->getOwner();
        return $owner && $user->can('save', $owner);
    }

    #[Override]
    public function canDuplicateElement(NestedElementInterface $element, User $user): ?bool
    {
        $owner = $element->getOwner();
        return $owner && $user->can('save', $owner);
    }

    #[Override]
    public function canDeleteElement(NestedElementInterface $element, User $user): ?bool
    {
        $owner = $element->getOwner();
        return $owner && $user->can('save', $owner);
    }

    #[Override]
    public function canDeleteElementForSite(NestedElementInterface $element, User $user): ?bool
    {
        return false;
    }

    #[Override]
    public function getSettingsHtml(): ?string
    {
        return $this->settingsHtml(false);
    }

    #[Override]
    public function getReadOnlySettingsHtml(): ?string
    {
        return $this->settingsHtml(true);
    }

    /**
     * Renders the legacy settings template (through the Yii 2 adapter).
     */
    private function settingsHtml(bool $readOnly): string
    {
        $assets = app(CkeditorAssets::class);
        $assets->registerFieldSettingsAssets();

        // The toolbar builder needs every package
        [$importStatements, $pluginRefs] = CkeditorConfig::getImports();
        $assets->registerPackageAssets();

        $userGroupOptions = [
            [
                'label' => t('Admins'),
                'value' => '__ADMINS__',
            ],
        ];

        foreach (UserGroups::getAllGroups() as $group) {
            if ($group->can('accessCp')) {
                $userGroupOptions[] = [
                    'label' => $group->name,
                    'value' => $group->uid,
                ];
            }
        }

        $volumeOptions = [];
        foreach (Volumes::getAllVolumes() as $volume) {
            if ($volume->hasUrls) {
                $volumeOptions[] = [
                    'label' => $volume->name,
                    'value' => $volume->uid,
                ];
            }
        }

        $transformOptions = [];
        foreach (ImageTransforms::getAllTransforms() as $transform) {
            $transformOptions[] = [
                'label' => $transform->name,
                'value' => $transform->uid,
            ];
        }

        $jsonSchemaUri = sprintf('https://craft-code-editor.com/%s', InputNamespace::namespaceId('config-options-json'));

        $configMode = match (true) {
            !empty($this->js) => 'js',
            !empty($this->jsFile) => 'file',
            default => 'json',
        };

        $cssMode = match (true) {
            !empty($this->cssFile) => 'file',
            default => 'css',
        };

        return template('ckeditor/_field-settings.twig', [
            'field' => $this,
            'importStatements' => $importStatements,
            'toolbarBuilderId' => InputNamespace::namespaceId('toolbar-builder'),
            'configOptionsId' => InputNamespace::namespaceId('config-options'),
            'cssOptionsId' => InputNamespace::namespaceId('css-options'),
            'toolbarItems' => CkeditorConfig::normalizeToolbarItems(CkeditorConfig::getToolbarItems()),
            'plugins' => $pluginRefs,
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
            'htmlSanitizerOptions' => $this->htmlSanitizerOptions(),
            'baseIconsUrl' => $assets->url('fieldsettings/images', false),
            'volumeOptions' => $volumeOptions,
            'transformOptions' => $transformOptions,
            'defaultTransformOptions' => array_merge([
                [
                    'label' => t('No transform', category: 'ckeditor'),
                    'value' => null,
                ],
            ], $transformOptions),
            'configMode' => $configMode,
            'cssMode' => $cssMode,
            'readOnly' => $readOnly,
            'enableGql' => Cms::config()->enableGql,
            'inputNamespace' => InputNamespace::get(),
        ]);
    }

    #[Override]
    public function getFieldLayoutProviders(): array
    {
        return $this->getEntryTypes();
    }

    #[Override]
    public function settingsAttributes(): array
    {
        return array_values(array_unique([
            ...parent::settingsAttributes(),
            'entryTypes',
        ]));
    }

    #[Override]
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

    #[Override]
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

        if ($value === null) {
            return null;
        }

        return str_replace(
            '{PAGEBREAK_MARKER}',
            '<div class="page-break" style="page-break-after:always;"><span style="display:none;">&nbsp;</span></div>',
            $value,
        );
    }

    #[Override]
    public function afterElementSave(ElementInterface $element, bool $isNew): void
    {
        if (
            $this->imageMode === self::IMAGE_MODE_IMG &&
            $this->_hasDynamicUploadSubpath() &&
            !$element->propagating &&
            !$element->getRootOwner()->getIsRevision()
        ) {
            $this->moveTempAssets($element);
        }

        parent::afterElementSave($element, $isNew);
    }

    #[Override]
    public function afterElementPropagate(ElementInterface $element, bool $isNew): void
    {
        if ($this->isFirstInstance($element)) {
            self::entryManager($this)->maintainNestedElements($element, $isNew);
        }

        parent::afterElementPropagate($element, $isNew);
    }

    #[Override]
    public function beforeElementDelete(ElementInterface $element): bool
    {
        if (!parent::beforeElementDelete($element)) {
            return false;
        }

        if ($this->isFirstInstance($element)) {
            // Delete any entries that primarily belong to this element
            self::entryManager($this)->deleteNestedElements($element, $element->hardDelete);
        }

        return true;
    }

    #[Override]
    public function afterElementRestore(ElementInterface $element): void
    {
        if ($this->isFirstInstance($element)) {
            self::entryManager($this)->restoreNestedElements($element);
        }

        parent::afterElementRestore($element);
    }

    /**
     * Returns whether this is the first instance of the field in the element’s field layout,
     * so nested entries are only managed once per field.
     */
    private function isFirstInstance(ElementInterface $element): bool
    {
        $first = self::fieldInstances($element, $this)[0] ?? null;
        return !$first || $first->layoutElement?->uid === $this->layoutElement?->uid;
    }

    private function getRefTargetIds(FieldData|string|null $value, ?string $refHandle = null): array
    {
        if ($value instanceof FieldData) {
            $value = $value->getRawContent();
        }

        if (!$value) {
            return [];
        }

        $refIds = [];
        preg_match_all(\CraftCms\Cms\Element\Elements::REF_TAG_PATTERN, $value, $matches);

        foreach ($matches['ref'] as $i => $ref) {
            if (
                is_numeric($ref) &&
                ($refHandle === null || $matches['elementType'][$i] === $refHandle)
            ) {
                $refIds[] = (int)$ref;
            }
        }

        // Also look for unserialized element URLs (e.g. `foo.jpg#asset:123:url`)
        if ($refHandle !== null) {
            preg_match_all(sprintf('/#%s:(\d+)/', preg_quote($refHandle, '/')), $value, $matches);
            array_push($refIds, ...array_map('intval', $matches[1]));
        }

        return array_values(array_unique($refIds));
    }

    #[Override]
    public function copyCrossSiteValue(ElementInterface $from, ElementInterface $to): void
    {
        /** @var FieldData|null $fromValue */
        $fromValue = $from->getFieldValue($this->handle);
        if (!$fromValue) {
            $to->setFieldValue($this->handle, null);
            return;
        }

        $chunks = $fromValue->getChunks(false);
        if ($chunks->contains(fn(BaseChunk $chunk) => $chunk instanceof EntryChunk)) {
            $toValue = $chunks
                ->map(function(BaseChunk $chunk) use ($to) {
                    if ($chunk instanceof Markup) {
                        return $chunk->rawHtml;
                    }

                    /** @var EntryChunk $chunk */
                    $entry = Elements::duplicateElement($chunk->getEntry(), [
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
     * Returns the HTML for a nested entry’s card.
     *
     * @param ElementInterface $entry
     * @return string
     */
    public function getCardHtml(ElementInterface $entry): string
    {
        $isRevision = $entry->getIsRevision();

        $classes = [$isRevision ? 'cke-entry-card' : null];
        /** @var NestedElementInterface $entry */
        $owner = $entry->getOwner();
        if ($owner) {
            if ($owner->errors()->has($this->handle) && in_array($entry->id, $owner->getInvalidNestedElementIds())) {
                $classes[] = 'error';
            }
        }

        return app(ElementHtml::class)->elementCardHtml($entry, [
            'autoReload' => !$isRevision,
            'showDraftName' => !$isRevision,
            'showStatus' => !$isRevision,
            'showThumb' => !$isRevision,
            'attributes' => [
                'class' => array_values(array_filter($classes)),
            ],
            'hyperlink' => false,
            'showEditButton' => false,
        ]);
    }

    /**
     * Returns an eager-loading map for the nested entries.
     *
     * @param ElementInterface[] $sourceElements
     * @return array|null|false
     */
    public function getEagerLoadingMap(array $sourceElements): array|null|false
    {
        $sourceElementIds = array_map(fn(ElementInterface $element) => $element->id, $sourceElements);

        // Return any relation data on these elements, defined with this field
        $map = DB::table(Table::ELEMENTS_OWNERS, 'elements_owners')
            ->select([
                'elements_owners.ownerId as source',
                'elements_owners.elementId as target',
            ])
            ->whereIn('elements_owners.ownerId', $sourceElementIds)
            ->whereExists(fn(Builder $query) => $query
                ->selectRaw('1')
                ->from(Table::ENTRIES, 'entries')
                ->whereColumn('entries.id', 'elements_owners.elementId')
                ->where('entries.fieldId', $this->id))
            ->orderBy('elements_owners.sortOrder')
            ->get()
            ->map(fn(object $row) => (array)$row)
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

    #[Override]
    public function canMergeInto(FieldInterface $persistingField, ?string &$reason): bool
    {
        if (!$persistingField instanceof self) {
            $reason = 'CKEditor fields can only be merged into other CKEditor fields.';
            return false;
        }

        return true;
    }

    #[Override]
    public function afterMergeFrom(FieldInterface $outgoingField): void
    {
        DB::table(Table::ENTRIES)
            ->where('fieldId', $outgoingField->id)
            ->update([
                'fieldId' => $this->id,
                'dateUpdated' => Query::prepareDateForDb(now()),
            ]);

        parent::afterMergeFrom($outgoingField);
    }

    #[Override]
    protected function createFieldData(string $content, ?int $siteId): HtmlFieldData
    {
        return new FieldData($content, $siteId, $this);
    }

    #[Override]
    public function uiControl(FieldContext $context): Control
    {
        $element = $context->element;

        // Craft calls this on the layout’s source field, which doesn’t know its layout element,
        // so defer to the field instance from the element’s layout when there is one
        if (!$this->layoutElement && $element) {
            $path = is_array($context->path) ? $context->path : explode('.', $context->path);
            $instance = $element->getFieldLayout()?->getFieldByHandle((string)end($path));
            if ($instance instanceof self && $instance->layoutElement) {
                return $instance->uiControl($context);
            }
        }

        $readOnly = $context->mode !== ControlMode::Editable;
        $containerId = sprintf('cke-%s', Str::random(10));

        $assets = app(CkeditorAssets::class);
        [$module, $namespaces] = $this->editorModule($element);
        $editorAssets = $assets->editorAssetUrls();
        $packageAssets = $assets->packageAssetUrls($namespaces);

        return CkeditorControl::make($context->path)
            ->value($this->prepValueForInput($context->value, $element, $readOnly))
            ->mode($readOnly ? ($context->mode === ControlMode::Disabled ? ControlMode::Disabled : ControlMode::ReadOnly) : ControlMode::Editable)
            ->module($module)
            ->containerId($containerId)
            ->showWordCount($this->showWordCount)
            ->css($this->scopedCss($containerId))
            ->assets(array_map(
                fn(string $key) => array_values(array_unique([...$editorAssets[$key], ...$packageAssets[$key]])),
                ['styles' => 'styles', 'scripts' => 'scripts', 'modules' => 'modules'],
            ))
            ->globals($assets->editorGlobals())
            ->owner($element?->id ? [
                'ownerElementType' => $element::class,
                'ownerId' => $element->id,
                'ownerSiteId' => $element->siteId,
                'ownerIsDerivative' => $element->getIsDerivative(),
                'ownerIsInDerivativeTree' => ElementHelper::isDraftOrRevision($element),
                'ownerIsUnpublishedDraft' => $element->getIsUnpublishedDraft(),
                'ownerHasDrafts' => $element->getRootOwner()::hasDrafts(),
            ] : null);
    }

    /**
     * Returns the JavaScript module that creates the editor for this field, and the CKEditor package namespaces it imports.
     *
     * The module’s default export receives the source element (a `<textarea>`) and an options object
     * (`containerId`, `wordCountElement`, `readOnly`), and resolves to the editor.
     *
     * @return array{0:string,1:string[]}
     */
    private function editorModule(?ElementInterface $element): array
    {
        $transforms = $this->_transforms();

        if ($this->defaultTransform) {
            $defaultTransform = ImageTransforms::getTransformByUid($this->defaultTransform);
        } else {
            $defaultTransform = null;
        }

        // Toolbar cleanup
        $toolbar = array_merge($this->toolbar);

        if ($element?->id) {
            // rewrite createEntry into per-entry-type buttons
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
            $toolbar = array_diff($toolbar, ['createEntry']);
        }

        $user = currentUserElement();
        if (!$user || !$this->isSourceEditingAllowed($user)) {
            $toolbar = array_diff($toolbar, ['sourceEditing']);
        }

        $toolbar = array_values($toolbar);

        $baseConfig = array_filter([
            'licenseKey' => app(Settings::class)->getLicenseKey(),
            'defaultTransform' => $defaultTransform?->handle,
            'elementSiteId' => $element?->siteId,
            'accessibleFieldName' => $this->_accessibleFieldName($element),
            'describedBy' => $this->_describedBy(),
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
            'defaultUploadFolderId' => $this->_defaultUploadFolderId($element),
            'layoutElementUid' => $this->layoutElement?->uid,
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
        event($event = new EditorConfigResolving($this, $element, $baseConfig, $toolbar));

        $removePlugins = Collection::empty();

        // remove MediaEmbedToolbar for now
        // see: https://github.com/ckeditor/ckeditor5-react/issues/267
        // and: https://github.com/ckeditor/ckeditor5/issues/9824
        // for more info
        $removePlugins->push('MediaEmbedToolbar');

        if (count($transforms) === 0) {
            $removePlugins->push('ImageTransforms');
        }

        $configJs = $this->configJs();

        // Only import (and register the asset bundles for) packages that have plugins in use, or that custom
        // config JS refers to by name (e.g. `extraPlugins: [Tokens]`). JSON config can't refer to plugin classes.
        [$imports, $pluginRefs, $namespaces] = CkeditorConfig::getImports(
            $event->toolbar,
            $removePlugins->all(),
            isset($this->options) ? null : $configJs,
        );

        $configPlugins = '[' . implode(',', $pluginRefs) . ']';

        // Add the translation import
        $uiLanguage = CkeditorAssets::uiLanguage();
        $importCompliantUiLanguage = CkeditorAssets::getImportCompliantLanguage(CkeditorAssets::uiLanguage());
        $uiTranslationImport = "import coreTranslations from 'ckeditor5/translations/$importCompliantUiLanguage.js';";

        $languageJs = Json::encode([
            'ui' => $uiLanguage,
            'content' => $element?->getSite()->language ?? app()->getLocale(),
            'textPartLanguage' => static::textPartLanguage(),
        ]);
        $baseConfigJs = Json::encode($event->baseConfig);
        $toolbarJs = Json::encode($event->toolbar);
        $showWordCountJs = Json::encode($this->showWordCount);
        $wordLimitJs = Json::encode($this->wordLimit ?: 0);
        $characterLimitJs = Json::encode($this->characterLimit ?: 0);

        $module = <<<JS
$imports
$uiTranslationImport
import {create} from '@craftcms/ckeditor';

export default async function (element, options = {}) {
  const $ = jQuery;
  const customConfig = $configJs;
  const config = Object.assign({
    translations: [coreTranslations],
    language: $languageJs,
  }, $baseConfigJs, customConfig, {
    plugins: $configPlugins,
    removePlugins: [
      ...($baseConfigJs?.removePlugins ?? []),
      ...(customConfig?.removePlugins ?? []),
    ]
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

  // special case for fullscreen mode and Custom Styles
  // see https://github.com/craftcms/ckeditor/issues/614
  if (config.toolbar.items.indexOf('fullscreen') >= 0) {
    const fullscreenConfig = customConfig?.fullscreen ?? {};
    const userOnEnterCallback = fullscreenConfig?.onEnterCallback;
    const userOnLeaveCallback = fullscreenConfig?.onLeaveCallback;
    const fieldInputId = options.containerId;
    config.fullscreen = {
      ...fullscreenConfig,
      onEnterCallback: (container) => {
        container.classList.add(fieldInputId);
        if (userOnEnterCallback) {
          userOnEnterCallback(container);
        }
      },
      onLeaveCallback: (container) => {
        if (userOnLeaveCallback) {
          userOnLeaveCallback(container);
        }
        container.classList.remove(fieldInputId);
      },
    };
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
      const container = $(options.wordCountElement);
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

  // the Craft 6 control panel’s owner bridge (see resources/assets/control/ckeditor-control.js)
  config.craftOwner = options.owner ?? null;

  const editor = await create(element, config);

  if (options.readOnly) {
    editor.enableReadOnlyMode('craft-read-only');
  }

  return editor;
}
JS;

        return [$module, $namespaces];
    }

    /**
     * Returns the field’s custom CSS, scoped to the editor container.
     */
    private function scopedCss(string $containerId): ?string
    {
        $css = $this->css();
        if (!$css) {
            return null;
        }

        // @import rules must come first
        $imports = [];
        preg_match_all('/@import .+;?/m', $css, $importMatches);
        foreach ($importMatches[0] as $import) {
            $imports[] = $import;
            $css = str_replace($import, '', $css);
        }

        $css = trim($css);

        // the id is needed for the regular field
        // the class is used by the fullscreen mode (there can only be one at the time)
        return trim(implode("\n", $imports) . ($css !== '' ? "\n#$containerId, .$containerId { $css }" : '')) ?: null;
    }

    private function configJs(): string
    {
        if (isset($this->jsFile) && strtolower(pathinfo($this->jsFile, PATHINFO_EXTENSION)) === 'json') {
            $this->options = self::jsonFileContents($this->jsFile);
        }

        if (isset($this->options)) {
            // translate the placeholder text
            if (isset($this->options['placeholder']) && is_string($this->options['placeholder'])) {
                $this->options['placeholder'] = t($this->options['placeholder'], category: 'site');
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
     * Returns the HTML sanitizer, adjusted for the CKEditor config.
     *
     * Named sanitizers (selected in the field settings) are used as-is. Craft’s default sanitizer
     * config is extended with the markup CKEditor needs, based on the field’s toolbar and options.
     */
    #[Override]
    protected function htmlSanitizer(): HtmlSanitizerInterface
    {
        return $this->_htmlSanitizer ??= $this->createHtmlSanitizer();
    }

    private function createHtmlSanitizer(): HtmlSanitizerInterface
    {
        if ($this->htmlSanitizer !== null && $this->htmlSanitizer !== 'default' && HtmlSanitizers::has($this->htmlSanitizer)) {
            return HtmlSanitizers::sanitizer($this->htmlSanitizer);
        }

        $config = HtmlSanitizers::defaultConfig()
            ->allowAttribute('class', '*')
            ->allowAttribute('style', ['div', 'span'])
            ->allowAttribute('target', ['a'])
            ->allowAttribute('rel', ['a']);

        if (!empty($this->advancedLinkFields) && in_array('ariaLabel', $this->advancedLinkFields)) {
            $config = $config->allowAttribute('aria-label', ['a']);
        }

        if (in_array('todoList', $this->toolbar)) {
            $config = $config
                ->allowElement('input', ['type', 'disabled', 'checked'])
                ->allowElement('label');
        }

        if (in_array('numberedList', $this->toolbar)) {
            $config = $config
                ->allowAttribute('style', ['ol'])
                ->allowAttribute('reversed', ['ol'])
                ->allowAttribute('start', ['ol']);
        }

        if (in_array('bulletedList', $this->toolbar)) {
            $config = $config->allowAttribute('style', ['ul']);
        }

        if (
            in_array('bulletedList', $this->toolbar) ||
            in_array('numberedList', $this->toolbar) ||
            in_array('todoList', $this->toolbar)
        ) {
            // allow `data-list-item-id` attribute for the list items;
            // complements https://github.com/craftcms/ckeditor/pull/555
            $config = $config->allowAttribute('data-list-item-id', ['li']);
        }

        if ($this->imageMode === self::IMAGE_MODE_ENTRIES || in_array('createEntry', $this->toolbar)) {
            $config = $config->allowElement('craft-entry', ['data-entry-id', 'data-site-id']);
        }

        // Give plugins a chance to modify the config
        event($event = new HtmlSanitizerConfigResolving($this, $config));

        return new HtmlSanitizer($event->config);
    }

    /**
     * Returns the value prepped for the input.
     *
     * @param FieldData|string|null $value
     */
    #[Override]
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
                $entries = Drafts::withProvisionalDrafts($entries);
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
                    } catch (RuntimeException) {
                        // this can happen e.g. when the entry type has been deleted
                        return '';
                    }

                    if ($static) {
                        return $cardHtml;
                    }

                    return Html::tag('craft-entry', '', [
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
                "\u{00A0}" => '&nbsp;',
            ];
            foreach (self::VOID_ELEMENTS as $tag) {
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

    #[Override]
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

        if (!DB::supportsMb4()) {
            $keywords = Str::encodeMb4($keywords);
        }

        $keywords .= self::entryManager($this)->getSearchKeywords($element);

        return $keywords;
    }

    /**
     * Normalizes <figure> tags, ensuring they have an `image` or `media` class depending on their contents,
     * and they contain a <div data-oembed-url> or <oembed> tag, depending on the `mediaEmbed.previewsInData`
     * CKEditor config option.
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
                $absUrl = Url::isProtocolRelativeUrl($match[4]) ? "https:$match[4]" : $match[4];
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
     */
    private function _linkOptions(?ElementInterface $element): array
    {
        $linkOptions = [];

        $sectionSources = $this->_entrySources($element);
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

        // Categories only exist in the Yii 2 adapter
        $categoryClass = 'craft\elements\Category';
        if (class_exists($categoryClass)) {
            $categorySources = $this->_categorySources($element, $categoryClass);
            if (!empty($categorySources)) {
                $linkOptions[] = [
                    'label' => $categoryClass::displayName(),
                    'elementType' => $categoryClass,
                    'refHandle' => $categoryClass::refHandle(),
                    'sources' => $categorySources,
                    'criteria' => ['uri' => ':notempty:'],
                ];
            }
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
        event($event = new LinkOptionsResolving($this, $element, $linkOptions));
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
     */
    private function _entrySources(?ElementInterface $element, bool $showSingles = false): array
    {
        $sources = [];
        $sites = Sites::getAllSites();

        foreach (Sections::getAllSections() as $section) {
            if ($section->type === SectionType::Single) {
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
        return array_merge($sources, $this->_getCustomSources(Entry::class));
    }

    /**
     * Returns the available category sources (legacy, through the Yii 2 adapter).
     */
    private function _categorySources(?ElementInterface $element, string $categoryClass): array
    {
        if (!$element) {
            return [];
        }

        $sources = Collection::make(\Craft::$app->getCategories()->getAllGroups())
            ->filter(fn($group) => $group->getSiteSettings()[$element->siteId]?->hasUrls ?? false)
            ->map(fn($group) => "group:$group->uid")
            ->values()
            ->all();

        // include custom sources
        return array_merge($sources, $this->_getCustomSources($categoryClass));
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

        $volumes = Collection::make(Volumes::getAllVolumes());

        if (is_array($this->availableVolumes)) {
            $volumes = $volumes->filter(fn(Volume $volume) => in_array($volume->uid, $this->availableVolumes));
        }

        if (!$this->showUnpermittedVolumes) {
            $volumes = $volumes->filter(fn(Volume $volume) => Gate::allows("viewAssets:$volume->uid"));
        }

        if ($withUrlsOnly) {
            // only allow volumes that belong to FS that have public URLs
            $volumes = $volumes->filter(fn(Volume $volume) => $volume->hasUrls);
        }

        $sources = $volumes
            ->map(fn(Volume $volume) => "volume:$volume->uid")
            ->values()
            ->all();

        // include custom sources
        return array_merge($sources, $this->_getCustomSources(Asset::class));
    }

    /**
     * Returns the asset selection criteria.
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
     * Returns the default upload folder ID for the given element.
     */
    private function _defaultUploadFolderId(?ElementInterface $element): ?int
    {
        [$uploadField, $target] = $this->_uploadField($element) ?? [null, null];
        if (!$uploadField) {
            return null;
        }

        // this kicks in when the image mode is set to image tags, and we have a dynamic upload subpath
        // Don't create dynamic folders just by rendering the field; temp uploads get moved once the element is saved
        if ($this->imageMode === self::IMAGE_MODE_IMG && $this->_hasDynamicUploadSubpath()) {
            $volume = Volumes::getVolumeByUid($this->defaultUploadLocationVolume);
            if (!$volume) {
                Log::warning("Couldn’t resolve the default upload folder for the “{$this->name}” field: invalid volume.", [__METHOD__]);
                return null;
            }

            try {
                [, $folder] = AssetsHelper::resolveSubpath($volume, $this->defaultUploadLocationSubpath, $target);
            } catch (InvalidSubpathException) {
                $folder = null;
            }

            return $folder->id ?? AssetsService::getUserTemporaryUploadFolder()->id;
        }

        // this kicks in for all other cases (including image tags with static subpath and image entries)
        try {
            return $uploadField->resolveDynamicPathToFolderId($target);
        } catch (InvalidFsException $e) {
            Log::warning("Couldn’t resolve the default upload folder for the “{$this->name}” field: {$e->getMessage()}", [__METHOD__]);
            return null;
        } catch (InvalidSubpathException $e) {
            // Don't take down the whole edit page over it
            Log::warning("Couldn’t resolve the default upload folder for the “{$this->name}” field: {$e->getMessage()}", [__METHOD__]);
            return AssetsService::getUserTemporaryUploadFolder()->id;
        }
    }

    /**
     * Returns whether images get uploaded to a dynamic subpath that’s moved into once the element is saved.
     */
    private function _hasDynamicUploadSubpath(): bool
    {
        return (
            $this->defaultUploadLocationVolume &&
            str_contains($this->defaultUploadLocationSubpath ?? '', '{')
        );
    }

    /**
     * Returns the Assets field that determines where images get uploaded to, along with the element its subpath
     * should be resolved against.
     *
     * @return array{0:Assets,1:ElementInterface|null}|null
     */
    private function _uploadField(?ElementInterface $element): ?array
    {
        if ($this->imageMode === self::IMAGE_MODE_ENTRIES) {
            $imageField = $this->getImageField();
            $imageEntryType = $this->getImageEntryType();
            if (!$imageField?->defaultUploadLocationSource || !$imageEntryType) {
                return null;
            }

            // The subpath gets rendered against the nested image entry, so give it one to work with
            $imageEntry = new Entry([
                'typeId' => $imageEntryType->id,
                'fieldId' => $this->id,
                'siteId' => $element?->siteId,
            ]);
            $imageEntry->setOwner($element);

            return [$imageField, $imageEntry];
        }

        if (!$this->defaultUploadLocationVolume) {
            return null;
        }

        // Let a stand-in Assets field handle subpath resolution and temp folder fallbacks
        $uploadField = new Assets([
            'name' => $this->name,
            'handle' => $this->handle,
            'defaultUploadLocationSource' => "volume:$this->defaultUploadLocationVolume",
            'defaultUploadLocationSubpath' => $this->defaultUploadLocationSubpath,
        ]);

        return [$uploadField, $element];
    }

    /**
     * Moves any temporary image uploads referenced by the field into the default upload folder.
     */
    private function moveTempAssets(ElementInterface $element): void
    {
        $assetIds = $this->getRefTargetIds($element->getFieldValue($this->handle), Asset::refHandle());
        if (empty($assetIds)) {
            return;
        }

        /** @var Asset[] $assets */
        $assets = AssetsService::createTempAssetQuery()
            ->id($assetIds)
            ->all();

        if (empty($assets)) {
            return;
        }

        [$uploadField, $target] = $this->_uploadField($element) ?? [null, null];
        if (!$uploadField) {
            return;
        }

        // this matches what the code does for moving images with dynamic default upload locations;
        // for canonical save, create the folder if needed and log a warning if the subpath can't be resolved;
        // this kicks in applying an unpublished draft
        if ($element->getRootOwner()->getIsCanonical()) {
            try {
                $uploadFolder = Folders::getFolderById($uploadField->resolveDynamicPathToFolderId($target));
            } catch (InvalidFsException|InvalidSubpathException $e) {
                Log::warning("Couldn’t move temporary uploads for the “{$this->name}” field: {$e->getMessage()}", [__METHOD__]);
                return;
            }
        } else {
            // Like the Assets field, only move drafts’ uploads if the target folder already exists
            $volume = Volumes::getVolumeByUid($this->defaultUploadLocationVolume);
            if (!$volume) {
                return;
            }

            try {
                [, $uploadFolder] = AssetsHelper::resolveSubpath($volume, $this->defaultUploadLocationSubpath, $target);
            } catch (InvalidSubpathException) {
                return;
            }
        }

        // Nowhere better to put them yet
        if (!$uploadFolder?->volumeId) {
            return;
        }

        // Resolve all conflicts by keeping both
        foreach ($assets as $asset) {
            $asset->avoidFilenameConflicts = true;
            try {
                AssetsService::moveAsset($asset, $uploadFolder);
            } catch (FsObjectNotFoundException $e) {
                Log::warning('Couldn’t move asset because the file doesn’t exist: ' . $e->getMessage(), [__METHOD__]);
                report($e);
            }
        }
    }

    /**
     * Returns custom element sources keys for given element type.
     */
    private function _getCustomSources(string $elementType): array
    {
        return ElementSources::getSources($elementType, ElementSourcesService::CONTEXT_MODAL)
            ->filter(fn(array $source) => $source['type'] === ElementSourcesService::TYPE_CUSTOM && isset($source['key']))
            ->map(fn(array $source) => $source['key'])
            ->values()
            ->all();
    }

    /**
     * Get available transforms.
     */
    private function _transforms(): array
    {
        if ($this->imageMode !== self::IMAGE_MODE_IMG || !$this->availableTransforms) {
            return [];
        }

        $transforms = Collection::make(ImageTransforms::getAllTransforms());

        if (is_array($this->availableTransforms)) {
            $transforms = $transforms->filter(fn(ImageTransform $transform) => in_array($transform->uid, $this->availableTransforms));
        }

        return $transforms->map(fn(ImageTransform $transform) => [
            'handle' => $transform->handle,
            'name' => $transform->name,
        ])->values()->all();
    }

    /**
     * Returns an accessible name for the field (to be plugged into CKEditor's main editing area aria-label).
     */
    private function _accessibleFieldName(?ElementInterface $element = null): string
    {
        return t($this->name, category: 'site') .
            ($this->layoutElement?->required ? ' ' . t('Required', category: 'site') : '') .
            ($this->getIsTranslatable($element) ? ' ' . $this->getTranslationDescription($element) : '');
    }

    /**
     * Namespaces field's $describedBy value to be passed to the field.
     */
    private function _describedBy(): string
    {
        if (!empty($this->describedBy)) {
            $describedByArray = explode(' ', $this->describedBy);
            $namespace = trim(preg_replace('/\[|\]/', '-', InputNamespace::get() ?? ''), '-');
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
            'expanded' => $entryType->expanded,
            'icon' => $entryType->icon ? Icons::svg($entryType->icon) : null,
            'label' => t($entryType->name, category: 'site'),
            'uid' => $entryType->uid,
            'value' => $entryType->id,
        ], $this->getEntryTypes());
    }

    /**
     * Returns whether non-admins can edit the source.
     *
     * @return bool
     * @deprecated in 4.5.0
     */
    public function getEnableSourceEditingForNonAdmins(): bool
    {
        return $this->sourceEditingGroups === '*';
    }

    /**
     * Sets whether non-admins can edit the source.
     *
     * @param bool $value
     * @deprecated in 4.5.0
     */
    public function setEnableSourceEditingForNonAdmins(bool $value): void
    {
        $this->sourceEditingGroups = $value ? '*' : ['__ADMINS__'];
    }

    #[Override]
    public function propagateValue(ElementInterface $from, ElementInterface $to): void
    {
        $wasValueEmpty = $this->isValueEmpty($to->getFieldValue($this->handle), $to);
        parent::propagateValue($from, $to);

        if (!$from->propagateAll && $wasValueEmpty) {
            // NestedElementManager won't duplicate the nested entries automatically,
            // because the field has a value in the target site (the HTML content), so isValueEmpty() is false.
            self::entryManager($this)->duplicateNestedElements($from, $to, force: true);
        }
    }
}
