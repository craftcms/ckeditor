<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\console\controllers;

use Craft;
use craft\ckeditor\CkeConfig;
use craft\ckeditor\CkeConfigs;
use craft\ckeditor\Field;
use craft\ckeditor\Plugin;
use craft\console\Controller;
use craft\db\Query;
use craft\db\Table;
use craft\elements\Entry;
use craft\errors\OperationAbortedException;
use craft\fields\Matrix;
use craft\fields\MissingField;
use craft\fields\PlainText;
use craft\helpers\ArrayHelper;
use craft\helpers\Console;
use craft\helpers\Json;
use craft\helpers\ProjectConfig as ProjectConfigHelper;
use craft\helpers\StringHelper;
use craft\models\EntryType;
use craft\models\FieldLayout;
use craft\models\ImageTransform;
use craft\models\Volume;
use craft\services\ProjectConfig;
use yii\base\Exception;
use yii\base\InvalidArgumentException;
use yii\console\ExitCode;
use yii\helpers\Inflector;

/**
 * Converts existing fields to CKEditor
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 3.1.0
 */
class ConvertController extends Controller
{
    public $defaultAction = 'redactor';

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

    public function actionMatrix(string $fieldHandle): int
    {
        $field = Craft::$app->getFields()->getFieldByHandle($fieldHandle);

        if (!$field) {
            $this->stdout("No Matrix field with original handle `$fieldHandle` found.", Console::FG_YELLOW);
            $this->stdout(PHP_EOL);
            return ExitCode::OK;
        }

        if (!$field instanceof Matrix) {
            $this->stdout("Field `$fieldHandle` is not a Matrix field.", Console::FG_YELLOW);
            $this->stdout(PHP_EOL);
            return ExitCode::OK;
        }

        // we have the matrix field, let's set up the basics for the CKE field
        [$chosenEntryType, $chosenField, $newEntryType] = $this->prepareMatrixFieldPort($field);

        $this->stdout(PHP_EOL);
        $this->stdout(PHP_EOL);

        $this->stdout("Configure your new CKEditor field", Console::FG_GREEN);
        $this->stdout(PHP_EOL);
        $settings = $this->ckeFieldSettings($chosenField);

        $this->stdout(PHP_EOL);
        $this->stdout(PHP_EOL);

        $this->stdout("Starting conversion", Console::FG_GREEN);
        // TODO: do the conversion

        $this->stdout(PHP_EOL);

        return ExitCode::OK;
    }

    private function prepareMatrixFieldPort(Matrix $matrixField): array
    {
        $chosenEntryType = null;
        $chosenField = null;
        $newEntryType = null;

        $entryTypes = array_column($matrixField->getEntryTypes(), null, 'handle');

        $this->stdout('   ');
        // if you want to choose content for your CKEfield along with nesting everything else in entries.
        if ($this->confirm($this->markdownToAnsi("Does your `$matrixField->name` matrix field contain a text field that should be used as text content of your converted CKEditor field HTML? (this can be a plain text field or a CKEditor field)"))) {
            $chosenEntryTypeHandle = $this->select(
                '   Which Entry Type (formerly block) contains this field?',
                array_map(fn(EntryType $entryType) => $entryType->name, $entryTypes)
            );

            $chosenEntryType = $entryTypes[$chosenEntryTypeHandle];
            // only allow choosing from plainText and CKE type fields
            $fields = array_column(
                array_filter(
                    $chosenEntryType->getFieldLayout()?->getCustomFields(),
                    fn(\craft\base\Field $field) => $field instanceof PlainText || $field instanceof Field
                ) ?? [], null, 'handle');

            $chosenFieldHandle = $this->select(
                '   Which field would you like to use as text content of your converted CKEditor field?',
                array_map(fn(\craft\base\Field $field) => $field->name, $fields)
            );
            $chosenField = $fields[$chosenFieldHandle];

            // create a duplicate of the selected entry type without the selected field
            // and use it in ckeditor field’s entry types instead of the “original” entry type;
            // name & handle to be the same as the “original” entry type with a - cke suffix
            $newEntryType = $this->createReplacementEntryType($chosenEntryType, $chosenField);
        } else {
            // if you "just" want to nest all content in entries in the CKEditor field
            $this->stdout(PHP_EOL);
            $this->stdout('   ');
            $this->stdout("Your new CKEditor field will contain all the nested entries that your matrix field has and no copy. You can add text to it after conversion.");
        }

        return [$chosenEntryType, $chosenField, $newEntryType];
    }

