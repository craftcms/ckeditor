<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\console\actions;

use Craft;
use craft\base\Field as BaseField;
use craft\base\FieldInterface;
use craft\ckeditor\CkeConfig;
use craft\ckeditor\CkeConfigs;
use craft\ckeditor\console\controllers\ConvertController;
use craft\ckeditor\Field;
use craft\ckeditor\Plugin;
use craft\db\Query;
use craft\db\Table;
use craft\elements\Entry;
use craft\enums\PropagationMethod;
use craft\fields\Matrix;
use craft\fields\PlainText;
use craft\helpers\Console;
use craft\helpers\FileHelper;
use craft\helpers\StringHelper;
use craft\models\EntryType;
use craft\models\FieldLayout;
use craft\models\ImageTransform;
use craft\models\Volume;
use craft\services\ProjectConfig;
use yii\base\Action;
use yii\base\Exception;
use yii\console\ExitCode;

/**
 * Converts a Matrix field to CKEditor
 *
 * @property ConvertController $controller
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 4.2.0
 */
class ConvertMatrix extends Action
{
    private ProjectConfig $projectConfig;
    private CkeConfigs $ckeConfigs;

    /**
     * Converts a Matrix field to CKEditor
     *
     * @param string $fieldHandle
     * @return int
     * @throws Exception
     */
    public function run(string $fieldHandle): int
    {
        $matrixField = Craft::$app->getFields()->getFieldByHandle($fieldHandle);

        if (!$matrixField) {
            $this->controller->stdout("No field with original handle of `$fieldHandle` found.\n", Console::FG_YELLOW);
            return ExitCode::OK;
        }

        if (!$matrixField instanceof Matrix) {
            // otherwise, ensure we're dealing with a matrix field
            $this->controller->stdout("Field `$fieldHandle` is not a Matrix field.\n", Console::FG_YELLOW);
            return ExitCode::OK;
        }

        // we have the matrix field, let's set up the basics for the CKE field
        /** @var EntryType|null $outgoingEntryType */
        /** @var FieldInterface|null $outgoingTextField */
        /** @var EntryType|null $replacementEntryType */
        [$outgoingEntryType, $outgoingTextField, $replacementEntryType] = $this->prepareContentPopulation($matrixField);

        $this->controller->stdout("\n\n");

        $this->controller->stdout("Configure your new CKEditor field\n", Console::FG_GREEN);
        $settings = $this->ckeFieldSettings($outgoingTextField);

        $this->controller->stdout("\n\n");

        $this->controller->stdout("Starting field conversion\n", Console::FG_GREEN);

        // get the Matrix field’s config
        $this->projectConfig = Craft::$app->getProjectConfig();
        $config = $this->projectConfig->get("fields.{$matrixField->uid}");

        // change its type
        $config['type'] = Field::class;

        // Propagation Method => Translation Method
        $config['translationMethod'] = match ($config['settings']['propagationMethod'] ?? null) {
            PropagationMethod::None->value => Field::TRANSLATION_METHOD_SITE,
            PropagationMethod::SiteGroup->value => Field::TRANSLATION_METHOD_SITE_GROUP,
            PropagationMethod::Language->value => Field::TRANSLATION_METHOD_LANGUAGE,
            PropagationMethod::Custom->value => Field::TRANSLATION_METHOD_CUSTOM,
            default => Field::TRANSLATION_METHOD_NONE,
        };
        $config['translationKeyFormat'] = $config['settings']['propagationKeyFormat'] ?? null;

        // set the settings
        $config['settings'] = $settings;

        // set the entry types
        $config['settings']['entryTypes'] = $matrixField->settings['entryTypes'];
        if ($outgoingEntryType !== null && $replacementEntryType !== null) {
            if (($key = array_search($outgoingEntryType->uid, $config['settings']['entryTypes'])) !== false) {
                $config['settings']['entryTypes'][$key] = $replacementEntryType->uid;
            }
        }

        $this->projectConfig->set("fields.{$matrixField->uid}", $config);

        $this->controller->stdout(" ✓ Finished converting the Matrix field to CKEditor field.\n\n", Console::FG_GREEN);

        /** @var Field $ckeField */
        $ckeField = Craft::$app->getFields()->getFieldByHandle($matrixField->handle);
        $contentMigrator = Craft::$app->getContentMigrator();
        $migrationName = sprintf('m%s_convert_%s_to_ckeditor', gmdate('ymd_His'), $ckeField->handle);
        $migrationPath = "$contentMigrator->migrationPath/$migrationName.php";

        $this->controller->do("Generating content migration", function() use (
            $ckeField,
            $outgoingEntryType,
            $outgoingTextField,
            $replacementEntryType,
            $migrationName,
            $migrationPath,
        ) {
            $content = $this->controller->getView()->renderFile(__DIR__ . '/convert-matrix-migration.php.template', [
                'namespace' => Craft::$app->getContentMigrator()->migrationNamespace,
                'className' => $migrationName,
                'ckeFieldUid' => $ckeField->uid,
                'outgoingEntryTypeUid' => $outgoingEntryType->uid,
                'outgoingTextFieldUid' => $outgoingTextField->layoutElement->uid,
                'replacementEntryTypeUid' => $replacementEntryType->uid,
            ], $this);
            FileHelper::writeToFile($migrationPath, $content);
        });

        $this->controller->stdout(" → Running content migration …\n");
        $contentMigrator->migrateUp($migrationName);

        $this->controller->success(sprintf(<<<EOD
Field converted to Matrix. Commit `%s`
and your project config changes, and run `craft up` on other environments
for the changes to take effect.
EOD,
            FileHelper::relativePath($migrationPath)
        ));

        return ExitCode::OK;
    }

