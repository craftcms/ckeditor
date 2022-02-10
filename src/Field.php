<?php

namespace craft\ckeditor;

use Craft;
use craft\base\ElementInterface;
use craft\base\Volume;
use craft\ckeditor\assets\field\FieldAsset;
use craft\ckeditor\events\ModifyPurifierConfigEvent;
use craft\elements\Asset;
use craft\helpers\FileHelper;
use craft\helpers\Html;
use craft\helpers\HtmlPurifier;
use craft\helpers\Json;
use craft\helpers\StringHelper;
use craft\helpers\Template;
use craft\helpers\UrlHelper;
use craft\validators\HandleValidator;
use HTMLPurifier_Config;
use Twig\Markup;
use yii\db\Schema;

/**
 * CKEditor field type
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 */
class Field extends \craft\base\Field
{
    /**
     * @event ModifyPurifierConfigEvent The event that is triggered when creating HTML Purifier config
     *
     * Plugins can get notified when HTML Purifier config is being constructed.
     *
     * ```php
     * use craft\ckeditor\events\ModifyPurifierConfigEvent;
     * use craft\ckeditor\Field;
     * use HTMLPurifier_AttrDef_Text;
     * use yii\base\Event;
     *
     * Event::on(Field::class, Field::EVENT_MODIFY_PURIFIER_CONFIG, function(ModifyPurifierConfigEvent $e) {
     *      // ...
     * });
     * ```
     */
    const EVENT_MODIFY_PURIFIER_CONFIG = 'modifyPurifierConfig';

    /**
     * @inheritdoc
     */
    public static function displayName(): string
    {
        return Craft::t('ckeditor', 'CKEditor');
    }

    /**
     * @var string|null The initialization JS code
     */
    public $initJs;

    /**
     * @var string|null The HTML Purifier config file to use
     */
    public $purifierConfig;

    /**
     * @var bool Whether the HTML should be purified on save
     */
    public $purifyHtml = true;

    /**
     * @var string The type of database column the field should have in the content table
     */
    public $columnType = Schema::TYPE_TEXT;

    /**
     * @var string|array|null The volumes that should be available for image selection.
     * @since 1.2.0
     */
    public $availableVolumes = '*';

    /**
     * @var string|array|null The transforms available when selecting an image.
     * @since 1.2.0
     */
    public $availableTransforms = '*';

    /**
     * @var string|null The default transform to use.
     */
    public $defaultTransform;

    /**
     * @var bool Whether to show volumes the user doesn’t have permission to view.
     * @since 1.2.0
     */
    public $showUnpermittedVolumes = false;

    /**
     * @var bool Whether to show files the user doesn’t have permission to view, per the
     * “View files uploaded by other users” permission.
     * @since 1.2.0
     */
    public $showUnpermittedFiles = false;

    /**
     * @inheritdoc
     */
    public function init()
    {
        if ($this->initJs === '') {
            $this->initJs = null;
        }

        parent::init();
    }

    /**
     * @inheritdoc
     */
    public function getSettingsHtml(): string
    {
        $volumeOptions = [];
        foreach (Craft::$app->getVolumes()->getPublicVolumes() as $volume) {
            if ($volume->hasUrls) {
                $volumeOptions[] = [
                    'label' => $volume->name,
                    'value' => $volume->uid
                ];
            }
        }

        $transformOptions = [];
        foreach (Craft::$app->getAssetTransforms()->getAllTransforms() as $transform) {
            $transformOptions[] = [
                'label' => $transform->name,
                'value' => $transform->uid
            ];
        }

        return Craft::$app->getView()->renderTemplate('ckeditor/_field-settings', [
            'field' => $this,
            'purifierConfigOptions' => $this->_getCustomConfigOptions('htmlpurifier'),
            'volumeOptions' => $volumeOptions,
            'transformOptions' => $transformOptions,
            'defaultTransformOptions' => array_merge([
                [
                    'label' => Craft::t('ckeditor', 'No transform'),
                    'value' => null
                ]
            ], $transformOptions),
        ]);
    }

