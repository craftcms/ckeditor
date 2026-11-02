<?php

/**
 * @link https://craftcms.com/
 *
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace CraftCms\Ckeditor\Console\Commands;

use CraftCms\Ckeditor\Console\ToolbarBuilder;
use CraftCms\Ckeditor\Field;
use CraftCms\Cms\Console\CraftCommand;
use CraftCms\Cms\Field\MissingField;
use CraftCms\Cms\ProjectConfig\ProjectConfig;
use CraftCms\Cms\ProjectConfig\ProjectConfigHelper;
use CraftCms\Cms\Shared\Exceptions\OperationAbortedException;
use CraftCms\Cms\Support\Json;
use CraftCms\Cms\Support\Str;
use Illuminate\Console\Command;
use InvalidArgumentException;
use RuntimeException;

use function Laravel\Prompts\confirm;

/**
 * Converts Redactor fields to CKEditor
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 *
 * @since 4.2.0
 */
class ConvertRedactorCommand extends Command
{
    use CraftCommand;

    #[\Override]
    protected $signature = 'ckeditor:convert:redactor';

    #[\Override]
    protected $description = 'Converts Redactor fields to CKEditor.';

    #[\Override]
    protected $aliases = ['ckeditor/convert', 'ckeditor/convert/redactor'];

    private const string LEGACY_MISSING_FIELD = 'craft\\fields\\MissingField';

    private ProjectConfig $projectConfig;

