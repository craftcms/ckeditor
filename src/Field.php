<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor;

use Craft;
use craft\base\ElementInterface;
use craft\ckeditor\events\DefineLinkOptionsEvent;
use craft\ckeditor\events\ModifyConfigEvent;
use craft\ckeditor\web\assets\BaseCkeditorPackageAsset;
use craft\ckeditor\web\assets\ckeditor\CkeditorAsset;
use craft\elements\Asset;
use craft\elements\Category;
use craft\elements\Entry;
use craft\errors\InvalidHtmlTagException;
use craft\helpers\ArrayHelper;
use craft\helpers\Html;
use craft\helpers\Json;
use craft\helpers\UrlHelper;
use craft\htmlfield\events\ModifyPurifierConfigEvent;
use craft\htmlfield\HtmlField;
use craft\htmlfield\HtmlFieldData;
use craft\i18n\Locale;
use craft\models\CategoryGroup;
use craft\models\ImageTransform;
use craft\models\Section;
use craft\models\Volume;
use craft\services\ElementSources;
use craft\web\View;
use HTMLPurifier_Config;
use HTMLPurifier_HTMLDefinition;
use Illuminate\Support\Collection;
use yii\base\InvalidArgumentException;

/**
 * CKEditor field type
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 */
class Field extends HtmlField
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

        return $settings;
    }

    /**
     * @inheritdoc
     */
    protected function inputHtml(mixed $value, ElementInterface $element = null): string
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
            'accessibleFieldName' => $this->_accessibleFieldName($element),
            'describedBy' => $this->_describedBy($view),
            'findAndReplace' => [
                'uiType' => 'dropdown',
            ],
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
            'assetSources' => $this->_assetSources(),
            'assetSelectionCriteria' => $this->_assetSelectionCriteria(),
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
            'toolbar' => $toolbar,
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
        $toolbarJs = Json::encode($event->toolbar);
        $languageJs = Json::encode([
            'ui' => BaseCkeditorPackageAsset::uiLanguage(),
            'content' => $element?->getSite()->language ?? Craft::$app->language,
            'textPartLanguage' => static::textPartLanguage(),
        ]);
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
    public function getStaticHtml(mixed $value, ElementInterface $element): string
    {
        return Html::tag(
            'div',
            $this->prepValueForInput($value, $element) ?: '&nbsp;',
            ['class' => 'noteditable']
        );
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
    protected function prepValueForInput($value, ?ElementInterface $element): string
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
        }

        return parent::prepValueForInput($value, $element);
    }

    /**
     * @inheritdoc
     */
    public function serializeValue(mixed $value, ?ElementInterface $element = null): mixed
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
    private function _linkOptions(?ElementInterface $element = null): array
    {
        $linkOptions = [];

        $sectionSources = $this->_entrySources($element);
        $categorySources = $this->_categorySources($element);
        $volumeSources = $this->_assetSources(true);

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
                'criteria' => ['uri' => ':notempty:'],
            ];
        }

        if (!empty($volumeSources)) {
            $linkOptions[] = [
                'label' => Craft::t('ckeditor', 'Link to an asset'),
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
     * @return array
     */
    private function _entrySources(?ElementInterface $element = null): array
    {
        $sources = [];
        $sections = Craft::$app->getSections()->getAllSections();
        $showSingles = false;

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
    private function _categorySources(?ElementInterface $element = null): array
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
}
