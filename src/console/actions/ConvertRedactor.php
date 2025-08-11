<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\console\actions;

use Craft;
use craft\ckeditor\CkeConfig;
use craft\ckeditor\CkeConfigs;
use craft\ckeditor\console\controllers\ConvertController;
use craft\ckeditor\Field;
use craft\ckeditor\Plugin;
use craft\errors\OperationAbortedException;
use craft\fields\MissingField;
use craft\helpers\ArrayHelper;
use craft\helpers\Console;
use craft\helpers\Json;
use craft\helpers\ProjectConfig as ProjectConfigHelper;
use craft\helpers\StringHelper;
use craft\services\ProjectConfig;
use yii\base\Action;
use yii\base\Exception;
use yii\base\InvalidArgumentException;
use yii\console\ExitCode;
use yii\helpers\Inflector;

/**
 * Converts Redactor fields to CKEditor
 *
 * @property ConvertController $controller
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 4.2.0
 */
class ConvertRedactor extends Action
{
    private ProjectConfig $projectConfig;
    private CkeConfigs $ckeConfigs;

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
     * Converts Redactor fields to CKEditor
     *
     * @return int
     */
    public function run(): int
    {
        if (!$this->controller->interactive) {
            $this->controller->stderr("This command must be run interactively.\n");
            return ExitCode::UNSPECIFIED_ERROR;
        }

        $this->projectConfig = Craft::$app->getProjectConfig();

        // Find Redactor fields
        $fields = null;
        $this->controller->do('Looking for Redactor fields in the project config', function() use (&$fields) {
            $fields = $this->findFields($this->projectConfig->get(), 'craft\\redactor\\Field');
        });

        if (empty($fields)) {
            $this->controller->stdout("   No Redactor fields found.\n", Console::FG_YELLOW);
            return ExitCode::OK;
        }

        $this->controller->stdout(PHP_EOL);
        $this->outputFields($fields, 'Redactor');
        $this->controller->stdout(PHP_EOL);

        // Map the Redactor configs to CKEditor configs
        $this->ckeConfigs = Plugin::getInstance()->getCkeConfigs();
        $ckeConfigs = $this->ckeConfigs->getAll();
        $fieldSettingsByConfig = [];
        $configMap = [];
        $convertedFields = [];

        foreach ($fields as $path => $field) {
            $this->controller->stdout(' → ', Console::FG_GREY);
            $this->controller->stdout($this->controller->markdownToAnsi(sprintf('Converting %s', $this->pathAndHandleMarkdown($path, $field))));
            $this->controller->stdout(' …', Console::FG_GREY);

            if ($field['type'] === MissingField::class) {
                $field['settings'] = ProjectConfigHelper::unpackAssociativeArray($field['settings']['settings'] ?? []);
            }

            try {
                if (($field['settings']['configSelectionMode'] ?? null) === 'manual') {
                    $this->controller->stdout(PHP_EOL . PHP_EOL);
                    try {
                        $redactorConfig = Json::decode($field['settings']['manualConfig'] ?? '') ?? [];
                    } catch (InvalidArgumentException) {
                        throw new Exception('`manualConfig` contains invalid JSON.');
                    }
                    $configName = $field['name'] ?? (!empty($field['handle']) ? Inflector::camel2words($field['handle']) : 'Untitled');
                    $ckeConfig = $this->generateCkeConfig($configName, $redactorConfig, $ckeConfigs, $fieldSettingsByConfig, $field);
                    $this->controller->stdout(PHP_EOL);
                } else {
                    $basename = ($field['settings']['redactorConfig'] ?? $field['settings']['configFile'] ?? null) ?: 'Default.json';
                    if (!isset($configMap[$basename])) {
                        $this->controller->stdout(PHP_EOL . PHP_EOL);
                        $configMap[$basename] = $this->resolveRedactorConfig($basename, $ckeConfigs, $fieldSettingsByConfig);
                        $this->controller->stdout(PHP_EOL);
                    }
                    $ckeConfig = $configMap[$basename];
                }

                $field['type'] = Field::class;
                $field['settings']['ckeConfig'] = $ckeConfig;

                if (isset($fieldSettingsByConfig[$ckeConfig])) {
                    $field['settings'] = array_merge($field['settings'], $fieldSettingsByConfig[$ckeConfig]);
                }

                $field['settings']['enableSourceEditingForNonAdmins'] = (bool)($field['settings']['showHtmlButtonForNonAdmins'] ?? false);

                unset(
                    $field['settings']['cleanupHtml'],
                    $field['settings']['configFile'],
                    $field['settings']['configSelectionMode'],
                    $field['settings']['manualConfig'],
                    $field['settings']['redactorConfig'],
                    $field['settings']['removeEmptyTags'],
                    $field['settings']['removeInlineStyles'],
                    $field['settings']['removeNbsp'],
                    $field['settings']['showHtmlButtonForNonAdmins'],
                    $field['settings']['uiMode'],
                );

                // if the converted field's path is just fields.<uid> - set PC
                if (str_starts_with($path, 'fields.')) {
                    $this->projectConfig->set($path, $field);
                    $this->controller->stdout(" ✓ Field converted\n", Console::FG_GREEN);
                } else {
                    // otherwise we need to do more processing
                    $convertedFields[$path] = $field;
                    $this->controller->stdout(" ~ Nested field will be converted later on\n", Console::FG_YELLOW);
                }
            } catch (OperationAbortedException) {
                $this->controller->stdout(" ✕ Field skipped\n", Console::FG_YELLOW);
                continue;
            }
        }

        $groupedFields = [];
        // group converted fields by path that precedes fields.<uid>
        foreach ($convertedFields as $path => $field) {
            $prePath = rtrim(substr($path, 0, strrpos($path, '.')), '.fields.');
            $fieldUid = substr($path, strrpos($path, '.') + 1);
            if (!isset($groupedFields[$prePath])) {
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
                    $this->controller->stdout(PHP_EOL);
                    $this->controller->stdout(' → ', Console::FG_GREY);
                    $this->controller->stdout($this->controller->markdownToAnsi(sprintf('Converting %s', $this->pathAndHandleMarkdown($values['originalPath'], $field))));
                    $this->controller->stdout(' …', Console::FG_GREY);
                    $this->controller->stdout(" ✓ Field converted", Console::FG_GREEN);
                }
            } else {
                // get the pc based on the preceding path (block), update it with the fields we have and that block should be set in PC
                $blockConfig = $this->projectConfig->get($path);
                if ($blockConfig) {
                    foreach ($values['fields'] as $fieldUid => $field) {
                        $blockConfig['fields'][$fieldUid] = $field;
                    }

                    $this->projectConfig->set($path, $blockConfig);
                    $this->controller->stdout(PHP_EOL);
                    $this->controller->stdout(' → ', Console::FG_GREY);
                    $this->controller->stdout($this->controller->markdownToAnsi(sprintf('Converting fields inside %s', $this->pathAndHandleMarkdown($path, $blockConfig))));
                    $this->controller->stdout(' …', Console::FG_GREY);
                    $this->controller->stdout(" ✓ Nested fields converted", Console::FG_GREEN);
                }
            }
        }