    /**
     * Prepare CKEditor field for being populated with content.
     * Ask about entry type and field to be used to populate the CKEditor field.
     *
     * @param Matrix $matrixField
     * @return array
     */
    private function prepareContentPopulation(Matrix $matrixField): array
    {
        $outgoingEntryType = null;
        $outgoingTextField = null;
        $replacementEntryType = null;

        $entryTypes = array_column($matrixField->getEntryTypes(), null, 'handle');

        // if you want to choose content for your CKEfield along with nesting everything else in entries.
        if ($this->controller->confirm($this->controller->markdownToAnsi("Does your `$matrixField->name` matrix field contain a text field that should be used as part of the content of your converted CKEditor field?\n(this can be a plain text field or a CKEditor field)"))) {
            $chosenEntryTypeHandle = $this->controller->select(
                '   Which Entry Type (formerly block) contains this field?',
                array_map(fn(EntryType $entryType) => $entryType->name, $entryTypes)
            );

            $outgoingEntryType = $entryTypes[$chosenEntryTypeHandle];
            // only allow choosing from plainText and CKE type fields
            $fields = array_column(
                array_filter(
                    $outgoingEntryType->getFieldLayout()->getCustomFields(),
                    fn(FieldInterface $field) => $field instanceof PlainText || $field instanceof Field
                ), null, 'handle');

            if (empty($fields)) {
                $this->controller->stdout("\n   ");
                $this->controller->stdout($this->controller->markdownToAnsi("`$chosenEntryTypeHandle` doesn't contain any Plain Text or CKEditor fields."));
                $this->controller->stdout("\n   Proceeding with populating the CKEditor field with the entries from the Matrix field.");
                $outgoingEntryType = null;

                return [null, null, null];
            }

            $chosenFieldHandle = $this->controller->select(
                '   Which field would you like to use as text content of your converted CKEditor field?',
                array_map(fn(BaseField $field) => $field->name, $fields)
            );
            $outgoingTextField = $fields[$chosenFieldHandle];

            // create a duplicate of the selected entry type without the selected field
            // and use it in ckeditor field’s entry types instead of the “original” entry type;
            // name & handle to be the same as the “original” entry type with a - cke suffix
            $replacementEntryType = $this->createReplacementEntryType($outgoingEntryType, $outgoingTextField);
        } else {
            // if you "just" want to nest all content in entries in the CKEditor field
            $this->controller->stdout("\n   Your new CKEditor field will contain all the nested entries that your matrix field has and no copy. You can add text to it after conversion.");
        }

        return [$outgoingEntryType, $outgoingTextField, $replacementEntryType];
    }

