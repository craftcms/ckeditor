<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor;

use Closure;
use Craft;
use craft\base\EagerLoadingFieldInterface;
use craft\base\ElementContainerFieldInterface;
use craft\base\ElementInterface;
use craft\base\NestedElementInterface;
use craft\behaviors\EventBehavior;
use craft\elements\db\ElementQueryInterface;
use craft\elements\ElementCollection;
use craft\elements\NestedElementManager;
use craft\ckeditor\events\DefineLinkOptionsEvent;
use craft\ckeditor\events\ModifyConfigEvent;
use craft\ckeditor\web\assets\BaseCkeditorPackageAsset;
use craft\ckeditor\web\assets\ckeditor\CkeditorAsset;
use craft\db\Query;
use craft\db\Table;
use craft\elements\Asset;
use craft\elements\Category;
use craft\elements\db\ElementQuery;
use craft\elements\db\EntryQuery;
use craft\elements\Entry;
use craft\elements\User;
use craft\enums\PropagationMethod;
use craft\errors\InvalidHtmlTagException;
use craft\events\CancelableEvent;
use craft\helpers\ArrayHelper;
use craft\helpers\Cp;
use craft\helpers\Html;
use craft\helpers\Json;
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
use craft\web\View;
use HTMLPurifier_Config;
use HTMLPurifier_HTMLDefinition;
use Illuminate\Support\Collection;
use yii\base\InvalidArgumentException;
use yii\base\InvalidConfigException;
use yii\db\Expression;