        $this->controller->stdout("\n\n ✓ Finished converting Redactor fields.\n", Console::FG_GREEN, Console::BOLD);
        $this->controller->stdout("\nCommit your project config changes, 
and run `craft up` on other environments
for the changes to take effect.\n", Console::FG_GREEN);

        return ExitCode::OK;
    }

    private function findFields(array $config, string $type, string $path = ''): array
    {
        $configs = [];

        if (
            ($config['type'] ?? null) === $type ||
            (
                ($config['type'] ?? null) === MissingField::class &&
                ($config['settings']['expectedType'] ?? null) === $type
            )
        ) {
            // found one
            $configs[$path] = $config;
        } else {
            // keep looking
            foreach ($config as $key => $value) {
                if (is_array($value)) {
                    $configs = array_merge(
                        $configs,
                        $this->findFields($value, $type, ($path ? "$path." : '') . $key)
                    );
                }
            }
        }

        return $configs;
    }

    private function outputFields(array $fields, string $typeName): void
    {
        $this->controller->stdout('   ');
        $totalRedactorFields = count($fields);
        $this->controller->stdout($this->controller->markdownToAnsi(sprintf(
            '**%s**',
            $totalRedactorFields === 1
                ? "One $typeName field found:"
                : "$totalRedactorFields $typeName fields found:"
        )));
        $this->controller->stdout(PHP_EOL);
        foreach ($fields as $path => $field) {
            $this->controller->stdout(sprintf(" - %s\n", $this->controller->markdownToAnsi($this->pathAndHandleMarkdown($path, $field))));
        }
    }