    private array $defaultRedactorConfig = [
        'buttons' => ['html', 'format', 'bold', 'italic', 'deleted', 'lists', 'image', 'file', 'link'],
        'buttonsAdd' => [],
        'buttonsAddAfter' => false,
        'buttonsAddBefore' => false,
        'buttonsAddFirst' => [],
        'buttonsHide' => [],
        'formatting' => ['p', 'blockquote', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        'formattingAdd' => false,
        'formattingHide' => false,
        'inline' => false, // !
        'linkNewTab' => true,
        'linkNofollow' => false, // ! https://github.com/ckeditor/ckeditor5/issues/6436
        'linkTarget' => false, // !
        'linkTitle' => false, // !
        'placeholder' => false,
        'plugins' => [],
        'preClass' => false, // !
        'preSpaces' => 4,
        'source' => true,
    ];

    private array $ignoredRedactorSettings = [
        'activeButtons',
        'activeButtonsAdd',
        'air',
        'animation',
        'autoparse',
        'autoparseImages',
        'autoparseLinks',
        'autoparsePaste',
        'autoparseStart',
        'autoparseVideo',
        'autosave',
        'autosaveData',
        'autosaveMethod',
        'autosaveName',
        'breakline',
        'buttonsHideOnMobile',
        'buttonsTextLabeled',
        'callbacks',
        'cleanInlineOnEnter',
        'cleanOnEnter',
        'clickToCancel',
        'clickToEdit',
        'clickToSave',
        'clipboardUpload',
        'customButtonIcons',
        'customButtonIcons',
        'customStylesDefaultAddAfter',
        'customstylesdefaultaddafter',
        'direction',
        'dragUpload',
        'enterKey',
        'fileAttachment',
        'fileData',
        'fileUpload',
        'fileUploadParam',
        'focus',
        'focusEnd',
        'grammarly',
        'imageCaption',
        'imageData',
        'imageEditable',
        'imageFigure',
        'imageFloatMargin',
        'imageLink',
        'imageObserve',
        'imagePosition',
        'imageResizable',
        'imageUpload',
        'imageUploadParam',
        'linkSize',
        'linkValidation',
        'markup',
        'maxHeight',
        'maxWidth',
        'minHeight',
        'multipleUpload',
        'notranslate',
        'pasteBlockTags',
        'pasteClean',
        'pasteImages',
        'pasteInlineTags',
        'pasteKeepAttrs',
        'pasteKeepClass',
        'pasteKeepStyle',
        'pasteLinkTarget',
        'pasteLinks',
        'pastePlainText',
        'removeComments',
        'removeNewLines',
        'removeScript',
        'replaceTags',
        'scrollTarget',
        'shortcodes',
        'shortcuts',
        'shortcutsAdd',
        'showSource',
        'spellcheck',
        'structure',
        'styles',
        'stylesClass',
        'tabAsSpaces',
        'tabKey',
        'tabindex',
        'toolbar',
        'toolbarContext',
        'toolbarExternal',
        'toolbarFixed',
        'toolbarFixedTarget',
        'toolbarFixedTopOffset',
        'uploadData',
    ];

    private array $ignoredRedactorPlugins = [
        'customstyles',
        'linkclass',
    ];

    /**
     * Converts Redactor fields to CKEditor.
     */
    public function handle(ProjectConfig $projectConfig): int
    {
        if (! $this->input->isInteractive()) {
            $this->components->error('This command must be run interactively.');

            return self::FAILURE;
        }

        $this->projectConfig = $projectConfig;

        // Find Redactor fields
        $fields = null;
        $this->components->task('Looking for Redactor fields in the project config', function () use (&$fields) {
            $fields = $this->findFields('craft\\redactor\\Field');
        });

        if (empty($fields)) {
            $this->stdout("   No Redactor fields found.\n", 'yellow');

            return self::SUCCESS;
        }

        $this->stdout(PHP_EOL);
        $this->outputFields($fields, 'Redactor');
        $this->stdout(PHP_EOL);

        // Map the Redactor configs to CKEditor configs
        /** @var array<string,array> $redactorConfigs */
        $redactorConfigs = [];
        $convertedFields = [];

        foreach ($fields as $path => $field) {
            $this->stdout(' → ', 'gray');
            $this->stdout($this->markdownToAnsi(sprintf('Converting %s', $this->pathAndHandleMarkdown($path, $field))));
            $this->stdout(' …', 'gray');

            if (in_array($field['type'], [MissingField::class, self::LEGACY_MISSING_FIELD], true)) {
                $field['settings'] = $field['settings']['settings'] ?? [];
            }

            $field['settings'] = ProjectConfigHelper::unpackAssociativeArray($field['settings']);

            try {
                if (($field['settings']['configSelectionMode'] ?? null) === 'manual') {
                    try {
                        $redactorConfig = Json::decode($field['settings']['manualConfig'] ?? '') ?? [];
                    } catch (InvalidArgumentException) {
                        throw new RuntimeException('`manualConfig` contains invalid JSON.');
                    }
                } else {
                    $basename = ($field['settings']['redactorConfig'] ?? $field['settings']['configFile'] ?? null) ?: 'Default.json';
                    $redactorConfig = $redactorConfigs[$basename] ??= $this->resolveRedactorConfig($basename);
                }

                $field['type'] = Field::class;
                $this->updateFieldSettings($field['settings'], $redactorConfig);

                // if the converted field's path is just fields.<uid> - set PC
                if (str_starts_with($path, 'fields.')) {
                    $this->projectConfig->set($path, $field);
                    $this->stdout(" ✓ Field converted\n", 'green');
                } else {
                    // otherwise we need to do more processing
                    $convertedFields[$path] = $field;
                    $this->stdout(" ~ Nested field will be converted later on\n", 'yellow');
                }
            } catch (OperationAbortedException) {
                $this->stdout(" ✕ Field skipped\n", 'yellow');

                continue;
            }
        }

        $groupedFields = [];
        // group converted fields by path that precedes fields.<uid>
        foreach ($convertedFields as $path => $field) {
            $prePath = rtrim(substr($path, 0, strrpos($path, '.')), '.fields.');
            $fieldUid = substr($path, strrpos($path, '.') + 1);
            if (! isset($groupedFields[$prePath])) {
                $groupedFields[$prePath] = [];
            }
            $groupedFields[$prePath]['fields'][$fieldUid] = $field;
            $groupedFields[$prePath]['originalPath'] = $path;
        }

        // for each group
        foreach ($groupedFields as $path => $values) {
            // if there's only one nested field - save in the same way as a global field
            if (count($values['fields']) == 1) {
                $field = reset($values['fields']);
                if ($field) {
                    $this->projectConfig->set($values['originalPath'], $field);
                    $this->stdout(PHP_EOL);
                    $this->stdout(' → ', 'gray');
                    $this->stdout($this->markdownToAnsi(sprintf('Converting %s', $this->pathAndHandleMarkdown($values['originalPath'], $field))));
                    $this->stdout(' …', 'gray');
                    $this->stdout(' ✓ Field converted', 'green');
                }
            } else {
                // get the pc based on the preceding path (block), update it with the fields we have and that block should be set in PC
                $blockConfig = $this->projectConfig->get($path);
                if ($blockConfig) {
                    foreach ($values['fields'] as $fieldUid => $field) {
                        $blockConfig['fields'][$fieldUid] = $field;
                    }

                    $this->projectConfig->set($path, $blockConfig);
                    $this->stdout(PHP_EOL);
                    $this->stdout(' → ', 'gray');
                    $this->stdout($this->markdownToAnsi(sprintf('Converting fields inside %s', $this->pathAndHandleMarkdown($path, $blockConfig))));
                    $this->stdout(' …', 'gray');
                    $this->stdout(' ✓ Nested fields converted', 'green');
                }
            }
        }

        $this->stdout("\n\n ✓ Finished converting Redactor fields.\n", 'green', 'bold');
        $this->stdout("\nCommit your project config changes, 
and run `php artisan craft:migrate:all` on other environments
for the changes to take effect.\n", 'green');

        return self::SUCCESS;
    }

    private function findFields(string $type): array
    {
        return $this->projectConfig->find(fn (array $config) => (
            (($config['type'] ?? null) === $type) ||
            (
                in_array($config['type'] ?? null, [MissingField::class, self::LEGACY_MISSING_FIELD], true) &&
                ($config['settings']['expectedType'] ?? null) === $type
            )
        ));
    }

    private function outputFields(array $fields, string $typeName): void
    {
        $this->stdout('   ');
        $totalRedactorFields = count($fields);
        $this->stdout($this->markdownToAnsi(sprintf(
            '**%s**',
            $totalRedactorFields === 1
                ? "One $typeName field found:"
                : "$totalRedactorFields $typeName fields found:"
        )));
        $this->stdout(PHP_EOL);
        foreach ($fields as $path => $field) {
            $this->stdout(sprintf(" - %s\n", $this->markdownToAnsi($this->pathAndHandleMarkdown($path, $field))));
        }
    }

    private function pathAndHandleMarkdown(string $path, array $config): string
    {
        $handle = ! empty($config['handle']) ? " (`{$config['handle']}`)" : '';

        return "`$path`$handle";
    }

    private function resolveRedactorConfig(string $basename): array
    {
        // Craft 6 keeps Craft config files in config/craft/, but the Redactor configs may not have been moved there
        foreach (["craft/redactor/$basename", "redactor/$basename"] as $path) {
            $redactorConfigPath = config_path($path);
            if (is_file($redactorConfigPath)) {
                return Json::decodeFromFile($redactorConfigPath) ?? [];
            }
        }

        return [];
    }

    private function updateFieldSettings(array &$settings, array $redactorConfig): void
    {
        // Merge in the default Redactor config settings
        $fullRedactorConfig = array_merge($this->defaultRedactorConfig, $redactorConfig);

        // Track things we don’t know what to do with
        $unsupportedItems = [];

        // Build the CKE toolbar
        // ---------------------------------------------------------------------

        $redactorToolbar = new ToolbarBuilder($fullRedactorConfig['buttons'] ?: []);
        $lastFormattingButton = 'heading';

        // `formatting` => `format`
        $formattingPos = $redactorToolbar->getButtonPos('formatting');
        if ($formattingPos !== false) {
            $redactorToolbar->replaceButtonAt($formattingPos, 'format');
        }

        // apply `buttonsHide` to `buttons`
        if (! empty($fullRedactorConfig['buttonsHide'])) {
            foreach ($fullRedactorConfig['buttonsHide'] as $button) {
                $redactorToolbar->removeButton($button);
            }
        }

        // apply `buttonsAddFirst` and `buttonsAdd` to `buttons`
        $redactorToolbar->buttons = array_values(array_unique(array_merge(
            $fullRedactorConfig['buttonsAddFirst'] ?: [],
            $redactorToolbar->buttons,
            $fullRedactorConfig['buttonsAdd'] ?: [],
        )));

        // apply `buttonsAddAfter` to `buttons`
        if (
            ! empty($fullRedactorConfig['buttonsAddAfter']['after']) &&
            ! empty($fullRedactorConfig['buttonsAddAfter']['buttons'])
        ) {
            $pos = $redactorToolbar->getButtonPos($fullRedactorConfig['buttonsAddAfter']['after']);
            if ($pos !== false) {
                array_splice($redactorToolbar->buttons, $pos + 1, 0, $fullRedactorConfig['buttonsAddAfter']['buttons']);
            } else {
                array_push($redactorToolbar->buttons, ...$fullRedactorConfig['buttonsAddAfter']['buttons']);
            }
        }

        // apply `buttonsAddBefore` to `buttons`
        if (
            ! empty($fullRedactorConfig['buttonsAddBefore']['after']) &&
            ! empty($fullRedactorConfig['buttonsAddBefore']['buttons'])
        ) {
            $pos = $redactorToolbar->getButtonPos($fullRedactorConfig['buttonsAddBefore']['after']);
            if ($pos !== false) {
                array_splice($redactorToolbar->buttons, $pos, 0, $fullRedactorConfig['buttonsAddBefore']['buttons']);
            } else {
                // (intentionally not using array_unshift() here!)
                array_push($redactorToolbar->buttons, ...$fullRedactorConfig['buttonsAddBefore']['buttons']);
            }
        }

        // add plugin-supplied buttons
        if (! empty($fullRedactorConfig['plugins'])) {
            foreach ($fullRedactorConfig['plugins'] as $plugin) {
                if (in_array($plugin, $this->ignoredRedactorPlugins, true)) {
                    continue;
                }

                switch ($plugin) {
                    case 'alignment': $redactorToolbar->addButton('alignment');
                        break;
                    case 'clips': $redactorToolbar->addButton('clips');
                        break;
                    case 'counter': $settings['showWordCount'] = true;
                        break;
                    case 'fontcolor': $redactorToolbar->addButton('fontcolor');
                        break;
                    case 'fontfamily': $redactorToolbar->addButton('fontfamily');
                        break;
                    case 'fontsize': $redactorToolbar->addButton('fontsize');
                        break;
                    case 'fullscreen': $redactorToolbar->addButton('fullscreen');
                        break;
                    case 'inlinestyle': $redactorToolbar->addButtonAfter('inline', 'format');
                        break;
                    case 'pagebreak': $redactorToolbar->addButton('pagebreak');
                        break;
                    case 'properties': $redactorToolbar->addButton('properties');
                        break;
                    case 'specialchars': $redactorToolbar->addButton('specialchars');
                        break;
                    case 'table': $redactorToolbar->addButtonBefore('table', 'link');
                        break;
                    case 'textdirection': $redactorToolbar->addButton('textdirection');
                        break;
                    case 'variable': $redactorToolbar->addButton('variable');
                        break;
                    case 'video': $redactorToolbar->addButtonAfter('video', 'image');
                        break;
                    case 'widget': $redactorToolbar->addButton('widget');
                        break;
                    default: $unsupportedItems['plugins'][] = $plugin;
                }
            }
        }

        if (empty($redactorToolbar->buttons)) {
            // can't have an empty toolbar
            $redactorToolbar->addButton('format');
            $fullRedactorConfig['formatting'] = ['p'];
            $fullRedactorConfig['formattingAdd'] = false;
            $fullRedactorConfig['formattingHide'] = false;
        }

        $ckeToolbar = new ToolbarBuilder([]);

        foreach ($redactorToolbar->buttons as $button) {
            switch ($button) {
                case 'alignment':
                case 'bold':
                case 'fullscreen':
                case 'italic':
                case 'link':
                case 'underline':
                    $ckeToolbar->addButton($button);
                    break;
                case 'codebutton':
                    $ckeToolbar->addButton('code');
                    break;
                case 'file':
                    // this was just a shortcut for "Link → Link to an asset"
                    $ckeToolbar->addButton('link');
                    break;
                case 'format':
                    $ckeToolbar->addButton('heading');
                    break;
                case 'deleted':
                    $ckeToolbar->addButton('strikethrough');
                    break;
                case 'sub':
                    $ckeToolbar->addButton('subscript');
                    break;
                case 'sup':
                    $ckeToolbar->addButton('superscript');
                    break;
                case 'table':
                    $ckeToolbar->addButton('insertTable');
                    break;
                case 'html':
                    $ckeToolbar->addButton('sourceEditing');
                    break;
                case 'image':
                    $ckeToolbar->addButton('insertImage');
                    break;
                case 'indent':
                    // force [outdent, indent] order
                    $ckeToolbar->addButtonAfter('indent', 'outdent');
                    break;
                case 'line':
                    $ckeToolbar->addButton('horizontalLine');
                    break;
                case 'lists':
                    $ckeToolbar->addButton('bulletedList');
                    $ckeToolbar->addButton('numberedList');
                    // no break
                case 'orderedlist':
                    $ckeToolbar->addButton('numberedList');
                    break;
                case 'outdent':
                    // force [outdent, indent] order
                    $ckeToolbar->addButtonBefore('outdent', 'indent');
                    break;
                case 'pagebreak':
                    $ckeToolbar->addButton('pageBreak');
                    break;
                case 'redo':
                    // force [undo, redo] order
                    $ckeToolbar->addButtonAfter('redo', 'undo');
                    break;
                case 'undo':
                    // force [undo, redo] order
                    $ckeToolbar->addButtonBefore('undo', 'redo');
                    break;
                case 'unorderedlist':
                    $ckeToolbar->addButton('bulletedList');
                    break;
                case 'video':
                    $ckeToolbar->addButton('mediaEmbed');
                    break;
                default:
                    $unsupportedItems['buttons'][] = $button;
            }
        }

        // Headings and styles
        // ---------------------------------------------------------------------

        // Only deal with formatting options if the Redactor field had a `format` button
        if ($ckeToolbar->hasButton('heading')) {
            // Register custom formats as styles
            if (! empty($fullRedactorConfig['formattingAdd'])) {
                foreach ($fullRedactorConfig['formattingAdd'] as $key => $customFormat) {
                    if (($customFormat['args']['type'] ?? null) === 'remove') {
                        continue;
                    }
                    if (
                        ! empty($customFormat['title']) &&
                        in_array($customFormat['api'] ?? null, ['module.block.format', 'module.inline.format', null]) &&
                        ! empty($customFormat['args']['tag']) &&
                        ! empty($customFormat['args']['class']) &&
                        empty($customFormat['args']['attr']) &&
                        empty($customFormat['args']['style'])
                    ) {
                        $settings['options']['style']['definitions'][] = [
                            'name' => $customFormat['title'],
                            'element' => $customFormat['args']['tag'],
                            'classes' => self::split($customFormat['args']['class'], ' '),
                        ];

                        continue;
                    }

                    if (
                        in_array($customFormat['api'] ?? null, ['module.block.format', 'module.inline.format', null]) &&
                        is_array($customFormat['args'] ?? null) &&
                        ! empty($customFormat['args']['tag']) &&
                        empty($customFormat['args']['class']) &&
                        empty($customFormat['args']['attr']) &&
                        empty($customFormat['args']['style'])
                    ) {
                        // Do we have a button for toggling this tag?
                        $button = $this->ckeButtonForTag($customFormat['args']['tag']);
                        if ($button) {
                            $ckeToolbar->addButtonAfter($button, $lastFormattingButton);
                            $lastFormattingButton = $button;

                            continue;
                        }
                    }

                    $unsupportedItems['formattingAdd'][$key] = Json::encode($customFormat);
                }
            }

            // apply `formattingHide` to `formatting`
            $formats = $fullRedactorConfig['formatting'] ?: [];
            if (! empty($fullRedactorConfig['formattingHide'])) {
                foreach ($fullRedactorConfig['formattingHide'] as $format) {
                    $pos = array_search($format, $formats);
                    if ($pos !== false) {
                        array_splice($formats, $pos, 1);
                    }
                }
                $formats = array_values($formats);
            }

            // Divide the formats into things supported by `heading` and everything else
            $settings['headingLevels'] = [];

            foreach ($formats as $format) {
                if (in_array($format, ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'], true)) {
                    $settings['headingLevels'][] = (int) $format[1];
                } elseif ($format !== 'p') {
                    switch ($format) {
                        case 'blockquote':
                            $ckeToolbar->addButtonAfter('blockQuote', $lastFormattingButton);
                            $lastFormattingButton = 'blockQuote';
                            break;
                        case 'pre':
                            $ckeToolbar->addButtonAfter('codeBlock', $lastFormattingButton);
                            $lastFormattingButton = 'codeBlock';
                            break;
                        default:
                            $unsupportedItems['formatting'][] = $format;
                    }
                }
            }
        }

        // if we added sourceEditing button, then to align with what Redactor allowed,
        // we need add this predefined htmlSupport.allow config
        if ($ckeToolbar->hasButton('sourceEditing')) {
            $htmlSupport = [
                'attributes' => true,
                'classes' => true,
                'styles' => true,
            ];

            if ($settings['removeInlineStyles'] ?? false) {
                unset($htmlSupport['styles']);
            }

            $settings['options']['htmlSupport']['allow'][] = $htmlSupport;
        }

        // redactor-link-styles
        if (! empty($fullRedactorConfig['linkClasses'])) {
            foreach ($fullRedactorConfig['linkClasses'] as $linkClass) {
                if (empty($linkClass['label']) || empty($linkClass['class'])) {
                    $unsupportedItems['linkClasses'][] = Json::encode($linkClass);

                    continue;
                }
                $settings['options']['style']['definitions'][] = [
                    'name' => $linkClass['label'],
                    'element' => 'a',
                    'classes' => self::split($linkClass['class'], ' '),
                ];
            }
        }

        // redactor-custom-styles
        $customStylesKey = isset($fullRedactorConfig['customStyles']) ? 'customStyles' : 'customstyles';
        if (! empty($fullRedactorConfig[$customStylesKey])) {
            foreach ($fullRedactorConfig[$customStylesKey] as $itemKey => $customStyleItem) {
                if (isset($customStyleItem['dropdown'])) {
                    $customStyles = $customStyleItem['dropdown'];
                    $addUnsupportedCustomStyle = function ($key, $value) use (&$unsupportedItems, $customStylesKey, $itemKey) {
                        $unsupportedItems[$customStylesKey][$itemKey]['dropdown'][$key] = $value;
                    };
                } else {
                    $customStyles = [$customStyleItem];
                    $addUnsupportedCustomStyle = function ($key, $value) use (&$unsupportedItems, $customStylesKey, $itemKey) {
                        $unsupportedItems[$customStylesKey][$itemKey] = $value;
                    };
                }
                foreach ($customStyles as $styleKey => $customStyle) {
                    if (in_array($customStyle['api'] ?? null, ['module.block.clearformat', 'module.inline.clearformat'])) {
                        // ignore
                        continue;
                    }

                    if (
                        in_array($customStyle['api'] ?? null, ['module.block.format', 'module.inline.format', null]) &&
                        is_array($customStyle['args'] ?? null) &&
                        ! empty($customStyle['args']['tag']) &&
                        ! empty($customStyle['args']['class']) &&
                        empty($customStyle['args']['attr']) &&
                        empty($customStyle['args']['style'])
                    ) {
                        $settings['options']['style']['definitions'][] = [
                            'name' => $customStyle['title'] ?? Str::camel2words($styleKey),
                            'element' => $customStyle['args']['tag'],
                            'classes' => self::split($customStyle['args']['class'], ' '),
                        ];

                        continue;
                    }

                    if (
                        in_array($customStyle['api'] ?? null, ['module.block.format', 'module.inline.format', null]) &&
                        (
                            is_string($customStyle['args'] ?? null) ||
                            (
                                is_array($customStyle['args'] ?? null) &&
                                ! empty($customStyle['args']['tag']) &&
                                empty($customStyle['args']['class']) &&
                                empty($customStyle['args']['attr']) &&
                                empty($customStyle['args']['style'])
                            )
                        )
                    ) {
                        // Do we have a button for toggling this tag?
                        $tag = is_string($customStyle['args']) ? $customStyle['args'] : $customStyle['args']['tag'];
                        if ($tag === 'p') {
                            // ignore
                            continue;
                        }
                        $button = $this->ckeButtonForTag($tag);

                        if ($button) {
                            $ckeToolbar->addButtonAfter($button, $lastFormattingButton);
                            $lastFormattingButton = $button;

                            continue;
                        }
                    }

                    $addUnsupportedCustomStyle($styleKey, Json::encode($customStyle));
                }
            }
        }

        if (! empty($settings['options']['style']['definitions'])) {
            $ckeToolbar->addButtonAfter('style', 'heading');
        }

        unset(
            $fullRedactorConfig['buttons'],
            $fullRedactorConfig['buttonsAdd'],
            $fullRedactorConfig['buttonsAddAfter'],
            $fullRedactorConfig['buttonsAddBefore'],
            $fullRedactorConfig['buttonsAddFirst'],
            $fullRedactorConfig['buttonsHide'],
            $fullRedactorConfig['customStyles'],
            $fullRedactorConfig['customstyles'],
            $fullRedactorConfig['formatting'],
            $fullRedactorConfig['formattingAdd'],
            $fullRedactorConfig['formattingHide'],
            $fullRedactorConfig['linkClasses'],
            $fullRedactorConfig['plugins'],
        );

        $headingPos = $ckeToolbar->getButtonPos('heading');
        if ($headingPos !== false) {
            $ckeToolbar->addButtonAt('|', $headingPos + 1);
            if ($headingPos !== 0) {
                // add one before too
                $ckeToolbar->addButtonAt('|', $headingPos);
            }
        }

        $stylePos = $ckeToolbar->getButtonPos('style');
        if ($stylePos !== false) {
            $ckeToolbar->addButtonAt('|', $stylePos + 1);
        }

        // Everything else
        // ---------------------------------------------------------------------

        foreach ($fullRedactorConfig as $key => $value) {
            if (in_array($key, $this->ignoredRedactorSettings)) {
                continue;
            }

            switch ($key) {
                case 'lang':
                    $settings['options']['language'] = [
                        'ui' => $value,
                        'content' => $value,
                    ];
                    break;
                case 'placeholder':
                    if ($value) {
                        $settings['options']['placeholder'] = $value;
                    }
                    break;
                case 'preSpaces':
                    // `false` = Tab in Redactor, and CKEditor defaults to Tab
                    if ($value) {
                        $settings['options']['code']['indentSequence'] = str_repeat(' ', $value);
                    }
                    break;
                case 'source':
                    if (! $value) {
                        $ckeToolbar->removeButton('sourceEditing');
                    }
                    break;

                    // Unsupported options
                case 'inline':
                case 'linkNofollow':
                case 'linkTarget':
                case 'linkTitle':
                case 'preClass':
                    if (! $value) {
                        // not a problem if it's falsy
                        break;
                    }
                    // no break
                default:
                    $unsupportedItems[$key] = match (true) {
                        (is_string($value) || is_numeric($value)) => $value,
                        is_scalar($value) => var_export($value, true),
                        // no break
                        default => Json::encode($value),
                    };
            }
        }

        // Wrap it up
        // ---------------------------------------------------------------------

        if (! empty($unsupportedItems)) {
            $this->stdout("\n\n      ⚠️  The following Redactor config items aren’t supported by CKEditor:\n");
            $this->outputList($unsupportedItems, '         ');
            if (! confirm("\n      Continue anyway?", true)) {
                throw new OperationAbortedException;
            }
            $this->stdout('   ');
        }

        $settings['toolbar'] = $ckeToolbar->buttons;
        $settings['enableSourceEditingForNonAdmins'] = (bool) ($settings['showHtmlButtonForNonAdmins'] ?? false);

        unset(
            $settings['cleanupHtml'],
            $settings['configFile'],
            $settings['configSelectionMode'],
            $settings['manualConfig'],
            $settings['redactorConfig'],
            $settings['removeEmptyTags'],
            $settings['removeInlineStyles'],
            $settings['removeNbsp'],
            $settings['showHtmlButtonForNonAdmins'],
            $settings['uiMode'],
        );
    }

    private function ckeButtonForTag(string $tag): ?string
    {
        return match ($tag) {
            'a' => 'link',
            'b', 'strong' => 'bold',
            'code' => 'code',
            'hr' => 'horizontalLine',
            'i', 'em' => 'italic',
            'pre' => 'codeBlock',
            'q', 'blockquote' => 'blockQuote',
            's', 'del', 'strike' => 'strikethrough',
            'sub' => 'subscript',
            'sup' => 'superscript',
            'u' => 'underline',
            default => null,
        };
    }

    private function outputList(array $items, string $indent = ''): void
    {
        foreach ($items as $key => $value) {
            $this->stdout("$indent - ");
            if (is_string($key)) {
                $this->stdout(sprintf('%s: ', $this->markdownToAnsi("`$key`")));
            }
            if (is_array($value)) {
                $this->stdout(PHP_EOL);
                $this->outputList($value, "$indent   ");
            } else {
                $this->stdout($this->markdownToAnsi("`$value`"));
                $this->stdout(PHP_EOL);
            }
        }
    }

    /**
     * Writes text to the console, with optional styles (colors or `bold`).
     */
    private function stdout(string $text, string ...$styles): void
    {
        $options = [];
        $fg = null;
        foreach ($styles as $style) {
            if ($style === 'bold') {
                $options[] = 'bold';
            } else {
                $fg = $style;
            }
        }

        if ($fg === null && empty($options)) {
            $this->output->write($text);

            return;
        }

        $format = implode(';', array_filter([
            $fg ? "fg=$fg" : null,
            $options ? 'options='.implode(',', $options) : null,
        ]));

        $this->output->write("<$format>$text</>");
    }

    /**
     * Converts basic Markdown (`**bold**` and `` `code` ``) to console formatting.
     */
    private function markdownToAnsi(string $markdown): string
    {
        $markdown = preg_replace('/\*\*(.+?)\*\*/', '<options=bold>$1</>', $markdown);

        return preg_replace('/`(.+?)`/', '<fg=cyan>$1</>', $markdown);
    }

    /**
     * Splits a string, trimming the values and removing empty ones.
     *
     * @return string[]
     */
    private static function split(string $str, string $delimiter = ' '): array
    {
        return array_values(array_filter(array_map('trim', explode($delimiter, $str)), fn (string $s) => $s !== ''));
    }
}