    /**
     * @inheritdoc
     */
    public function getContentColumnType(): string
    {
        return $this->columnType;
    }

    /**
     * @inheritdoc
     */
    public function normalizeValue($value, ElementInterface $element = null): ?Markup
    {
        if ($value === null || $value instanceof Markup) {
            return $value;
        }

        // TODO: See if this is still necessary after updating to latest CKEditor.
        if ($value === '<p>&nbsp;</p>') {
            return null;
        }

        // Prevent everyone from having to use the |raw filter when outputting RTE content
        return Template::raw($value);
    }

    /**
     * @inheritdoc
     */
    public function serializeValue($value, ElementInterface $element = null): ?string
    {
        if (!$value) {
            return null;
        }

        // Get the raw value
        $value = (string)$value;

        if (!$value) {
            return null;
        }

        if ($this->purifyHtml) {
            // Parse reference tags so HTMLPurifier doesn't encode the curly braces
            $value = $this->_parseRefs($value, $element);

            // Sanitize & tokenize any SVGs
            $svgTokens = [];
            $svgContent = [];
            $value = preg_replace_callback('/<svg\b.*>.*<\/svg>/Uis', function(array $match) use (&$svgTokens, &$svgContent): string {
                $svgContent[] = Html::sanitizeSvg($match[0]);
                return $svgTokens[] = 'svg:' . StringHelper::randomString(10);
            }, $value);

            $value = HtmlPurifier::process($value, $this->_getPurifierConfig());

            // Put the sanitized SVGs back
            $value = str_replace($svgTokens, $svgContent, $value);
        }

        // Find any element URLs and swap them with ref tags
        $value = preg_replace_callback(
            '/(href=|src=)([\'"])([^\'"\?#]*)(\?[^\'"\?#]+)?(#[^\'"\?#]+)?(?:#|%23)([\w\\\\]+)\:(\d+)(?:@(\d+))?(\:(?:transform\:)?' . HandleValidator::$handlePattern . ')?\2/',
            function($matches) {
                [, $attr, $q, $url, $query, $hash, $elementType, $ref, $siteId, $transform] = array_pad($matches, 10, null);

                // Create the ref tag, and make sure :url is in there
                $ref = $elementType . ':' . $ref . ($siteId ? "@$siteId" : '') . ($transform ?: ':url');

                if ($query || $hash) {
                    // Make sure that the query/hash isn't actually part of the parsed URL
                    // - someone's Entry URL Format could include "?slug={slug}" or "#{slug}", etc.
                    // - assets could include ?mtime=X&focal=none, etc.
                    $parsed = Craft::$app->getElements()->parseRefs("{{$ref}}");
                    if ($query) {
                        // Decode any HTML entities, e.g. &amp;
                        $query = Html::decode($query);
                        if (mb_strpos($parsed, $query) !== false) {
                            $url .= $query;
                            $query = '';
                        }
                    }
                    if ($hash && mb_strpos($parsed, $hash) !== false) {
                        $url .= $hash;
                        $hash = '';
                    }
                }

                return $attr . $q . '{' . $ref . '||' . $url . '}' . $query . $hash . $q;
            },
            $value);

        // Swap any regular URLS with element refs, too

        // Get all URLs, sort by longest first.
        $sortArray = [];
        $siteUrlsById = [];
        foreach (Craft::$app->getSites()->getAllSites(false) as $site) {
            if ($site->hasUrls) {
                $siteUrlsById[$site->id] = $site->getBaseUrl();
                $sortArray[$site->id] = strlen($siteUrlsById[$site->id]);
            }
        }
        arsort($sortArray);

        $value = preg_replace_callback(
            '/(href=|src=)([\'"])(http.*)?\2/',
            function($matches) use ($sortArray, $siteUrlsById) {
                $url = $matches[3] ?? null;

                if (!$url) {
                    return '';
                }

                // Longest URL first
                foreach ($sortArray as $siteId => $bogus) {
                    // Starts with a site URL

                    if (StringHelper::startsWith($url, $siteUrlsById[$siteId])) {
                        // Drop query
                        $uri = preg_replace('/\?.*/', '', $url);

                        // Drop page trigger
                        $pageTrigger = Craft::$app->getConfig()->getGeneral()->getPageTrigger();
                        if (strpos($pageTrigger, '?') !== 0) {
                            $pageTrigger = preg_quote($pageTrigger, '/');
                            $uri = preg_replace("/^(?:(.*)\/)?$pageTrigger(\d+)$/", '', $uri);
                        }

                        // Drop site URL.
                        $uri = StringHelper::removeLeft($uri, $siteUrlsById[$siteId]);

                        if ($element = Craft::$app->getElements()->getElementByUri($uri, $siteId, true)) {
                            $refHandle = $element::refHandle();
                            $url = '{' . $refHandle . ':' . $element->id . '@' . $siteId . ':url||' . $url . '}';
                            break;
                        }
                    }
                }

                return $matches[1] . $matches[2] . $url . $matches[2];
            },
            $value);

        if (Craft::$app->getDb()->getIsMysql()) {
            // Encode any 4-byte UTF-8 characters.
            $value = StringHelper::encodeMb4($value);
        }

        return $value;
    }