    private function pathAndHandleMarkdown(string $path, array $config): string
    {
        $handle = !empty($config['handle']) ? " (`{$config['handle']}`)" : '';
        return "`$path`$handle";
    }

    /**
     * @param string $basename
     * @param CkeConfig[] $ckeConfigs
     * @param array[] $fieldSettingsByConfig
     * @return string
     * @throws \Exception
     */
    private function resolveRedactorConfig(
        string $basename,
        array &$ckeConfigs,
        array &$fieldSettingsByConfig,
    ): string {
        $filename = pathinfo($basename, PATHINFO_FILENAME);
        $this->controller->stdout('   ');
        if ($this->controller->confirm($this->controller->markdownToAnsi("Do you already have a CKEditor config that should be used in place of the `$filename` Redactor config?"))) {
            $choice = $this->controller->select('   Which CKEditor config?', array_map(fn(CkeConfig $ckeConfig) => $ckeConfig->name, $ckeConfigs));
            return $ckeConfigs[$choice]->uid;
        }

        $redactorConfigPath = sprintf('%s/redactor/%s', Craft::$app->getPath()->getConfigPath(), $basename);
        if (is_file($redactorConfigPath)) {
            $redactorConfig = Json::decodeFromFile($redactorConfigPath);
        } else {
            $redactorConfig = [];
        }

        return $this->generateCkeConfig(Inflector::camel2words($filename), $redactorConfig, $ckeConfigs, $fieldSettingsByConfig);
    }

