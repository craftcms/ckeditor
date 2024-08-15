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
use Illuminate\Support\Collection;
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
    /**
     * Converts a Matrix field to CKEditor
     *
     * @param string $fieldHandle
     * @return int
     * @throws Exception
     */
    public function run(string $fieldHandle): int
    {
        if (!$this->controller->interactive) {
            $this->controller->stderr("The fields/merge command must be run interactively.\n");
            return ExitCode::UNSPECIFIED_ERROR;
        }

        $fieldsService = Craft::$app->getFields();
        $matrixField = $fieldsService->getFieldByHandle($fieldHandle);

        if (!$matrixField) {
            $this->controller->stdout("No field with original handle of `$fieldHandle` found.\n", Console::FG_RED);
            return ExitCode::UNSPECIFIED_ERROR;
        }

        if (!$matrixField instanceof Matrix) {
            // otherwise, ensure we're dealing with a matrix field
            $this->controller->stdout("Field `$fieldHandle` is not a Matrix field.\n", Console::FG_RED);
            return ExitCode::UNSPECIFIED_ERROR;
        }

        // we have the matrix field, let's set up the basics for the CKE field
        /** @var EntryType|null $outgoingEntryType */
        /** @var Field|PlainText|null $outgoingTextField */
        /** @var EntryType|null $replacementEntryType */
        [$outgoingEntryType, $outgoingTextField, $replacementEntryType] = $this->prepareContentPopulation($matrixField);

        $this->controller->stdout("\n\n");

        // create the CKEditor field
        $ckeField = new Field([
            'id' => $matrixField->id,
            'uid' => $matrixField->uid,
            'name' => $matrixField->name,
            'handle' => $matrixField->handle,
            'context' => $matrixField->context,
            'instructions' => $matrixField->instructions,
            'searchable' => $matrixField->searchable,
            'translationMethod' => match ($matrixField->propagationMethod) {
                PropagationMethod::None => Field::TRANSLATION_METHOD_SITE,
                PropagationMethod::SiteGroup => Field::TRANSLATION_METHOD_SITE_GROUP,
                PropagationMethod::Language => Field::TRANSLATION_METHOD_LANGUAGE,
                PropagationMethod::Custom => Field::TRANSLATION_METHOD_CUSTOM,
                default => Field::TRANSLATION_METHOD_NONE,
            },
            'translationKeyFormat' => $matrixField->propagationKeyFormat,
            'entryTypes' => $matrixField->getEntryTypes(),
        ]);

        // get the CKEditor config, and ensure it has a "New entry" button
        $ckeConfig = $this->ckeConfig($ckeField, $outgoingTextField);
        if (!in_array('createEntry', $ckeConfig->toolbar)) {
            $this->controller->do("Adding the `New entry` button to the `$ckeConfig->name` CKEditor config", function() use ($ckeConfig) {
                $ckeConfig->toolbar[] = '|';
                $ckeConfig->toolbar[] = 'createEntry';
                if (!Plugin::getInstance()->getCkeConfigs()->save($ckeConfig)) {
                    throw new Exception('Couldn’t save the CKEditor config.');
                }
            });
        }
        $ckeField->ckeConfig = $ckeConfig->uid;

        $this->controller->do("Saving the `$ckeField->name` field", function() use ($fieldsService, $ckeField) {
            if (!$fieldsService->saveField($ckeField)) {
                throw new Exception('Couldn’t save the field.');
            }
        });

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
Field converted to CKEditor. Commit `%s`
and your project config changes, and run `craft up` on other environments
for the changes to take effect.
EOD,
            FileHelper::relativePath($migrationPath)
        ));

        return ExitCode::OK;
    }

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

    private function ckeConfig(Field $ckeField, Field|PlainText|null $outgoingTextField = null): CkeConfig
    {
        $ckeConfigsService = Plugin::getInstance()->getCkeConfigs();

        // if a CKEditor field was chosen to populate the converted field's content, use its CKEditor config
        if ($outgoingTextField instanceof Field && $outgoingTextField->ckeConfig) {
            return $ckeConfigsService->getByUid($outgoingTextField->ckeConfig);
        }

        $ckeConfigs = Collection::make($ckeConfigsService->getAll())
            ->keyBy(fn(CkeConfig $ckeConfig) => StringHelper::slugify($ckeConfig->name))
            ->all();

        // if existing CKEditor configs exist, ask which one they'd like to use
        if (!empty($ckeConfigs)) {
            $name = $this->controller->select('Which CKEditor config should be used for this field?', $ckeConfigs);
            return $ckeConfigs[$name];
        }

        // otherwise, just create one with the default settings plus "New entry" button
        $ckeConfig = new CkeConfig([
            'uid' => StringHelper::UUID(),
            'name' => $ckeField->name,
        ]);
        $ckeConfig->toolbar[] = '|';
        $ckeConfig->toolbar[] = 'createEntry';
        $this->controller->do("Creating a CKEditor config", function() use ($ckeConfigsService, $ckeConfig) {
            if (!$ckeConfigsService->save($ckeConfig)) {
                throw new Exception('Couldn’t save the CKEditor config.');
            }
        });
        return $ckeConfig;
    }
}