    /**
     * Duplicate selected entry type, and it's layout, sans the selected field
     * which is supposed to be used to populate the content of the prosified CKE field.
     *
     * @param EntryType|null $chosenEntryType
     * @param \craft\base\Field|null $chosenField
     * @return EntryType
     * @throws Exception
     * @throws \Throwable
     * @throws \craft\errors\EntryTypeNotFoundException
     * @throws \yii\base\InvalidConfigException
     */
    private function createReplacementEntryType(EntryType $chosenEntryType, \craft\base\Field $chosenField): EntryType
    {
        $suffix = $this->getReplacementEntryTypeSuffix($chosenEntryType->handle);

        // clone and prep entry type for duplication
        $newEntryType = (clone $chosenEntryType);
        $newEntryType->id = null;
        $newEntryType->uid = null;
        $newEntryType->name .= ' ' . $suffix;
        $newEntryType->handle .= $suffix;

        // prep field layout for duplication
        $config = $newEntryType->getFieldLayout()->getConfig();
        foreach ($config['tabs'] as $i => &$tab) {
            $tab['uid'] = null;
            foreach ($tab['elements'] as $j => &$element) {
                if (isset($element['fieldUid']) && $element['fieldUid'] === $chosenField->uid) {
                    unset($tab['elements'][$j]);
                } else {
                    $element['uid'] = null;
                }
            }
        }

        // create duplicated field layout
        $newFieldLayout = FieldLayout::createFromConfig($config);
        $newFieldLayout->type = Entry::class;

        // set it on the entry type
        $newEntryType->setFieldLayout($newFieldLayout);

        // and save
        if (!Craft::$app->getEntries()->saveEntryType($newEntryType)) {
            throw new Exception("Couldn't duplicate entry type");
        }

        $this->stdout($this->markdownToAnsi("`$newEntryType->name` Entry Type has been created."));
        return $newEntryType;
    }

    /**
     * Get the suffix for the duplicated entry type.
     *
     * @param string $handle
     * @return int
     */
    private function getReplacementEntryTypeSuffix(string $handle): int
    {
        $count = 0;

        // get handles of all entry types that match the one we're duplicating
        $matchingEntryTypeHandles = (new Query())
            ->select('handle')
            ->from(Table::ENTRYTYPES)
            ->where(['like', 'handle', $handle])
            ->column();

        // sort them descending ensuring that "test9" is before "test10"
        rsort($matchingEntryTypeHandles, SORT_NATURAL);

        // get the highest number we've used so far
        if (preg_match('/\d+$/', reset($matchingEntryTypeHandles), $matches)) {
            $count = (int)$matches[0];
        }

        return $count + 1;
    }

