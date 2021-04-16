<?php

namespace craft\ckeditor;

use Craft;
use craft\base\ElementInterface;
use craft\ckeditor\assets\field\FieldAsset;
use craft\helpers\FileHelper;
use craft\helpers\Html;
use craft\helpers\HtmlPurifier;
use craft\helpers\Json;
use craft\helpers\StringHelper;
use craft\helpers\Template;
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
     * use craft\redactor\events\ModifyPurifierConfigEvent;
     * use craft\redactor\Field;
     * use HTMLPurifier_AttrDef_Text;
     * use yii\base\Event;
     *
     * Event::on(Field::class, Field::EVENT_MODIFY_PURIFIER_CONFIG, function(ModifyPurifierConfigEvent $e) {
     *      // Allow the use of the Redactor Variables plugin
     *      $e->config->getHTMLDefinition(true)->addAttribute('span', 'data-redactor-type', new HTMLPurifier_AttrDef_Text());
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
        return Craft::$app->getView()->renderTemplate('ckeditor/_field-settings', [
            'field' => $this,
            'purifierConfigOptions' => $this->_getCustomConfigOptions('htmlpurifier'),
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
            $value = HtmlPurifier::process($value, $this->_getPurifierConfig());
        }

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
    public function getInputHtml($value, ElementInterface $element = null): string
    {
        $view = Craft::$app->getView();
        $view->registerJsFile(Plugin::getInstance()->getBuildUrl());
        $view->registerAssetBundle(FieldAsset::class);

        $js = $this->initJs ?? <<<JS
if (typeof CKEDITOR !== 'undefined') {
    // CKEditor 4
    return CKEDITOR.replace('__EDITOR__', {
        language: Craft.language.toLowerCase(),
    });
} else {
    // CKEditor 5
    return await (ClassicEditor || InlineEditor || BalloonEditor || DecoupledEditor)
        .create(document.querySelector('#__EDITOR__'), {
            language: Craft.language.toLowerCase(),
        });
}
JS;

        $id = Html::id($this->handle);
        $nsId = $view->namespaceInputId($id);
        $js = str_replace('__EDITOR__', $nsId, $js);
        $view->registerJs("initCkeditor('$nsId', async function(){\n$js\n})");

        return Html::textarea($this->handle, $value, [
            'id' => $id,
        ]);
    }

    /**
     * @inheritdoc
     */
    public function getStaticHtml($value, ElementInterface $element): string
    {
        return Html::tag('div', (string)$value ?: '&nbsp;');
    }

    /**
     * Returns the available Redactor config options.
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
            'URI.SafeIframeRegexp' => '%^(https?:)?//(www.youtube.com/embed/|player.vimeo.com/video/)%',
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