    /**
     * @inheritdoc
     */
    public function isValueEmpty($value, ElementInterface $element): bool
    {
        return parent::isValueEmpty((string)$value, $element);
    }

    /**
     * @inheritdoc
     */
    protected function inputHtml($value, ElementInterface $element = null): string
    {
        $view = Craft::$app->getView();
        $view->registerJsFile(Plugin::getInstance()->getBuildUrl());
        $view->registerAssetBundle(FieldAsset::class);

        $language = Json::encode(mb_strtolower(Craft::$app->language));
        $filebrowserBrowseUrl = Json::encode($this->availableVolumes ? UrlHelper::actionUrl('ckeditor/assets/browse', [
            'fieldId' => $this->id,
        ]) : null);
        $filebrowserImageBrowseUrl = Json::encode($this->availableVolumes ? UrlHelper::actionUrl('ckeditor/assets/browse', [
            'fieldId' => $this->id,
            'kind' => Asset::KIND_IMAGE,
        ]) : null);

        $js = <<<JS
const language = $language;
const filebrowserBrowseUrl = $filebrowserBrowseUrl;
const filebrowserImageBrowseUrl = $filebrowserImageBrowseUrl;

JS;

        $js .= $this->initJs ?? <<<JS
if (typeof CKEDITOR !== 'undefined') {
    // CKEditor 4
    return CKEDITOR.replace('__EDITOR__', {
        language,
        filebrowserBrowseUrl,
        filebrowserImageBrowseUrl,
    });
} else {
    // CKEditor 5
    let editorClass;
    if (typeof ClassicEditor !== 'undefined') {
        editorClass = ClassicEditor;
    } else {
        if (typeof InlineEditor !== 'undefined') {
            editorClass = InlineEditor;
        } else if (typeof BalloonEditor !== 'undefined') {
            editorClass = BalloonEditor;
        } else if (typeof DecoupledEditor !== 'undefined') {
            editorClass = DecoupledEditor;
        } else {
            throw 'No CKEditor class detected';
        }
        
    }
    return await editorClass
        .create(document.querySelector('#__EDITOR__'), {
            language,
        });
}
JS;

        $id = Html::id($this->handle);
        $nsId = $view->namespaceInputId($id);
        $js = str_replace('__EDITOR__', $nsId, $js);
        $view->registerJs("initCkeditor('$nsId', async function(){\n$js\n})");

        if ($value instanceof Markup) {
            $value = (string)$value;
        }

        if ($value !== null) {
            // Parse reference tags
            $value = $this->_parseRefs($value, $element);
        }

        return Html::tag('div',
            Html::textarea($this->handle, $value, [
                'id' => $id,
            ]), [
                'class' => 'readable',
            ]);
    }

