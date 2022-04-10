<?php

namespace craft\ckeditor;

use Craft;
use craft\base\ElementInterface;
use craft\ckeditor\assets\field\FieldAsset;
use craft\elements\Asset;
use craft\helpers\Html;
use craft\helpers\Json;
use craft\helpers\UrlHelper;
use craft\htmlfield\events\ModifyPurifierConfigEvent;
use craft\htmlfield\HtmlField;
use HTMLPurifier_Config;

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
     * use craft\ckeditor\Field;
     * use craft\htmlfield\ModifyPurifierConfigEvent;
     * use HTMLPurifier_AttrDef_Text;
     * use yii\base\Event;
     *
     * Event::on(
     *     Field::class,
     *     Field::EVENT_MODIFY_PURIFIER_CONFIG,
     *     function(ModifyPurifierConfigEvent $event) {
     *          // ...
     *     }
     * );
     * ```
     */
    public const EVENT_MODIFY_PURIFIER_CONFIG = 'modifyPurifierConfig';

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
    public ?string $initJs = null;

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
    public ?string $defaultTransform = null;

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
    public function init(): void
    {
        if ($this->initJs === '') {
            $this->initJs = null;
        }

        parent::init();
    }

    /**
     * @inheritdoc
     */
    public function getSettingsHtml(): ?string
    {
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

        return Craft::$app->getView()->renderTemplate('ckeditor/_field-settings', [
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
    protected function inputHtml(mixed $value, ElementInterface $element = null): string
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

        return Html::tag('div',
            Html::textarea($this->handle, $this->prepValueForInput($value, $element), [
                'id' => $id,
            ]), [
                'class' => 'readable',
            ]);
    }

    /**
     * @inheritdoc
     */
    public function getStaticHtml(mixed $value, ElementInterface $element): string
    {
        return Html::tag('div', $this->prepValueForInput($value, $element) ?: '&nbsp;');
    }

    /**
     * @inheritdoc
     */
    protected function purifierConfig(): HTMLPurifier_Config
    {
        $purifierConfig = parent::purifierConfig();

        // Give plugins a chance to modify the HTML Purifier config, or add new ones
        $event = new ModifyPurifierConfigEvent([
            'config' => $purifierConfig,
        ]);

        $this->trigger(self::EVENT_MODIFY_PURIFIER_CONFIG, $event);

        return $event->config;
    }
}
