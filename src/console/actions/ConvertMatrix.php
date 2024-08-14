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
        $field = Craft::$app->getFields()->getFieldByHandle($fieldHandle);
        $skipProjectConfig = false;

        if (!$field) {
            $this->controller->stdout("No field with original handle of `$fieldHandle` found.\n", Console::FG_YELLOW);
            return ExitCode::OK;
        }

        if ($field instanceof Field) {
            // if we're dealing with a CKE field already, we should skip all the project config adjustments and only deal with content
            $this->controller->stdout("Field `$fieldHandle` is already a CKEditor field. Proceeding to content conversion.\n", Console::FG_GREEN);
            $skipProjectConfig = true;
        } elseif (!$field instanceof Matrix) {
            // otherwise, ensure we're dealing with a matrix field
            $this->controller->stdout("Field `$fieldHandle` is not a Matrix field.\n", Console::FG_YELLOW);
            return ExitCode::OK;
        }

        if ($skipProjectConfig) {
            $this->convertMatrixToCkeContent($field);
        } else {
            // we have the matrix field, let's set up the basics for the CKE field
            [$chosenEntryType, $chosenField, $newEntryType] = $this->prepareContentPopulation($field);

            $this->controller->stdout("\n\n");

            $this->controller->stdout("Configure your new CKEditor field\n", Console::FG_GREEN);
            $settings = $this->ckeFieldSettings($chosenField);

            $this->controller->stdout("\n\n");

            $this->convertMatrixToCke($settings, $field, $chosenEntryType, $newEntryType, $chosenField);

            $this->controller->stdout("\n\n***** IMPORTANT ***** \n", Console::FG_YELLOW, Console::BOLD);
            $this->controller->stdout("After deploying the amended Project Config, run the following command to ensure content is converted accordingly:\n");

            $command = " > craft ckeditor/convert/matrix $field->handle";
            if ($chosenEntryType !== null && $newEntryType !== null && $chosenField !== null) {
                $command .= " --chosenEntryTypeHandle $chosenEntryType->handle --newEntryTypeHandle $newEntryType->handle --chosenFieldHandle $chosenField->handle";
            }
            $this->controller->stdout("$command \n", Console::FG_CYAN);
        }

        $this->controller->stdout("\n ✓ Conversion complete.\n", Console::FG_GREEN);

        return ExitCode::OK;
    }

    /**
     * Convert Matrix field to a CKEditor field.
     *
     * @param array $settings
     * @param Matrix $field
     * @param EntryType|null $chosenEntryType
     * @param EntryType|null $newEntryType
     * @param BaseField|null $chosenField
     * @return void
     */
    private function convertMatrixToCke(
        array $settings,
        Matrix $field,
        ?EntryType $chosenEntryType = null,
        ?EntryType $newEntryType = null,
        ?BaseField $chosenField = null,
    ): void {
        $this->controller->stdout("Starting field conversion\n", Console::FG_GREEN);

        // get matrix field form PC
        $this->projectConfig = Craft::$app->getProjectConfig();
        $pcField = $this->projectConfig->get("fields.{$field->uid}");

        // change its type
        $pcField['type'] = Field::class;

        // translate propagation into translation method
        $pcField['translationKeyFormat'] = $pcField['settings']['propagationKeyFormat'];
        $pcField['translationMethod'] = match ($pcField['settings']['propagationMethod']) {
            PropagationMethod::All->value => Field::TRANSLATION_METHOD_NONE,
            PropagationMethod::None->value => Field::TRANSLATION_METHOD_SITE,
            PropagationMethod::SiteGroup->value => Field::TRANSLATION_METHOD_SITE_GROUP,
            PropagationMethod::Language->value => Field::TRANSLATION_METHOD_LANGUAGE,
            PropagationMethod::Custom->value => Field::TRANSLATION_METHOD_CUSTOM,
            default => Field::TRANSLATION_METHOD_NONE,
        };

        // set the settings
        $pcField['settings'] = $settings;

        // set the entry types
        $pcField['settings']['entryTypes'] = $field->settings['entryTypes'];
        if ($chosenEntryType !== null && $newEntryType !== null) {
            if (($key = array_search($chosenEntryType->uid, $pcField['settings']['entryTypes'])) !== false) {
                $pcField['settings']['entryTypes'][$key] = $newEntryType->uid;
            }
        }

        $this->projectConfig->set("fields.{$field->uid}", $pcField);

        $this->controller->stdout(" ✓ Finished converting the Matrix field to CKEditor field.\n\n", Console::FG_GREEN);

        /** @var Field $updatedField */
        $updatedField = Craft::$app->getFields()->getFieldByHandle($field->handle);
        $this->convertMatrixToCkeContent($updatedField, $chosenEntryType, $newEntryType, $chosenField);
    }

    /**
     * Save content of the converted matrix field as a CKEditor field content.
     *
     * @param Field $field
     * @param EntryType|null $chosenEntryType
     * @param EntryType|null $newEntryType
     * @param BaseField|null $chosenField
     * @return void
     */
    private function convertMatrixToCkeContent(
        Field $field,
        ?EntryType $chosenEntryType = null,
        ?EntryType $newEntryType = null,
        ?BaseField $chosenField = null,
    ): void {
        $this->controller->stdout("Starting content conversion\n", Console::FG_GREEN);

        $entriesService = Craft::$app->getEntries();
        if ($chosenEntryType === null && $this->controller->chosenEntryTypeHandle !== null) {
            $chosenEntryType = $entriesService->getEntryTypeByHandle($this->controller->chosenEntryTypeHandle);
        }

        if ($newEntryType === null && $this->controller->newEntryTypeHandle !== null) {
            $newEntryType = $entriesService->getEntryTypeByHandle($this->controller->newEntryTypeHandle);
        }

        if ($chosenField === null && $this->controller->chosenFieldHandle !== null) {
            $chosenField = Craft::$app->getFields()->getFieldByHandle($this->controller->chosenFieldHandle);
        }

        // get all the nested entries belonging to the field we’re converting
        $nestedEntries = Entry::find()
            ->fieldId($field->id)
            ->drafts(null)
            ->revisions(null)
            ->trashed(null)
            ->status(null)
            ->all();

        // group them by ownerId
        $groupedNestedEntries = [];
        foreach ($nestedEntries as $entry) {
            $groupedNestedEntries[$entry->ownerId][] = $entry;
        }

        // iterate through all the nested entries
        foreach (array_keys($groupedNestedEntries) as $ownerId) {
            $nestedEntries = $groupedNestedEntries[$ownerId];
            $owner = $nestedEntries[0]->getOwner();

            // if we have the top-level HTML field defined:
            if ($chosenEntryType !== null && $newEntryType !== null) {
                $value = '';
                // iterate through each nested entry,
                /** @var Entry $entry */
                foreach ($nestedEntries as $entry) {
                    // if the nested entry is the one containing the top-level field,
                    // get its content and place it before the rest of that entry’s content
                    // followed by the <craft-entry data-entry-id=\"<nested entry id>\"></craft-entry>;
                    // also change the entry type to the ID of the duplicate that doesn’t contain that field
                    if ($entry->type->uid === $chosenEntryType->uid) {
                        $value .= $entry->getFieldValue($chosenField->handle);
                        $value .= '<craft-entry data-entry-id="' . $entry->id . '"></craft-entry>';
                        $entry->setTypeId($newEntryType->id);
                        Craft::$app->getElements()->saveElement($entry, false);
                    } else {
                        // for other nested entries add the <craft-entry data-entry-id=\"<nested entry id>\”></craft-entry>
                        $value .= '<craft-entry data-entry-id="' . $entry->id . '"></craft-entry>';
                    }
                }
            } else {
                // populate the CKEditor field with content which is: <craft-entry data-entry-id=\"<nested entry id>\”></craft-entry>
                $valueIds = array_map(fn(Entry $entry) => $entry->id, $nestedEntries);
                $value = '';
                foreach ($valueIds as $id) {
                    $value .= '<craft-entry data-entry-id="' . $id . '"></craft-entry>';
                }
            }

            $owner->setFieldValue($field->handle, $value);

            // save each owner
            Craft::$app->getElements()->saveElement($owner, false);
        }
        $this->controller->stdout(" ✓ Finished converting the Matrix content to CKEditor content.\n", Console::FG_GREEN);
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
        $chosenEntryType = null;
        $chosenField = null;
        $newEntryType = null;

        $entryTypes = array_column($matrixField->getEntryTypes(), null, 'handle');

        // if you want to choose content for your CKEfield along with nesting everything else in entries.
        if ($this->controller->confirm($this->controller->markdownToAnsi("Does your `$matrixField->name` matrix field contain a text field that should be used as part of the content of your converted CKEditor field?\n(this can be a plain text field or a CKEditor field)"))) {
            $chosenEntryTypeHandle = $this->controller->select(
                '   Which Entry Type (formerly block) contains this field?',
                array_map(fn(EntryType $entryType) => $entryType->name, $entryTypes)
            );

            $chosenEntryType = $entryTypes[$chosenEntryTypeHandle];
            // only allow choosing from plainText and CKE type fields
            $fields = array_column(
                array_filter(
                    $chosenEntryType->getFieldLayout()->getCustomFields(),
                    fn(FieldInterface $field) => $field instanceof PlainText || $field instanceof Field
                ), null, 'handle');

            if (empty($fields)) {
                $this->controller->stdout("\n   ");
                $this->controller->stdout($this->controller->markdownToAnsi("`$chosenEntryTypeHandle` doesn't contain any Plain Text or CKEditor fields."));
                $this->controller->stdout("\n   Proceeding with populating the CKEditor field with the entries from the Matrix field.");
                $chosenEntryType = null;

                return [null, null, null];
            }

            $chosenFieldHandle = $this->controller->select(
                '   Which field would you like to use as text content of your converted CKEditor field?',
                array_map(fn(BaseField $field) => $field->name, $fields)
            );
            $chosenField = $fields[$chosenFieldHandle];

            // create a duplicate of the selected entry type without the selected field
            // and use it in ckeditor field’s entry types instead of the “original” entry type;
            // name & handle to be the same as the “original” entry type with a - cke suffix
            $newEntryType = $this->createReplacementEntryType($chosenEntryType, $chosenField);
        } else {
            // if you "just" want to nest all content in entries in the CKEditor field
            $this->controller->stdout("\n   Your new CKEditor field will contain all the nested entries that your matrix field has and no copy. You can add text to it after conversion.");
        }

        return [$chosenEntryType, $chosenField, $newEntryType];
    }

    /**
     * Duplicate selected entry type, and it's layout, sans the field
     * which is supposed to be used to populate the content of the prosified CKE field.
     *
     * @param EntryType $chosenEntryType
     * @param BaseField $chosenField
     * @return EntryType
     * @throws Exception
     */
    private function createReplacementEntryType(EntryType $chosenEntryType, BaseField $chosenField): EntryType
    {
        $suffix = $this->getReplacementEntryTypeSuffix($chosenEntryType->handle);

        // clone and prep entry type for duplication
        $newEntryType = (clone $chosenEntryType);
        $newEntryType->id = null;
        $newEntryType->uid = null;
        $newEntryType->name .= ' ' . $suffix;
        $newEntryType->handle .= $suffix;

        $this->controller->stdout("\n   ");
        $this->controller->stdout($this->controller->markdownToAnsi("Duplicating `$chosenEntryType->handle` Entry Type without the `$chosenField->handle` field."));
        $this->controller->stdout(PHP_EOL);
        // prep field layout for duplication
        $config = $newEntryType->getFieldLayout()->getConfig();
        foreach ($config['tabs'] as &$tab) {
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

        $this->controller->stdout("\n " . $this->controller->markdownToAnsi(" ✓ `$newEntryType->name` Entry Type has been created.\n"));
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
     * @param BaseField|null $chosenField
     * @return array
     * @throws Exception
     */
    private function ckeFieldSettings(?BaseField $chosenField = null): array
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
            $config = array_values(array_filter($ckeConfigs, fn($ckeConfig) => $ckeConfig->uid === $chosenField->ckeConfig))[0];
            if (in_array('createEntry', $config->toolbar)) {
                // if yes - just use that config
                $settings['ckeConfig'] = $config->uid;
            } else {
                // if no - say that we're duplicating that config and adding "createEntry" feature to it
                $this->controller->stdout($this->controller->markdownToAnsi("   Field `$chosenField->name` doesn't have the `createEntry` feature enabled.\n"));
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