    /**
     * Parse ref tags in URLs, while preserving the original tag values in the URL fragments
     * (e.g. `href="{entry:id:url}"` => `href="[entry-url]#entry:id:url"`)
     *
     * @param string $value
     * @param ElementInterface|null $element
     * @return string
     */
    private function _parseRefs(string $value, ElementInterface $element = null): string
    {
        if (!StringHelper::contains($value, '{')) {
            return $value;
        }

        return preg_replace_callback('/(href=|src=)([\'"])(\{([\w\\\\]+\:\d+(?:@\d+)?\:(?:transform\:)?' . HandleValidator::$handlePattern . ')(?:\|\|[^\}]+)?\})(?:\?([^\'"#]*))?(#[^\'"#]+)?\2/', function($matches) use ($element) {
            [$fullMatch, $attr, $q, $refTag, $ref, $query, $fragment] = array_pad($matches, 7, null);
            $parsed = Craft::$app->getElements()->parseRefs($refTag, $element->siteId ?? null);
            // If the ref tag couldn't be parsed, leave it alone
            if ($parsed === $refTag) {
                return $fullMatch;
            }
            if ($query) {
                // Decode any HTML entities, e.g. &amp;
                $query = Html::decode($query);
                if (mb_strpos($parsed, $query) !== false) {
                    $parsed = UrlHelper::urlWithParams($parsed, $query);
                }
            }
            return $attr . $q . $parsed . ($fragment ?? '') . '#' . $ref . $q;
        }, $value);
    }

    /**
     * @inheritdoc
     */
    public function getStaticHtml($value, ElementInterface $element): string
    {
        return Html::tag('div', (string)$value ?: '&nbsp;');
    }

    /**
     * Returns the available config options in a given directory.
     *
     * @param string $dir The directory name within the config/ folder to look for config files
     * @return array
     */
    private function _getCustomConfigOptions(string $dir): array
    {
        $options = ['' => Craft::t('ckeditor', 'Default')];
        $path = Craft::$app->getPath()->getConfigPath() . DIRECTORY_SEPARATOR . $dir;

        if (is_dir($path)) {
            $files = FileHelper::findFiles($path, [
                'only' => ['*.json'],
                'recursive' => false,
            ]);

            foreach ($files as $file) {
                $options[pathinfo($file, PATHINFO_BASENAME)] = pathinfo($file, PATHINFO_FILENAME);
            }
        }

        return $options;
    }

    /**
     * Returns the HTML Purifier config used by this field.
     *
     * @return HTMLPurifier_Config
     */
    private function _getPurifierConfig(): HTMLPurifier_Config
    {
        $purifierConfig = HTMLPurifier_Config::createDefault();
        $purifierConfig->autoFinalize = false;

        $config = $this->_getConfig('htmlpurifier', $this->purifierConfig) ?: [
            'Attr.AllowedFrameTargets' => ['_blank'],
            'Attr.EnableID' => true,
            'HTML.SafeIframe' => true,
            'URI.SafeIframeRegexp' => '%^(https?:)?//(www\.youtube(-nocookie)?\.com/embed/|player\.vimeo\.com/video/)%',
        ];

        foreach ($config as $option => $value) {
            $purifierConfig->set($option, $value);
        }

        // Give plugins a chance to modify the HTML Purifier config, or add new ones
        $event = new ModifyPurifierConfigEvent([
            'config' => $purifierConfig,
        ]);

        $this->trigger(self::EVENT_MODIFY_PURIFIER_CONFIG, $event);

        return $event->config;
    }

    /**
     * Returns a JSON-decoded config, if it exists.
     *
     * @param string $dir The directory name within the config/ folder to look for the config file
     * @param string|null $file The filename to load
     * @return array|false The config, or false if the file doesn't exist
     */
    private function _getConfig(string $dir, string $file = null)
    {
        if (!$file) {
            return false;
        }

        $path = Craft::$app->getPath()->getConfigPath() . DIRECTORY_SEPARATOR . $dir . DIRECTORY_SEPARATOR . $file;

        if (!is_file($path)) {
            return false;
        }

        return Json::decode(file_get_contents($path));
    }
}
