<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\console\actions;

use Craft;
use craft\base\FieldInterface;
use craft\ckeditor\console\controllers\ConvertController;
use craft\ckeditor\Field;
use craft\enums\PropagationMethod;
use craft\errors\OperationAbortedException;
use craft\fields\Matrix;
use craft\fields\PlainText;
use craft\helpers\Console;
use craft\helpers\FileHelper;
use craft\models\EntryType;
use Illuminate\Support\Collection;
use yii\base\Action;
use yii\base\Exception;
use yii\console\ExitCode;
use yii\helpers\Markdown;

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
            $this->controller->stderr("This command must be run interactively.\n");
            return ExitCode::UNSPECIFIED_ERROR;
        }

        $fieldsService = Craft::$app->getFields();
        $matrixField = $fieldsService->getFieldByHandle($fieldHandle);

        if (!$matrixField) {
            $this->controller->stdout("Invalid field handle: $fieldHandle\n", Console::FG_RED);
            return ExitCode::UNSPECIFIED_ERROR;
        }

        if (!$matrixField instanceof Matrix) {
            // otherwise, ensure we're dealing with a matrix field
            $this->controller->stdout("“{$matrixField->name}” is not a Matrix field.\n", Console::FG_RED);
            return ExitCode::UNSPECIFIED_ERROR;
        }

        // we have the matrix field, let's set up the basics for the CKE field
        try {
            /** @var EntryType|null $htmlEntryType */
            /** @var Field|PlainText|null $htmlField */
            /** @var string $markdownFlavor */
            /** @var bool $preserveHtmlEntries */
            [$htmlEntryType, $htmlField, $markdownFlavor, $preserveHtmlEntries] = $this->prepareContentPopulation($matrixField);
        } catch (OperationAbortedException) {
            $this->controller->stdout("Field conversion aborted.\n", Console::FG_YELLOW);
            return ExitCode::OK;
        }

        $this->controller->stdout("\n");

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

        if ($htmlField instanceof Field) {
            // copy over its settings
            $ckeField->toolbar = $htmlField->toolbar;
            $ckeField->headingLevels = $htmlField->headingLevels;
            $ckeField->advancedLinkFields = $htmlField->advancedLinkFields;
            $ckeField->options = $htmlField->options;
            $ckeField->js = $htmlField->js;
            $ckeField->css = $htmlField->css;
        }

        // ensure the CKEditor config has a "New entry" button
        if (!in_array('createEntry', $ckeField->toolbar)) {
            if (!empty($ckeField->toolbar)) {
                $ckeField->toolbar[] = '|';
            }
            $ckeField->toolbar[] = 'createEntry';
        }

        $this->controller->do("Saving the `$ckeField->name` field", function() use ($fieldsService, $ckeField) {
            if (!$fieldsService->saveField($ckeField)) {
                throw new Exception('Couldn’t save the field.');
            }
        });

        $contentMigrator = Craft::$app->getContentMigrator();
        $migrationName = sprintf('m%s_convert_%s_to_ckeditor', gmdate('ymd_His'), $ckeField->handle);
        $migrationPath = "$contentMigrator->migrationPath/$migrationName.php";

        $this->controller->do("Generating the content migration", function() use (
            $ckeField,
            $htmlEntryType,
            $htmlField,
            $markdownFlavor,
            $preserveHtmlEntries,
            $migrationName,
            $migrationPath,
        ) {
            $content = $this->controller->getView()->renderFile(__DIR__ . '/convert-matrix-migration.php.template', [
                'namespace' => Craft::$app->getContentMigrator()->migrationNamespace,
                'className' => $migrationName,
                'ckeFieldUid' => $ckeField->uid,
                'htmlEntryTypeUid' => $htmlEntryType?->uid,
                'htmlFieldUid' => $htmlField?->layoutElement->uid,
                'markdownFlavor' => $markdownFlavor,
                'preserveHtmlEntries' => $preserveHtmlEntries,
            ], $this);
            FileHelper::writeToFile($migrationPath, $content);
        });

        $this->controller->stdout(" → Running the content migration …\n");
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
        $htmlEntryType = $this->htmlEntryType($matrixField);
        if (!$htmlEntryType) {
            return [null, null, 'none', false];
        }

        $customFields = $htmlEntryType->getFieldLayout()->getCustomFields();
        $htmlField = $this->htmlField($customFields);

        if ($htmlField instanceof PlainText) {
            $flavors = array_keys(Markdown::$flavors);
            $markdownFlavor = $this->controller->select(
                $this->controller->markdownToAnsi("Which Markdown flavor should `$htmlField->name` fields be parsed with?"),
                [...array_combine($flavors, $flavors), 'none'],
                'original',
            );
        } else {
            $markdownFlavor = 'none';
        }

        if (count($customFields) === 1) {
            $preserveHtmlEntries = false;
        } else {
            $preserveHtmlEntries = $this->controller->confirm($this->controller->markdownToAnsi("Preserve `$htmlEntryType->name` entries alongside their extracted HTML?"));
        }

        return [$htmlEntryType, $htmlField, $markdownFlavor, $preserveHtmlEntries];
    }

    private function htmlEntryType(Matrix $matrixField): ?EntryType
    {
        $entryTypes = Collection::make($matrixField->getEntryTypes());

        // look for entry types that have a CKEditor or Plain Text field
        /** @var Collection<EntryType> $eligibleEntryTypes */
        $eligibleEntryTypes = $entryTypes
            ->filter(function(EntryType $entryType) {
                foreach ($entryType->getFieldLayout()->getCustomFields() as $field) {
                    if ($field instanceof Field || $field instanceof PlainText) {
                        return true;
                    }
                }
                return false;
            })
            ->keyBy(fn(EntryType $entryType) => $entryType->handle);

        if ($eligibleEntryTypes->isEmpty()) {
            $this->controller->warning("`$matrixField->name` doesn’t have any entry types with CKEditor/Plain Text fields.");
            if (!$this->controller->confirm('Continue anyway?', true)) {
                throw new OperationAbortedException();
            }
            return null;
        }

        $this->controller->stdout("Which entry type should HTML content be extracted from?\n\n");

        foreach ($eligibleEntryTypes as $entryType) {
            $this->controller->stdout(sprintf(" - %s\n", $this->controller->markdownToAnsi("`$entryType->handle` ($entryType->name)")));
        }

        $this->controller->stdout("\n");
        $choice = $this->controller->select('Choose:', [
            ...$eligibleEntryTypes->map(fn(EntryType $entryType) => $entryType->name)->all(),
            'none' => 'None',
        ], $eligibleEntryTypes->count() === 1 ? $eligibleEntryTypes->keys()->first() : null);
        if ($choice === 'none') {
            return null;
        }
        return $eligibleEntryTypes->get($choice);
    }

    private function htmlField(array $customFields): Field|PlainText
    {
        /** @var Collection<Field|PlainText> $eligibleFields */
        $eligibleFields = Collection::make($customFields)
            ->filter(fn(FieldInterface $field) => $field instanceof Field || $field instanceof PlainText)
            ->keyBy(fn(Field|PlainText $field) => $field->handle);

        if ($eligibleFields->count() === 1) {
            return $eligibleFields->first();
        }

        $this->controller->stdout("Which custom field?\n\n");

        foreach ($eligibleFields as $field) {
            $this->controller->stdout(sprintf(" - %s\n", $this->controller->markdownToAnsi("`$field->handle` ($field->name)")));
        }

        $this->controller->stdout("\n");
        $choice = $this->controller->select('Choose:', $eligibleFields->map(fn(Field|PlainText $field) => $field->name)->all());
        return $eligibleFields->get($choice);
    }
}