    /**
     * Compile an array of settings to use in the new CKEditor field.
     *
     * @param \craft\base\Field|null $chosenField
     * @return array
     * @throws Exception
     */
    private function ckeFieldSettings(?\craft\base\Field $chosenField = null): array
    {
        $settings = [
            'ckeConfig' => null,
            'searchable' => false,
            'wordLimit' => false,
            'showWordCount' => false,
            'enableSourceEditingForNonAdmins' => false,
            'availableVolumes' => [],
            'availableTransforms' => [],
            'defaultTransform' => '',
            'showUnpermittedVolumes' => false,
            'showUnpermittedFiles' => false,
        ];


        $this->ckeConfigs = Plugin::getInstance()->getCkeConfigs();
        $ckeConfigs = array_column($this->ckeConfigs->getAll(), null, 'name');
        foreach ($ckeConfigs as $key => $value) {
            unset($ckeConfigs[$key]);
            $ckeConfigs[StringHelper::slugify($key)] = $value;
        }

        // if you selected a top level field to populate the prosified field's content with
        if ($chosenField instanceof Field) {
            // check if the ckeconfig for this field has "createEntry" toolbar item added
            $config = array_values(array_filter($ckeConfigs, fn($config) => $config->uid === $chosenField->ckeConfig))[0];
            if (in_array('createEntry', $config->toolbar)) {
                // if yes - just use that config
                $settings['ckeConfig'] = $config->uid;
            } else {
                // if no - say that we're duplicating that config and adding "createEntry" feature to it
                $this->stdout($this->markdownToAnsi("Field `$chosenField->name` doesn't have the `createEntry` feature enabled."));
                $this->stdout(PHP_EOL);
                $this->stdout($this->markdownToAnsi("Creating a duplicate of that config with the `createEntry` button added to the toolbar."));
                $this->stdout(PHP_EOL);

                $newConfig = (clone $config);
                $newConfig->uid = StringHelper::UUID();

                $suffix = $this->getReplacementCkeConfigSuffix($config->name, $ckeConfigs);
                $newConfig->name = $config->name . ' ' . $suffix;

                if (!Plugin::getInstance()->getCkeConfigs()->save($newConfig)) {
                    throw new Exception("Couldn't duplicate CKEditor config");
                }
                $this->stdout($this->markdownToAnsi("`$newConfig->name` CKEditor config has been created."));
                $this->stdout(PHP_EOL);

                $settings['ckeConfig'] = $newConfig->uid;
            }
        } else {
            // otherwise ask which config they'd like to use
            $chosenConfigName = $this->select('   Which CKEditor config should be used for this field?', array_map(fn(CkeConfig $ckeConfig) => $ckeConfig->name, $ckeConfigs));
            $settings['ckeConfig'] = $ckeConfigs[$chosenConfigName]->uid;
        }

        if ($this->confirm("   Use this field’s values as search keywords?")) {
            $settings['searchable'] = true;
        }

        if ($this->confirm("   Would you like to set the “Word limit” for this field?")) {
            $settings['wordLimit'] = (int)$this->prompt(
                "Number of the words to limit to, e.g. 500:",
                [
                    'required' => true,
                    'validator' => function($input, &$error) {
                        if (!is_numeric($input)) {
                            $error = "Please provide a number.";
                            return false;
                        }
                        return true;
                    }
                ]
            );
        }

        if ($this->confirm("   Show word count?")) {
            $settings['showWordCount'] = true;
        }

        if ($this->confirm("   Show the “Source” button for non-admin users?")) {
            $settings['enableSourceEditingForNonAdmins'] = true;
        }

        $settings['availableVolumes'] = $this->getAvailableVolumes();

        $transforms = array_column( Craft::$app->getImageTransforms()->getAllTransforms(), null, 'handle');
        $settings['availableTransforms'] = $this->getAvailableTransforms($transforms);
        $settings['defaultTransform'] = $this->getDefaultTransform($transforms);

        if ($this->confirm("   Do you want to Show unpermitted volumes?")) {
            $settings['showUnpermittedVolumes'] = true;
        }

        if ($this->confirm("   Do you want to Show unpermitted files?")) {
            $settings['showUnpermittedFiles'] = true;
        }

        // todo - make me work
//        $ckeFieldInstance = new Field();
//        $purifierConfigs = $ckeFieldInstance->configOptions('htmlpurifier');
//        $htmlPurifierConfig = $this->select(
//            "Which “HTML Purifier Config” should be used?",
//            $purifierConfigs,
//        );

        return $settings;
    }