/**
 * CKEditor field type
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 */
class Field extends HtmlField implements ElementContainerFieldInterface, EagerLoadingFieldInterface
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

    /**
     * @inheritdoc
     */
    public static function displayName(): string
    {
        return 'CKEditor';
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
     * @var string|null The CKEditor config UUID
     * @since 3.0.0
     */
    public ?string $ckeConfig = null;

    /**
     * @var int|null The total number of words allowed.
     * @since 3.5.0
     */
    public ?int $wordLimit = null;

    /**
     * @var bool Whether the word count should be shown below the field.
     * @since 3.2.0
     */
    public bool $showWordCount = false;

    /**
     * @var string|array|null The volumes that should be available for image selection.
     * @since 1.2.0
     */
    public string|array|null $availableVolumes = '*';

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
     * @var bool Whether to enable source editing for non-admin users.
     * @since 3.3.0
     */
    public bool $enableSourceEditingForNonAdmins = false;

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
     * @var EntryType[] The field’s available entry types
     * @see getEntryTypes()
     * @see setEntryTypes()
     */
    private array $_entryTypes = [];

    /**
     * @see entryManager()
     */
    private NestedElementManager $_entryManager;

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
        );

        if (isset($config['entryTypes']) && $config['entryTypes'] === '') {
            $config['entryTypes'] = [];
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
    }

    /**
     * @inheritdoc
     */
    public static function isMultiInstance(): bool
    {
        return false;
    }

    /**
     * @inheritdoc
     */
    protected function defineRules(): array
    {
        return array_merge(parent::defineRules(), [
            ['wordLimit', 'number', 'min' => 1],
        ]);
    }

    /**
     * @inheritdoc
     */
    public function getElementValidationRules(): array
    {
        $rules = [];

        if ($this->wordLimit) {
            $rules[] = [
                function(ElementInterface $element) {
                    $value = strip_tags((string)$element->getFieldValue($this->handle));
                    if (
                        // regex copied from the WordCount plugin, for consistency
                        preg_match_all('/(?:[\p{L}\p{N}]+\S?)+/', $value, $matches) &&
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
    public function settingsAttributes(): array
    {
        $attributes = parent::settingsAttributes();
        $attributes[] = 'entryTypes';
        return $attributes;
    }

    /**
     * @inheritdoc
     */
    public function getFieldLayoutProviders(): array
    {
        return Craft::$app->getEntries()->getAllEntryTypes();
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

        return $this->entryManager()->getSupportedSiteIds($owner);
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
        return Craft::$app->getElements()->canSave($element->getOwner(), $user);
    }

    /**
     * @inheritdoc
     */
    public function getSettingsHtml(): ?string
    {
        $view = Craft::$app->getView();

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

        return $view->renderTemplate('ckeditor/_field-settings.twig', [
            'field' => $this,
            'purifierConfigOptions' => $this->configOptions('htmlpurifier'),
            'volumeOptions' => $volumeOptions,
            'transformOptions' => $transformOptions,
            'defaultTransformOptions' => array_merge([
                [
                    'label' => Craft::t('ckeditor', 'No transform'),
                    'value' => null,
                ],
            ], $transformOptions),
        ]);
    }

    /**
     * Returns the available entry types.
     */
    public function getEntryTypes(): array
    {
        return $this->_entryTypes;
    }

    /**
     * Sets the available entry types.
     *
     * @param array<int|string|EntryType> $entryTypes The entry types, or their IDs or UUIDs
     */
    public function setEntryTypes(array $entryTypes): void
    {
        $entriesService = Craft::$app->getEntries();

        $this->_entryTypes = array_map(function(EntryType|string|int $entryType) use ($entriesService) {
            if (is_numeric($entryType)) {
                $entryType = $entriesService->getEntryTypeById($entryType);
                if (!$entryType) {
                    throw new InvalidArgumentException("Invalid entry type ID: $entryType");
                }
            } elseif (is_string($entryType)) {
                $entryTypeUid = $entryType;
                $entryType = $entriesService->getEntryTypeByUid($entryTypeUid);
                if (!$entryType) {
                    throw new InvalidArgumentException("Invalid entry type UUID: $entryTypeUid");
                }
            } elseif (!$entryType instanceof EntryType) {
                throw new InvalidArgumentException('Invalid entry type');
            }
            return $entryType;
        }, $entryTypes);
    }

    /**
     * @inheritdoc
     */
    public function getSettings(): array
    {
        $settings = parent::getSettings();

        // Cleanup
        unset(
            $settings['removeInlineStyles'],
            $settings['removeEmptyTags'],
            $settings['removeNbsp'],
        );

        $settings['entryTypes'] = array_map(fn(EntryType $entryType) => $entryType->uid, $this->_entryTypes);

        return $settings;
    }

    /**
     * @inheritdoc
     */
    public function getStaticHtml(mixed $value, ElementInterface $element): string
    {
        return Html::tag('div', $this->prepValueForInput($value, $element, true) ?: '&nbsp;');
    }

    /**
     * @inheritdoc
     */
    public function serializeValue(mixed $value, ?ElementInterface $element): mixed
    {
        if ($value instanceof HtmlFieldData) {
            $value = $value->getRawContent();
        }

        if ($value !== null) {
            // Redactor to CKEditor syntax for <figure>
            // (https://github.com/craftcms/ckeditor/issues/96)
            $value = $this->_normalizeFigures($value);
        }

        return parent::serializeValue($value, $element);
    }

    /**
     * Return HTML for the entry card or a placeholder one if entry can't be found
     *
     * @param int $entryId
     * @return string
     */
    public function getCardHtml(int $entryId, int $elementSiteId): string
    {
        $entry = Craft::$app->getEntries()->getEntryById($entryId, $elementSiteId, [
            'status' => null,
            'revisions' => null,
        ]);

        $cardConfig = [
            'autoReload' => true,
            'showDraftName' => true,
            'showStatus' => true,
            'showThumb' => true,
        ];

        if (!$entry) {
            // if for any reason we can't get this entry - mock up one that shows it's missing
            $entry = new Entry();
            $entry->enabledForSite = false;
            $entry->title = Craft::t('app', sprintf('Missing entry (id: %s)', $entryId));
            // even though it's a fake element, we need to give it a type;
            // so let's just get the first one there is
            $entry->typeId = $this->getEntryTypes()[0]->id;
        }

        if (!$entry || $entry->getIsRevision()) {
            $cardConfig = [
                'autoReload' => false,
                'showDraftName' => false,
                'showStatus' => false,
                'showThumb' => false,
            ];
        }

        return Cp::elementCardHtml($entry, $cardConfig);
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
     * @inheritdoc
     */
    public function afterElementPropagate(ElementInterface $element, bool $isNew): void
    {
        $this->entryManager()->maintainNestedElements($element, $isNew);
        parent::afterElementPropagate($element, $isNew);
    }

    /**
     * @inheritdoc
     */
    public function afterElementSave(ElementInterface $element, bool $isNew): void
    {
        // This is needed for when we have at least 2 sites, section's entries are propagated to both of them,
        // but the CKE field is set to be translatable. In that case, on the first save,
        // the CKE nested elements still need to be propagated to the second site and when that happens,
        // the propagated element has a different ID than the original one.
        // We ensure it only runs on that first propagation by comparing source and target site ids.

        if ($element->propagating === true) {
            $oldValue = $element->getFieldValue($this->handle);
            preg_match_all('/<craftentry\sdata-entryid="(\d+)"[^>]*>/is', $oldValue, $matches);
            $oldElementIds = array_map(fn($match) => (int)$match, $matches[1]);

            $newElementIds = array_map(fn($element) => $element->id, $this->createEntryQuery($element)->all());

            $this->_adjustFieldValue($element, $oldElementIds, $newElementIds);
        }
    }

    /**
     * @inheritdoc
     */
    public function beforeElementDelete(ElementInterface $element): bool
    {
        if (!parent::beforeElementDelete($element)) {
            return false;
        }

        // Delete any entries that primarily belong to this element
        $this->entryManager()->deleteNestedElements($element, $element->hardDelete);

        return true;
    }

    /**
     * @inheritdoc
     */
    public function afterElementRestore(ElementInterface $element): void
    {
        // Also restore any entries for this element
        $this->entryManager()->restoreNestedElements($element);

        parent::afterElementRestore($element);
    }

    /**
     * @inheritdoc
     */
    protected function inputHtml(mixed $value, ?ElementInterface $element, $inline): string
    {
        $view = Craft::$app->getView();
        $view->registerAssetBundle(CkeditorAsset::class);

        $ckeConfig = $this->_ckeConfig();
        $transforms = $this->_transforms();

        if ($this->defaultTransform) {
            $defaultTransform = Craft::$app->getImageTransforms()->getTransformByUid($this->defaultTransform);
        } else {
            $defaultTransform = null;
        }

        // Toolbar cleanup
        $toolbar = array_merge($ckeConfig->toolbar);

        if (!$this->enableSourceEditingForNonAdmins && !Craft::$app->getUser()->getIsAdmin()) {
            ArrayHelper::removeValue($toolbar, 'sourceEditing');
        }

        $toolbar = array_values($toolbar);

        $id = Html::id($this->handle);
        $idJs = Json::encode($view->namespaceInputId($id));
        $wordCountId = "$id-counts";
        $wordCountIdJs = Json::encode($view->namespaceInputId($wordCountId));

        $baseConfig = [
            'defaultTransform' => $defaultTransform?->handle,
            'elementSiteId' => $element?->siteId,
            'entryTypeOptions' => $this->_getEntryTypeOptions(),
            'nestedElementAttributes' => array_filter([
                'elementType' => Entry::class,
                'ownerId' => $element->id, //$element?->getCanonicalId(),
                'fieldId' => $this->id,
                'siteId' => Entry::isLocalized() ? $element?->siteId : null,
            ]),
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
                    ], $ckeConfig->headingLevels ?: []),
                ],
            ],
            'image' => [
                'toolbar' => [
                    ...(!empty($transforms) ? ['transformImage', '|'] : []),
                    'toggleImageCaption',
                    'imageTextAlternative',
                ],
            ],
            'linkOptions' => $this->_linkOptions($element),
            'table' => [
                'contentToolbar' => [
                    'tableRow',
                    'tableColumn',
                    'mergeTableCells',
                ],
            ],
            'transforms' => $transforms,
            'ui' => [
                'viewportOffset' => ['top' => 50],
                'poweredBy' => [
                    'position' => 'inside',
                    'label' => '',
                ],
            ],
        ];

        // Give plugins/modules a chance to modify the config
        $event = new ModifyConfigEvent([
            'baseConfig' => $baseConfig,
            'ckeConfig' => $ckeConfig,
        ]);
        $this->trigger(self::EVENT_MODIFY_CONFIG, $event);

        if (isset($ckeConfig->options)) {
            // translate the placeholder text
            if (isset($ckeConfig->options['placeholder']) && is_string($ckeConfig->options['placeholder'])) {
                $ckeConfig->options['placeholder'] = Craft::t('site', $ckeConfig->options['placeholder']);
            }

            $configOptionsJs = Json::encode($ckeConfig->options);
        } elseif (isset($ckeConfig->js)) {
            $configOptionsJs = <<<JS
(() => {
  $ckeConfig->js
})()
JS;
        } else {
            $configOptionsJs = '{}';
        }

        $baseConfigJs = Json::encode($event->baseConfig);
        $toolbarJs = Json::encode($toolbar);
        $languageJs = Json::encode([
            'ui' => BaseCkeditorPackageAsset::uiLanguage(),
            'content' => $element?->getSite()->language ?? Craft::$app->language,
            'textPartLanguage' => static::textPartLanguage(),
        ]);
        $listPluginJs = Json::encode($ckeConfig->listPlugin);
        $showWordCountJs = Json::encode($this->showWordCount);
        $wordLimitJs = $this->wordLimit ?: 0;

        $view->registerJs(<<<JS
(($) => {
  const config = Object.assign($baseConfigJs, $configOptionsJs);
  if (!jQuery.isPlainObject(config.toolbar)) {
    config.toolbar = {};
  }
  config.toolbar.items = $toolbarJs;
  if (!jQuery.isPlainObject(config.language)) {
    config.language = {};
  }
  config.language = Object.assign($languageJs, config.language);
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
          num: stats.words,
        }));
      }
      if (config.wordCount.displayCharacters) { // false by default
        statText.push(Craft.t('ckeditor', '{num, number} {num, plural, =1{character} other{characters}}', {
          num: stats.characters,
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
      onUpdate(stats);
    }
  } else {
    extraRemovePlugins.push('WordCount');
  }
  switch ($listPluginJs) {
    case 'List':
      extraRemovePlugins.push('DocumentList', 'DocumentListProperties');
      extraRemovePlugins.push();
      break;
    case 'DocumentList':
      extraRemovePlugins.push('List', 'ListProperties', 'TodoList');
      break;
  }
  if (extraRemovePlugins.length) {
    if (typeof config.removePlugins === 'undefined') {
      config.removePlugins = [];
    }
    config.removePlugins.push(...extraRemovePlugins);
  }
  CKEditor5.craftcms.create($idJs, config);
})(jQuery)
JS,
            View::POS_END,
        );

        if ($ckeConfig->css) {
            $view->registerCss($ckeConfig->css);
        }

        $value = $this->prepValueForInput($value, $element);
        $html = Html::textarea($this->handle, $value, [
            'id' => $id,
            'class' => 'hidden',
        ]);

        if ($this->showWordCount) {
            $html .= Html::tag('div', '&nbps;', [
                'id' => $wordCountId,
                'class' => ['ck-word-count', 'light', 'smalltext'],
            ]);
        }

        return Html::tag('div', $html, [
            'class' => array_filter([
                $this->showWordCount ? 'ck-with-show-word-count' : null,
            ]),
        ]);
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
        if ($value instanceof HtmlFieldData) {
            $value = $value->getRawContent();
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

            if ($static) {
                $value = $this->_prepCardsForStaticInput($value, $element->siteId);
            } else {
                $value = $this->_prepCardsForInput($value, $element->siteId);
            }
        }

        return parent::prepValueForInput($value, $element);
    }

    /**
     * Instantiate and return the NestedElementManager
     *
     * @return NestedElementManager
     */
    private function entryManager(): NestedElementManager
    {
        if (!isset($this->_entryManager)) {
            $this->_entryManager = new NestedElementManager(
                Entry::class,
                fn(ElementInterface $owner) => $this->createEntryQuery($owner),
                [
                    'fieldHandle' => $this->handle,
                    'propagationMethod' => match($this->translationMethod) {
                        self::TRANSLATION_METHOD_NONE => PropagationMethod::All,
                        self::TRANSLATION_METHOD_SITE => PropagationMethod::None,
                        self::TRANSLATION_METHOD_SITE_GROUP => PropagationMethod::SiteGroup,
                        self::TRANSLATION_METHOD_LANGUAGE => PropagationMethod::Language,
                        self::TRANSLATION_METHOD_CUSTOM => PropagationMethod::Custom,
                    },
                    'propagationKeyFormat' => $this->translationKeyFormat,
                    'allowDeletion' => false,
                    'criteria' => [
                        'fieldId' => $this->id,
                    ],
                    'valueGetter' => $this->_entryManagerValueGetter(),
                    'valueSetter' => $this->_entryManagerValueSetter(),
                ],
            );
        }

        return $this->_entryManager;
    }

    /**
     * Used to get value via NestedElementManager->getValue();
     *
     * @return Closure
     */
    private function _entryManagerValueGetter(): Closure
    {
        return function(ElementInterface $owner, bool $fetchAll = false) {
            $value = $owner->getFieldValue($this->handle);
            preg_match_all('/<craftentry\sdata-entryid="(\d+)"[^>]*>/is', $value, $matches);

            $query = $this->createEntryQuery($owner);
            $query->where(['in', 'elements.id', $matches[1]]);
            if (!empty($matches[1])) {
                $query->orderBy(new Expression('FIELD (elements.id, ' . implode(', ', $matches[1]) . ')'));
            }
            return $query;
        };
    }

    /**
     * Used to set value via NestedElementManager->setValue();
     *
     * @return Closure
     */
    private function _entryManagerValueSetter(): Closure
    {
        return function(ElementInterface $owner, ElementQueryInterface|ElementCollection $value) {
            if ($owner->duplicateOf !== null) {
                $oldElementIds = array_map(fn($element) => $element->id, $this->createEntryQuery($owner->duplicateOf)->all());
                $newElementIds = array_map(fn($element) => $element->id, $value->all());
                $this->_adjustFieldValue($owner, $oldElementIds, $newElementIds);
            }
        };
    }

    /**
     * Adjusts owner element's CKE field value with updated nested element ids.
     * E.g. on draft apply, propagation to a new site, revision creation etc
     *
     * @param ElementInterface $owner
     * @param array $oldElementIds
     * @param array $newElementIds
     * @return void
     */
    private function _adjustFieldValue(ElementInterface $owner, array $oldElementIds, array $newElementIds): void
    {
        $fieldValue = $owner->getFieldValue($this->handle);
        if ($oldElementIds !== $newElementIds) {
            // and in the field value replace elementIds from original (duplicateOf) with elementIds from the new owner
            $value = preg_replace_callback(
                '/(<craftentry\sdata-entryid=")(\d+)("[^>]*>)/is',
                function(array $match) use ($oldElementIds, $newElementIds) {
                    $key = array_search($match[2], $oldElementIds);
                    if (isset($newElementIds[$key])) {
                        return $match[1] . $newElementIds[$key] . $match[3];
                    }
                    return $match[1] . $match[2] . $match[3];
                },
                $fieldValue,
                -1,
            );

            if ($fieldValue?->getRawContent() !== $value) {
                $owner->setFieldValue($this->handle, $value);
                $owner->mergingCanonicalChanges = true;

                Craft::$app->getElements()->saveElement($owner, false, false, false, false, false);
            }
        }
    }

    private function createEntryQuery(?ElementInterface $owner): EntryQuery
    {
        $query = Entry::find();

        // Existing element?
        if ($owner && $owner->id) {
            $query->attachBehavior(self::class, new EventBehavior([
                ElementQuery::EVENT_BEFORE_PREPARE => function(
                    CancelableEvent $event,
                    EntryQuery $query,
                ) use ($owner) {
                    $query->ownerId = $owner->id;

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
            $query->prepForEagerLoading($this->handle, $owner);
        } else {
            $query->id = false;
        }

        $query
            ->fieldId($this->id)
            ->siteId($owner->siteId ?? null);

        return $query;
    }

    /**
     * Returns entry type options in form of an array with 'label' and 'value' keys for each option.
     *
     * @return array
     */
    private function _getEntryTypeOptions(): array
    {
        $entryTypeOptions = array_map(
            fn(EntryType $entryType) => [
                'label' => Craft::t('site', $entryType->name),
                'value' => $entryType->id,
            ],
            $this->getEntryTypes(),
        );
        usort($entryTypeOptions, fn(array $a, array $b) => $a['label'] <=> $b['label']);

        return $entryTypeOptions;
    }

    /**
     * Fill entry card CKE markup (<div class="cke-entry-card" data-entryid="96"></div>)
     * with actual card HTML of the entry it's linking to
     *
     * @param string $value
     * @return string
     */
    private function _prepCardsForInput(string $value, int $elementSiteId): string
    {
        $offset = 0;
        while (preg_match('/<craftentry\sdata-entryid="(\d+)"[^>]*>/is', $value, $match, PREG_OFFSET_CAPTURE, $offset)) {
            $entryId = $match[1][0];

            /** @var int $startPos */
            $startPos = $match[0][1];
            $endPos = $startPos + strlen($match[0][0]);

            $cardHtml = $this->getCardHtml($entryId, $elementSiteId);

            try {
                $tag = Html::modifyTagAttributes($match[0][0], [
                    'data-cardHtml' => $cardHtml,
                ]);
            } catch (InvalidHtmlTagException) {
                $offset = $endPos;
                continue;
            }

            $value = substr($value, 0, $startPos) . $tag . substr($value, $endPos);
            $offset = $startPos + strlen($tag);
        }

        return $value;
    }

    /**
     * Replace the entry card CKE markup (<div class="cke-entry-card" data-entryid="96" data-siteid="1"></div>)
     * with actual card HTML of the entry it's linking to
     *
     * @param string $value
     * @return string
     */
    private function _prepCardsForStaticInput(string $value, int $elementSiteId): string
    {
        $offset = 0;
        while (preg_match('/<craftentry\sdata-entryid="(\d+)"[^>]*>&nbsp;<\/craftentry>/is', $value, $match, PREG_OFFSET_CAPTURE, $offset)) {
            $entryId = $match[1][0];

            /** @var int $startPos */
            $startPos = $match[0][1];
            $endPos = $startPos + strlen($match[0][0]);

            $cardHtml = $this->getCardHtml($entryId, $elementSiteId);

            $value = substr($value, 0, $startPos) . $cardHtml . substr($value, $endPos);
            $offset = $startPos + strlen($cardHtml);
        }

        return $value;
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

        $previewsInData = $this->_ckeConfig()->options['mediaEmbed']['previewsInData'] ?? false;

        $value = preg_replace_callback(
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

        return $value;
    }

    /**
     * Returns the field’s CKEditor config.
     *
     * @return CkeConfig
     */
    private function _ckeConfig(): CkeConfig
    {
        if ($this->ckeConfig) {
            try {
                return Plugin::getInstance()->getCkeConfigs()->getByUid($this->ckeConfig);
            } catch (InvalidArgumentException) {
            }
        }

        return new CkeConfig();
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

        $sectionSources = $this->_sectionSources($element);
        $categorySources = $this->_categorySources($element);
        $volumeSources = $this->_volumeSources();

        if (!empty($sectionSources)) {
            $linkOptions[] = [
                'label' => Craft::t('ckeditor', 'Link to an entry'),
                'elementType' => Entry::class,
                'refHandle' => Entry::refHandle(),
                'sources' => $sectionSources,
                'criteria' => ['uri' => ':notempty:'],
            ];
        }

        if (!empty($categorySources)) {
            $linkOptions[] = [
                'label' => Craft::t('ckeditor', 'Link to a category'),
                'elementType' => Category::class,
                'refHandle' => Category::refHandle(),
                'sources' => $categorySources,
            ];
        }

        if (!empty($volumeSources)) {
            $criteria = [];
            if ($this->showUnpermittedFiles) {
                $criteria['uploaderId'] = null;
            }
            $linkOptions[] = [
                'label' => Craft::t('ckeditor', 'Link to an asset'),
                'elementType' => Asset::class,
                'refHandle' => Asset::refHandle(),
                'sources' => $volumeSources,
                'criteria' => $criteria,
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
     * Returns the available section sources.
     *
     * @param ElementInterface|null $element The element the field is associated with, if there is one
     * @param bool $showSingles Whether to include Singles in the available sources
     * @return array
     */
    private function _sectionSources(?ElementInterface $element, bool $showSingles = false): array
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
                    }
                }
            }
        }

        if ($showSingles) {
            array_unshift($sources, 'singles');
        }

        if (!empty($sources)) {
            array_unshift($sources, '*');
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

        return Collection::make(Craft::$app->getCategories()->getAllGroups())
            ->filter(fn(CategoryGroup $group) => $group->getSiteSettings()[$element->siteId]?->hasUrls ?? false)
            ->map(fn(CategoryGroup $group) => "group:$group->uid")
            ->values()
            ->all();
    }

    /**
     * Returns the available volume sources.
     *
     * @return string[]
     */
    private function _volumeSources(): array
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

        return $volumes
            ->map(fn(Volume $volume) => "volume:$volume->uid")
            ->values()
            ->all();
    }

    /**
     * Get available transforms.
     *
     * @return array
     */
    private function _transforms(): array
    {
        if (!$this->availableTransforms) {
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
     * @throws \HTMLPurifier_Exception
     */
    private function _adjustPurifierConfig(HTMLPurifier_Config $purifierConfig): HTMLPurifier_Config
    {
        $ckeConfig = $this->_ckeConfig();

        // These will come back as indexed (key => true) arrays
        $allowedTargets = $purifierConfig->get('Attr.AllowedFrameTargets');
        $allowedRels = $purifierConfig->get('Attr.AllowedRel');
        if (isset($ckeConfig->options['link']['addTargetToExternalLinks'])) {
            $allowedTargets['_blank'] = true;
        }
        foreach ($ckeConfig->options['link']['decorators'] ?? [] as $decorator) {
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

        if (in_array('todoList', $ckeConfig->toolbar)) {
            // Add input[type=checkbox][disabled][checked] to the definition
            /** @var HTMLPurifier_HTMLDefinition|null $def */
            $def = $purifierConfig->getDefinition('HTML', true);
            $def?->addElement('input', 'Inline', 'Inline', '', [
                'type' => 'Enum#checkbox',
                'disabled' => 'Enum#disabled',
                'checked' => 'Enum#checked',
            ]);
        }

        if (in_array('numberedList', $ckeConfig->toolbar)) {
            /** @var HTMLPurifier_HTMLDefinition|null $def */
            $def = $purifierConfig->getDefinition('HTML', true);
            $def?->addAttribute('ol', 'style', 'Text');
        }

        if (in_array('bulletedList', $ckeConfig->toolbar)) {
            /** @var HTMLPurifier_HTMLDefinition|null $def */
            $def = $purifierConfig->getDefinition('HTML', true);
            $def?->addAttribute('ul', 'style', 'Text');
        }

        if (in_array('createEntry', $ckeConfig->toolbar)) {
            $def = $purifierConfig->getDefinition('HTML', true);
            $def?->addElement('craftentry', 'Inline', 'Inline', '', [
                //'class' => 'Text',
                'data-entryid' => 'Number',
            ]);
        }

        return $purifierConfig;
    }
}