    /**
     * Duplicate selected entry type and its layout, sans the field
     * which is supposed to be used to populate the content of the converted field.
     *
     * @param EntryType $outgoingEntryType
     * @param BaseField $outgoingTextField
     * @return EntryType
     * @throws Exception
     */
    private function createReplacementEntryType(EntryType $outgoingEntryType, BaseField $outgoingTextField): EntryType
    {
        $suffix = $this->getReplacementEntryTypeSuffix($outgoingEntryType->handle);

        // clone and prep entry type for duplication
        $replacementEntryType = (clone $outgoingEntryType);
        $replacementEntryType->id = null;
        $replacementEntryType->uid = null;
        $replacementEntryType->name .= ' ' . $suffix;
        $replacementEntryType->handle .= $suffix;

        $this->controller->stdout("\n   ");
        $this->controller->stdout($this->controller->markdownToAnsi("Duplicating `$outgoingEntryType->handle` Entry Type without the `$outgoingTextField->handle` field."));
        $this->controller->stdout(PHP_EOL);
        // prep field layout for duplication
        $config = $replacementEntryType->getFieldLayout()->getConfig();
        foreach ($config['tabs'] as &$tab) {
            $tab['uid'] = null;
            foreach ($tab['elements'] as $j => &$element) {
                if (isset($element['fieldUid']) && $element['fieldUid'] === $outgoingTextField->uid) {
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
        $replacementEntryType->setFieldLayout($newFieldLayout);

        // and save
        if (!Craft::$app->getEntries()->saveEntryType($replacementEntryType)) {
            throw new Exception("Couldn't duplicate entry type");
        }

        $this->controller->stdout("\n " . $this->controller->markdownToAnsi(" ✓ `$replacementEntryType->name` Entry Type has been created.\n"));
        return $replacementEntryType;
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
            ->where(['like', 'handle', $handle . '%', false])
            ->column();

        $matchingEntryTypeHandles = array_filter($matchingEntryTypeHandles, function($matchingEntryTypeHandle) use ($handle) {
            return preg_match('/^' . $handle . '\d?$/', $matchingEntryTypeHandle);
        });

        // sort them descending ensuring that "test9" is before "test10"
        rsort($matchingEntryTypeHandles, SORT_NATURAL);

        // get the highest number we've used so far
        if (preg_match('/\d+$/', reset($matchingEntryTypeHandles), $matches)) {
            $count = (int)$matches[0];
        }

        return $count + 1;
    }

    /**
     * Compile an array of settings to use in the converted CKEditor field.
     *
     * @param BaseField|null $outgoingTextField
     * @return array
     * @throws Exception
     */
    private function ckeFieldSettings(?BaseField $outgoingTextField = null): array
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

        // if you selected a top level field to populate the converted field's content with
        if ($outgoingTextField instanceof Field) {
            // check if the ckeconfig for this field has "createEntry" toolbar item added
            $config = array_values(array_filter($ckeConfigs, fn($ckeConfig) => $ckeConfig->uid === $outgoingTextField->ckeConfig))[0];
            if (in_array('createEntry', $config->toolbar)) {
                // if yes - just use that config
                $settings['ckeConfig'] = $config->uid;
            } else {
                // if no - say that we're duplicating that config and adding "createEntry" feature to it
                $this->controller->stdout($this->controller->markdownToAnsi("   Field `$outgoingTextField->name` doesn't have the `createEntry` feature enabled.\n"));
                $this->controller->stdout($this->controller->markdownToAnsi("   Creating a duplicate of that config with the `createEntry` button added to the toolbar.\n"));

                $newConfig = (clone $config);
                $newConfig->uid = StringHelper::UUID();

                $suffix = $this->getReplacementCkeConfigSuffix($config->name, $ckeConfigs);
                $newConfig->name = $config->name . ' ' . $suffix;

                if (!Plugin::getInstance()->getCkeConfigs()->save($newConfig)) {
                    throw new Exception("Couldn't duplicate CKEditor config");
                }
                $this->controller->stdout($this->controller->markdownToAnsi("   `$newConfig->name` CKEditor config has been created.\n"));

                $settings['ckeConfig'] = $newConfig->uid;
            }
        } else {
            // otherwise ask which config they'd like to use - only show those that contain 'createEntry'
            $chosenConfigName = $this->controller->select(
                '   Which CKEditor config should be used for this field?',
                array_filter(
                    array_map(
                        fn(CkeConfig $ckeConfig) => in_array('createEntry', $ckeConfig->toolbar) ? $ckeConfig->name : null,
                        $ckeConfigs
                    )
                )
            );
            $settings['ckeConfig'] = $ckeConfigs[$chosenConfigName]->uid;
        }

        if ($this->controller->confirm("   Use this field’s values as search keywords?")) {
            $settings['searchable'] = true;
        }

        if ($this->controller->confirm("   Would you like to set the “Word limit” for this field?")) {
            $settings['wordLimit'] = (int)$this->controller->prompt(
                "   Number of the words to limit to, e.g. 500:",
                [
                    'required' => true,
                    'validator' => function($input, &$error) {
                        if (!is_numeric($input)) {
                            $error = "Please provide a number.";
                            return false;
                        }
                        return true;
                    },
                ]
            );
        }

        if ($this->controller->confirm("   Show word count?")) {
            $settings['showWordCount'] = true;
        }

        if ($this->controller->confirm("   Show the “Source” button for non-admin users?")) {
            $settings['enableSourceEditingForNonAdmins'] = true;
        }

        $settings['availableVolumes'] = $this->getAvailableVolumes();

        $transforms = array_column(Craft::$app->getImageTransforms()->getAllTransforms(), null, 'handle');
        $settings['availableTransforms'] = $this->getAvailableTransforms($transforms);
        $settings['defaultTransform'] = $this->getDefaultTransform($transforms);

        if ($this->controller->confirm("   Do you want to Show unpermitted volumes?")) {
            $settings['showUnpermittedVolumes'] = true;
        }

        if ($this->controller->confirm("   Do you want to Show unpermitted files?")) {
            $settings['showUnpermittedFiles'] = true;
        }

        if ($this->controller->confirm("   Purify HTML?", true)) {
            $settings['purifyHtml'] = true;

            $purifierConfigs = $this->getHtmlPurifierConfigOptions();
            $htmlPurifierConfig = $this->controller->select(
                "   Which “HTML Purifier Config” should be used?",
                $purifierConfigs,
            );
            $settings['purifierConfig'] = $purifierConfigs[$htmlPurifierConfig];
        }

        return $settings;
    }

    /**
     * Return an array of available configs from the config/htmlpurifier directory.
     *
     * @return string[]
     * @throws Exception
     */
    private function getHtmlPurifierConfigOptions(): array
    {
        $options = ['Default' => ''];
        $path = Craft::$app->getPath()->getConfigPath() . DIRECTORY_SEPARATOR . 'htmlpurifier';

        if (is_dir($path)) {
            $files = FileHelper::findFiles($path, [
                'only' => ['*.json'],
                'recursive' => false,
            ]);

            foreach ($files as $file) {
                $filename = basename($file);
                if ($filename !== 'Default.json') {
                    $options[pathinfo($file, PATHINFO_FILENAME)] = $filename;
                }
            }
        }

        ksort($options);

        return $options;
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

    /**
     * Returns an array of UIDs of volumes that should be available for the CKEditor field,
     *  or '*' if all volumes should be available.
     *
     * @return string|array
     */
    private function getAvailableVolumes(): string|array
    {
        $chosenVolumeHandles = [];
        $chosenVolumes = [];
        $volumes = array_column(Craft::$app->getVolumes()->getAllVolumes(), null, 'handle');
        do {
            $volumeHandle = $this->controller->select(
                "   Which volumes should be available in the CKEditor field?",
                ['all' => '*'] + array_map(fn(Volume $volume) => $volume->name, $volumes),
                'all'
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

        return $chosenVolumes;
    }

    /**
     * Returns an array of UIDs of image transforms that should be available for the CKEditor field,
     * or '*' if all transforms should be available.
     *
     * @param array $transforms
     * @return string|array
     */
    private function getAvailableTransforms(array $transforms): string|array
    {
        $chosenTransformHandles = [];
        $chosenTransforms = [];
        do {
            $transformHandle = $this->controller->select(
                "   Which transforms should be available in the CKEditor field?",
                ['all' => '*'] + array_map(fn(ImageTransform $transform) => $transform->name, $transforms),
                'all'
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

        return $chosenTransforms;
    }

    /**
     * Returns UID of an image transform that should be used as a default one for the CKEditor field,
     * or an empty string if no transform should be used as default.
     *
     * @param array $transforms
     * @return string
     */
    private function getDefaultTransform(array $transforms): string
    {
        $defaultTransformHandle = $this->controller->select(
            "   Which transform should be used as a default?",
            ['none' => ''] + array_map(fn(ImageTransform $transform) => $transform->name, $transforms),
            'none'
        );

        if ($defaultTransformHandle == 'none') {
            return '';
        }

        return $transforms[$defaultTransformHandle]->uid;
    }
}