    /**
     * Get the suffix for the duplicated CkeConfig.
     *
     * @param string $name
     * @param array $ckeConfigs
     * @return int
     */
    private function getReplacementCkeConfigSuffix(string $name, array $ckeConfigs): int
    {
        $count = 0;

        // get last cke config name that starts like this
        $matchingNames = array_filter(
            array_map(fn($config) => str_starts_with($config->name, $name) ? $config : null, $ckeConfigs)
        );

        krsort($matchingNames);

        if (preg_match('/\d+$/', reset($matchingNames)->name, $matches)) {
            $count = (int)$matches[0];
        }

        return $count + 1;
    }

    private function getAvailableVolumes(): string|array
    {
        $chosenVolumeHandles = [];
        $chosenVolumes = [];
        $volumes = array_column(Craft::$app->getVolumes()->getAllVolumes(), null, 'handle');
        do {
            $volumeHandle = $this->select(
                "   Which volumes should be available in the CKEditor field?",
                ['all' => '*'] + array_map(fn(Volume $volume) => $volume->name, $volumes),
                ''
            );

            if ($volumeHandle !== '') {
                $chosenVolumeHandles[] = $volumeHandle;
            }
        } while (!empty($volumeHandle) && $volumeHandle !== 'all' && count($chosenVolumeHandles) < count($volumes));

        $chosenVolumeHandles = array_unique($chosenVolumeHandles);
        if (in_array('all', $chosenVolumeHandles)) {
            $chosenVolumes = '*';
        } else {
            $chosenVolumes = array_filter($volumes, function(Volume $volume) use ($chosenVolumeHandles) {
                if (in_array($volume->handle, $chosenVolumeHandles)) {
                    return $volume->uid;
                }

                return false;
            });
        }
        // todo - I'm temporary
        $this->stdout(implode(", ", $chosenVolumeHandles), Console::FG_CYAN);
        $this->stdout(PHP_EOL);

        return $chosenVolumes;
    }
    private function getAvailableTransforms(array $transforms): string|array
    {
        $chosenTransformHandles = [];
        $chosenTransforms = [];
        do {
            $transformHandle = $this->select(
                "   Which transforms should be available in the CKEditor field?",
                ['all' => '*'] + array_map(fn(ImageTransform $transform) => $transform->name, $transforms),
                ''
            );

            if ($transformHandle !== '') {
                $chosenTransformHandles[] = $transformHandle;
            }
        } while (!empty($transformHandle) && $transformHandle !== 'all' && count($chosenTransformHandles) < count($transforms));

        $chosenTransformHandles = array_unique($chosenTransformHandles);
        if (in_array('all', $chosenTransformHandles)) {
            $chosenTransforms = '*';
        } else {
            $chosenTransforms = array_filter($transforms, function(ImageTransform $transform) use ($chosenTransformHandles) {
                if (in_array($transform->handle, $chosenTransformHandles)) {
                    return $transform->uid;
                }

                return false;
            });
        }
        // todo - I'm temporary
        $this->stdout(implode(", ", $chosenTransformHandles), Console::FG_CYAN);
        $this->stdout(PHP_EOL);

        return $chosenTransforms;
    }

    private function getDefaultTransform(array $transforms): string
    {
        $defaultTransformHandle = $this->select(
            "   Which transform should be used as a default?",
            ['none' => ''] + array_map(fn(ImageTransform $transform) => $transform->name, $transforms),
        );

        if ($defaultTransformHandle == 'none') {
            return '';
        }

        return $transforms[$defaultTransformHandle]->uid;
    }