    /**
     * @param string $configName
     * @param array $redactorConfig
     * @param CkeConfig[] $ckeConfigs
     * @param array[] $fieldSettingsByConfig
     * @return string
     * @throws OperationAbortedException
     */
    private function generateCkeConfig(
        string $configName,
        array $redactorConfig,
        array &$ckeConfigs,
        array &$fieldSettingsByConfig,
        ?array $redactorField = null,
    ): string {
        // Make sure the name is unique
        $baseConfigName = $configName;
        $attempt = 1;
        while (ArrayHelper::contains($ckeConfigs, fn(CkeConfig $ckeConfig) => $ckeConfig->name === $configName)) {
            $configName = sprintf('%s %s', $baseConfigName, ++$attempt);
        }

        $this->controller->stdout('    → ', Console::FG_GREY);
        $this->controller->stdout($this->controller->markdownToAnsi("Generating `$configName` CKEditor config"));
        $this->controller->stdout(' …', Console::FG_GREY);

        $ckeConfig = new CkeConfig([
            'uid' => StringHelper::UUID(),
            'name' => $configName,
            'toolbar' => [],
        ]);

        // Merge in the default Redactor config settings
        $fullRedactorConfig = array_merge($this->defaultRedactorConfig, $redactorConfig);

        // Track things we don’t know what to do with
        $unsupportedItems = [];

        // Buttons
        // ---------------------------------------------------------------------

        $buttons = $fullRedactorConfig['buttons'] ?: [];
        $lastFormattingButton = 'heading';

        // helpers
        $hasButton = fn(string $button): bool => in_array($button, $buttons, true);
        $getButtonPos = fn(string $button): int|false => array_search($button, $buttons);
        $addButton = function(string $button) use (&$buttons, $hasButton): void {
            if (!$hasButton($button)) {
                $buttons[] = $button;
            }
        };
        $addButtonAt = function(string $button, int $pos) use (&$buttons, $hasButton): void {
            if (!$hasButton($button)) {
                array_splice($buttons, $pos, 0, [$button]);
            }
        };
        $addButtonBefore = function(string $button, string $before) use (
            $getButtonPos,
            $addButtonAt,
            $addButton,
        ): void {
            $beforePos = $getButtonPos($before);
            if ($beforePos !== false) {
                $addButtonAt($button, $beforePos);
            } else {
                $addButton($button);
            }
        };
        $addButtonAfter = function(string $button, string $after) use (
            $getButtonPos,
            $addButtonAt,
            $addButton,
        ): void {
            $afterPos = $getButtonPos($after);
            if ($afterPos !== false) {
                $addButtonAt($button, $afterPos + 1);
            } else {
                $addButton($button);
            }
        };

        // `formatting` => `format`
        $formattingPos = $getButtonPos('formatting');
        if ($formattingPos !== false) {
            array_splice($buttons, $formattingPos, 1, ['format']);
        }

        // apply `buttonsHide` to `buttons`
        if (!empty($fullRedactorConfig['buttonsHide'])) {
            foreach ($fullRedactorConfig['buttonsHide'] as $button) {
                $pos = array_search($button, $buttons);
                if ($pos !== false) {
                    array_splice($buttons, $pos, 1);
                }
            }
            $buttons = array_values($buttons);
        }

        // apply `buttonsAddFirst` and `buttonsAdd` to `buttons`
        $buttons = array_unique(array_merge(
            $fullRedactorConfig['buttonsAddFirst'] ?: [],
            $buttons ?: [],
            $fullRedactorConfig['buttonsAdd'] ?: [],
        ));

        // apply `buttonsAddAfter` to `buttons`
        if (
            !empty($fullRedactorConfig['buttonsAddAfter']['after']) &&
            !empty($fullRedactorConfig['buttonsAddAfter']['buttons'])
        ) {
            $pos = array_search($fullRedactorConfig['buttonsAddAfter']['after'], $buttons);
            if ($pos !== false) {
                array_splice($buttons, $pos + 1, 0, $fullRedactorConfig['buttonsAddAfter']['buttons']);
            } else {
                array_push($buttons, ...$fullRedactorConfig['buttonsAddAfter']['buttons']);
            }
        }

        // apply `buttonsAddBefore` to `buttons`
        if (
            !empty($fullRedactorConfig['buttonsAddBefore']['after']) &&
            !empty($fullRedactorConfig['buttonsAddBefore']['buttons'])
        ) {
            $pos = array_search($fullRedactorConfig['buttonsAddBefore']['after'], $buttons);
            if ($pos !== false) {
                array_splice($buttons, $pos, 0, $fullRedactorConfig['buttonsAddBefore']['buttons']);
            } else {
                // (intentionally not using array_unshift() here!)
                array_push($buttons, ...$fullRedactorConfig['buttonsAddBefore']['buttons']);
            }
        }

        // add plugin-supplied buttons
        if (!empty($fullRedactorConfig['plugins'])) {
            foreach ($fullRedactorConfig['plugins'] as $plugin) {
                if (in_array($plugin, $this->ignoredRedactorPlugins, true)) {
                    continue;
                }

                switch ($plugin) {
                    case 'alignment': $addButton('alignment'); break;
                    case 'clips': $addButton('clips'); break;
                    case 'counter':
                        $fieldSettingsByConfig[$ckeConfig->uid]['showWordCount'] = true;
                        break;
                    case 'fontcolor': $addButton('fontcolor'); break;
                    case 'fontfamily': $addButton('fontfamily'); break;
                    case 'fontsize': $addButton('fontsize'); break;
                    case 'fullscreen': $addButton('fullscreen'); break;
                    case 'inlinestyle': $addButtonAfter('inline', 'format'); break;
                    case 'pagebreak': $addButton('pagebreak'); break;
                    case 'properties': $addButton('properties'); break;
                    case 'specialchars': $addButton('specialchars'); break;
                    case 'table': $addButtonBefore('table', 'link'); break;
                    case 'textdirection': $addButton('textdirection'); break;
                    case 'variable': $addButton('variable'); break;
                    case 'video': $addButtonAfter('video', 'image'); break;
                    case 'widget': $addButton('widget'); break;
                    default: $unsupportedItems['plugins'][] = $plugin;
                }
            }
        }

        if (empty($buttons)) {
            // can't have an empty toolbar
            $buttons[] = 'format';
            $fullRedactorConfig['formatting'] = ['p'];
            $fullRedactorConfig['formattingAdd'] = false;
            $fullRedactorConfig['formattingHide'] = false;
        }

        foreach ($buttons as $button) {
            switch ($button) {
                case 'alignment':
                case 'bold':
                case 'italic':
                case 'underline':
                case 'link':
                    $ckeConfig->addButton($button);
                    break;
                case 'codebutton':
                    $ckeConfig->addButton('code');
                    break;
                case 'file':
                    // this was just a shortcut for "Link → Link to an asset"
                    $ckeConfig->addButton('link');
                    break;
                case 'format':
                    $ckeConfig->addButton('heading');
                    break;
                case 'deleted':
                    $ckeConfig->addButton('strikethrough');
                    break;
                case 'sub':
                    $ckeConfig->addButton('subscript');
                    break;
                case 'sup':
                    $ckeConfig->addButton('superscript');
                    break;
                case 'table':
                    $ckeConfig->addButton('insertTable');
                    break;
                case 'html':
                    $ckeConfig->addButton('sourceEditing');
                    break;
                case 'image':
                    $ckeConfig->addButton('insertImage');
                    break;
                case 'indent':
                    // force [outdent, indent] order
                    $ckeConfig->addButtonAfter('indent', 'outdent');
                    break;
                case 'line':
                    $ckeConfig->addButton('horizontalLine');
                    break;
                case 'lists':
                    $ckeConfig->addButton('bulletedList');
                    $ckeConfig->addButton('numberedList');
                // no break
                case 'orderedlist':
                    $ckeConfig->addButton('numberedList');
                    break;
                case 'outdent':
                    // force [outdent, indent] order
                    $ckeConfig->addButtonBefore('outdent', 'indent');
                    break;
                case 'pagebreak':
                    $ckeConfig->addButton('pageBreak');
                    break;
                case 'redo':
                    // force [undo, redo] order
                    $ckeConfig->addButtonAfter('redo', 'undo');
                    break;
                case 'undo':
                    // force [undo, redo] order
                    $ckeConfig->addButtonBefore('undo', 'redo');
                    break;
                case 'unorderedlist':
                    $ckeConfig->addButton('bulletedList');
                    break;
                case 'video':
                    $ckeConfig->addButton('mediaEmbed');
                    break;
                case 'fullscreen':
                    // ignore
                    break;

                default:
                    $unsupportedItems['buttons'][] = $button;
            }
        }

        // Headings and styles
        // ---------------------------------------------------------------------

        // Only deal with formatting options if the Redactor field had a `format` button
        if ($ckeConfig->hasButton('heading')) {
            // Register custom formats as styles
            if (!empty($fullRedactorConfig['formattingAdd'])) {
                foreach ($fullRedactorConfig['formattingAdd'] as $key => $customFormat) {
                    if (($customFormat['args']['type'] ?? null) === 'remove') {
                        continue;
                    }
                    if (
                        !empty($customFormat['title']) &&
                        in_array($customFormat['api'] ?? null, ['module.block.format', 'module.inline.format', null]) &&
                        !empty($customFormat['args']['tag']) &&
                        !empty($customFormat['args']['class']) &&
                        empty($customFormat['args']['attr']) &&
                        empty($customFormat['args']['style'])
                    ) {
                        $ckeConfig->options['style']['definitions'][] = [
                            'name' => $customFormat['title'],
                            'element' => $customFormat['args']['tag'],
                            'classes' => StringHelper::split($customFormat['args']['class'], ' '),
                        ];
                        continue;
                    }

                    if (
                        in_array($customFormat['api'] ?? null, ['module.block.format', 'module.inline.format', null]) &&
                        is_array($customFormat['args'] ?? null) &&
                        !empty($customFormat['args']['tag']) &&
                        empty($customFormat['args']['class']) &&
                        empty($customFormat['args']['attr']) &&
                        empty($customFormat['args']['style'])
                    ) {
                        // Do we have a button for toggling this tag?
                        $button = $this->ckeButtonForTag($customFormat['args']['tag']);
                        if ($button) {
                            $ckeConfig->addButtonAfter($button, $lastFormattingButton);
                            $lastFormattingButton = $button;
                            continue;
                        }
                    }

                    $unsupportedItems['formattingAdd'][$key] = Json::encode($customFormat);
                }
            }

            // apply `formattingHide` to `formatting`
            $formats = $fullRedactorConfig['formatting'] ?: [];
            if (!empty($fullRedactorConfig['formattingHide'])) {
                foreach ($fullRedactorConfig['formattingHide'] as $format) {
                    $pos = array_search($format, $formats);
                    if ($pos !== false) {
                        array_splice($formats, $pos, 1);
                    }
                }
                $formats = array_values($formats);
            }

            // Divide the formats into things supported by `heading` and everything else
            $ckeConfig->headingLevels = [];

            foreach ($formats as $format) {
                if (in_array($format, ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'], true)) {
                    $ckeConfig->headingLevels[] = (int)$format[1];
                } elseif ($format !== 'p') {
                    switch ($format) {
                        case 'blockquote':
                            $ckeConfig->addButtonAfter('blockQuote', $lastFormattingButton);
                            $lastFormattingButton = 'blockQuote';
                            break;
                        case 'pre':
                            $ckeConfig->addButtonAfter('codeBlock', $lastFormattingButton);
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
        if ($ckeConfig->hasButton('sourceEditing')) {
            $htmlSupport = [
                'attributes' => true,
                'classes' => true,
                'styles' => true,
            ];

            if ($redactorField !== null && $redactorField['settings']['removeInlineStyles']) {
                unset($htmlSupport['styles']);
            }

            $ckeConfig->options['htmlSupport']['allow'][] = $htmlSupport;
        }

        // redactor-link-styles
        if (!empty($fullRedactorConfig['linkClasses'])) {
            foreach ($fullRedactorConfig['linkClasses'] as $linkClass) {
                if (empty($linkClass['label']) || empty($linkClass['class'])) {
                    $unsupportedItems['linkClasses'][] = Json::encode($linkClass);
                    continue;
                }
                $ckeConfig->options['style']['definitions'][] = [
                    'name' => $linkClass['label'],
                    'element' => 'a',
                    'classes' => StringHelper::split($linkClass['class'], ' '),
                ];
            }
        }

        // redactor-custom-styles
        $customStylesKey = isset($fullRedactorConfig['customStyles']) ? 'customStyles' : 'customstyles';
        if (!empty($fullRedactorConfig[$customStylesKey])) {
            foreach ($fullRedactorConfig[$customStylesKey] as $itemKey => $customStyleItem) {
                if (isset($customStyleItem['dropdown'])) {
                    $customStyles = $customStyleItem['dropdown'];
                    $addUnsupportedCustomStyle = function($key, $value) use (&$unsupportedItems, $customStylesKey, $itemKey) {
                        $unsupportedItems[$customStylesKey][$itemKey]['dropdown'][$key] = $value;
                    };
                } else {
                    $customStyles = [$customStyleItem];
                    $addUnsupportedCustomStyle = function($key, $value) use (&$unsupportedItems, $customStylesKey, $itemKey) {
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
                        !empty($customStyle['args']['tag']) &&
                        !empty($customStyle['args']['class']) &&
                        empty($customStyle['args']['attr']) &&
                        empty($customStyle['args']['style'])
                    ) {
                        $ckeConfig->options['style']['definitions'][] = [
                            'name' => $customStyle['title'] ?? Inflector::camel2words($styleKey),
                            'element' => $customStyle['args']['tag'],
                            'classes' => StringHelper::split($customStyle['args']['class'], ' '),
                        ];
                        continue;
                    }

                    if (
                        in_array($customStyle['api'] ?? null, ['module.block.format', 'module.inline.format', null]) &&
                        (
                            is_string($customStyle['args'] ?? null) ||
                            (
                                is_array($customStyle['args'] ?? null) &&
                                !empty($customStyle['args']['tag']) &&
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
                            $ckeConfig->addButtonAfter($button, $lastFormattingButton);
                            $lastFormattingButton = $button;
                            continue;
                        }
                    }

                    $addUnsupportedCustomStyle($styleKey, Json::encode($customStyle));
                }
            }
        }

        if (!empty($ckeConfig->options['style']['definitions'])) {
            $ckeConfig->addButtonAfter('style', 'heading');
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

        $headingPos = $ckeConfig->getButtonPos('heading');
        if ($headingPos !== false) {
            $ckeConfig->addButtonAt('|', $headingPos + 1);
            if ($headingPos !== 0) {
                // add one before too
                $ckeConfig->addButtonAt('|', $headingPos);
            }
        }

        $stylePos = $ckeConfig->getButtonPos('style');
        if ($stylePos !== false) {
            $ckeConfig->addButtonAt('|', $stylePos + 1);
        }

        // Everything else
        // ---------------------------------------------------------------------

        foreach ($fullRedactorConfig as $key => $value) {
            if (in_array($key, $this->ignoredRedactorSettings)) {
                continue;
            }

            switch ($key) {
                case 'lang':
                    $ckeConfig->options['language'] = [
                        'ui' => $value,
                        'content' => $value,
                    ];
                    break;
                case 'placeholder':
                    if ($value) {
                        $ckeConfig->options['placeholder'] = $value;
                    }
                    break;
                case 'preSpaces':
                    // `false` = Tab in Redactor, and CKEditor defaults to Tab
                    if ($value) {
                        $ckeConfig->options['code']['indentSequence'] = str_repeat(' ', $value);
                    }
                    break;
                case 'source':
                    if (!$value) {
                        $ckeConfig->removeButton('sourceEditing');
                    }
                    break;

                // Unsupported options
                case 'inline':
                case 'linkNofollow':
                case 'linkTarget':
                case 'linkTitle':
                case 'preClass':
                    if (!$value) {
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

        if (!empty($unsupportedItems)) {
            $this->controller->stdout("\n\n      ⚠️  The following Redactor config items aren’t supported by CKEditor:\n");
            $this->outputList($unsupportedItems, '         ');
            if (!$this->controller->confirm("\n      Continue anyway?", true)) {
                throw new OperationAbortedException();
            }
            $this->controller->stdout('   ');
        }

        if (!$this->ckeConfigs->save($ckeConfig)) {
            throw new Exception(sprintf('Unable to save the CKEditor config: %s', implode(', ', $ckeConfig->getFirstErrors())));
        }

        $this->controller->stdout(" ✓ Config generated\n", Console::FG_GREEN);

        $ckeConfigs[] = $ckeConfig;
        return $ckeConfig->uid;
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
            $this->controller->stdout("$indent - ");
            if (is_string($key)) {
                $this->controller->stdout(sprintf('%s: ', $this->controller->markdownToAnsi("`$key`")));
            }
            if (is_array($value)) {
                $this->controller->stdout(PHP_EOL);
                $this->outputList($value, "$indent   ");
            } else {
                $this->controller->stdout($this->controller->markdownToAnsi("`$value`"));
                $this->controller->stdout(PHP_EOL);
            }
        }
    }
}