    /**
     * Converts Redactor fields to CKEditor
     *
     * @return int
     */
    public function actionRedactor(): int
    {
        $this->projectConfig = Craft::$app->getProjectConfig();

        // Find Redactor fields
        $fields = null;
        $this->do('Looking for Redactor fields in the project config', function() use (&$fields) {
            $fields = $this->findFields($this->projectConfig->get(), 'craft\\redactor\\Field');
        });

        if (empty($fields)) {
            $this->stdout("   No Redactor fields found.\n", Console::FG_YELLOW);
            return ExitCode::OK;
        }

        $this->stdout(PHP_EOL);
        $this->outputFields($fields, 'Redactor');
        $this->stdout(PHP_EOL);

        // Map the Redactor configs to CKEditor configs
        $this->ckeConfigs = Plugin::getInstance()->getCkeConfigs();
        $ckeConfigs = $this->ckeConfigs->getAll();
        $fieldSettingsByConfig = [];
        $configMap = [];

        foreach ($fields as $path => $field) {
            $this->stdout(' → ', Console::FG_GREY);
            $this->stdout($this->markdownToAnsi(sprintf('Converting %s', $this->pathAndHandleMarkdown($path, $field))));
            $this->stdout(' …', Console::FG_GREY);

            if ($field['type'] === MissingField::class) {
                $field['settings'] = ProjectConfigHelper::unpackAssociativeArray($field['settings']['settings'] ?? []);
            }

            try {
                if (($field['settings']['configSelectionMode'] ?? null) === 'manual') {
                    $this->stdout(PHP_EOL . PHP_EOL);
                    try {
                        $redactorConfig = Json::decode($field['settings']['manualConfig'] ?? '') ?? [];
                    } catch (InvalidArgumentException) {
                        throw new Exception('`manualConfig` contains invalid JSON.');
                    }
                    $configName = $field['name'] ?? (!empty($field['handle']) ? Inflector::camel2words($field['handle']) : 'Untitled');
                    $ckeConfig = $this->generateCkeConfig($configName, $redactorConfig, $ckeConfigs, $fieldSettingsByConfig);
                    $this->stdout(PHP_EOL);
                } else {
                    $basename = ($field['settings']['redactorConfig'] ?? $field['settings']['configFile'] ?? null) ?: 'Default.json';
                    if (!isset($configMap[$basename])) {
                        $this->stdout(PHP_EOL . PHP_EOL);
                        $configMap[$basename] = $this->resolveRedactorConfig($basename, $ckeConfigs, $fieldSettingsByConfig);
                        $this->stdout(PHP_EOL);
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

                $this->projectConfig->set($path, $field);
            } catch (OperationAbortedException) {
                $this->stdout(" ✕ Field skipped\n", Console::FG_YELLOW);
                continue;
            }

            $this->stdout(" ✓ Field converted\n", Console::FG_GREEN);
        }

        $this->stdout("\n ✓ Finished converting Redactor fields.\n", Console::FG_GREEN, Console::BOLD);

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
        $this->stdout('   ');
        if ($this->confirm($this->markdownToAnsi("Do you already have a CKEditor config that should be used in place of the `$filename` Redactor config?"))) {
            $choice = $this->select('   Which CKEditor config?', array_map(fn(CkeConfig $ckeConfig) => $ckeConfig->name, $ckeConfigs));
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
    ): string {
        // Make sure the name is unique
        $baseConfigName = $configName;
        $attempt = 1;
        while (ArrayHelper::contains($ckeConfigs, fn(CkeConfig $ckeConfig) => $ckeConfig->name === $configName)) {
            $configName = sprintf('%s %s', $baseConfigName, ++$attempt);
        }

        $this->stdout('    → ', Console::FG_GREY);
        $this->stdout($this->markdownToAnsi("Generating `$configName` CKEditor config"));
        $this->stdout(' …', Console::FG_GREY);

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
            $this->stdout("\n\n      ⚠️  The following Redactor config items aren’t supported by CKEditor:\n");
            $this->outputList($unsupportedItems, '         ');
            if (!$this->confirm("\n      Continue anyway?", true)) {
                throw new OperationAbortedException();
            }
            $this->stdout('   ');
        }

        if (!$this->ckeConfigs->save($ckeConfig)) {
            throw new Exception(sprintf('Unable to save the CKEditor config: %s', implode(', ', $ckeConfig->getFirstErrors())));
        }

        $this->stdout(" ✓ Config generated\n", Console::FG_GREEN);

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
}
