<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace CraftCms\Ckeditor\Console\Commands;

use CraftCms\Ckeditor\Field;
use CraftCms\Cms\Console\CraftCommand;
use CraftCms\Cms\Database\Migrator;
use CraftCms\Cms\Element\Enums\PropagationMethod;
use CraftCms\Cms\Entry\Data\EntryType;
use CraftCms\Cms\Field\Contracts\FieldInterface;
use CraftCms\Cms\Field\Enums\TranslationMethod;
use CraftCms\Cms\Field\Fields;
use CraftCms\Cms\Field\Matrix;
use CraftCms\Cms\Field\PlainText;
use CraftCms\Cms\Support\Facades\EntryTypes;
use CraftCms\Cms\Support\Facades\Markdown;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;
use RuntimeException;

use function Laravel\Prompts\confirm;
use function Laravel\Prompts\select;

/**
 * Converts a Matrix field to CKEditor.
 *
 * @since 6.0.0
 */
class ConvertMatrixCommand extends Command
{
    use CraftCommand;

    #[\Override]
    protected $signature = 'ckeditor:convert:matrix {fieldHandle : The handle of the Matrix field to convert.}';

    #[\Override]
    protected $description = 'Converts a Matrix field to CKEditor.';

    #[\Override]
    protected $aliases = ['ckeditor/convert/matrix'];

    /**
     * Runs the command.
     */
    public function handle(Fields $fieldsService, Migrator $migrator): int
    {
        if (!$this->input->isInteractive()) {
            $this->components->error('This command must be run interactively.');
            return self::FAILURE;
        }

        $fieldHandle = $this->argument('fieldHandle');
        $matrixField = $fieldsService->getFieldByHandle($fieldHandle);

        if (!$matrixField) {
            $this->components->error("Invalid field handle: $fieldHandle");
            return self::FAILURE;
        }

        if (!$matrixField instanceof Matrix) {
            $this->components->error("“{$matrixField->name}” is not a Matrix field.");
            return self::FAILURE;
        }

        // we have the matrix field, let's set up the basics for the CKE field
        $htmlEntryType = $this->htmlEntryType($matrixField);
        if ($htmlEntryType === false) {
            $this->components->warn('Field conversion aborted.');
            return self::SUCCESS;
        }

        [$htmlField, $markdownFlavor, $preserveHtmlEntries] = $this->prepareContentPopulation($htmlEntryType);

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
                PropagationMethod::None => TranslationMethod::Site,
                PropagationMethod::SiteGroup => TranslationMethod::SiteGroup,
                PropagationMethod::Language => TranslationMethod::Language,
                PropagationMethod::Custom => TranslationMethod::Custom,
                default => TranslationMethod::None,
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

        $this->components->task("Saving the `$ckeField->name` field", function() use ($fieldsService, $ckeField) {
            if (!$fieldsService->saveField($ckeField)) {
                throw new RuntimeException('Couldn’t save the field.');
            }
        });

        $migrationName = sprintf('%s_convert_%s_to_ckeditor', now('UTC')->format('Y_m_d_His'), $ckeField->handle);
        $migrationPath = database_path("migrations/$migrationName.php");

        $this->components->task('Generating the content migration', function() use (
            $ckeField,
            $htmlEntryType,
            $htmlField,
            $markdownFlavor,
            $preserveHtmlEntries,
            $migrationPath,
        ) {
            ob_start();
            File::getRequire(dirname(__DIR__, 3) . '/resources/stubs/convert-matrix-migration.php.stub', [
                'ckeFieldUid' => $ckeField->uid,
                'htmlEntryTypeUid' => $htmlEntryType?->uid,
                'htmlFieldUid' => $htmlField?->layoutElement->uid,
                'markdownFlavor' => $markdownFlavor,
                'preserveHtmlEntries' => $preserveHtmlEntries,
            ]);
            File::put($migrationPath, ob_get_clean());
        });

        // Field layouts memoize their field instances, so make sure the content migration gets the CKEditor field
        $fieldsService->refreshFields();
        EntryTypes::refreshEntryTypes();

        $this->components->info('Running the content migration …');
        $migrator->track('content')->run();

        $this->components->success(sprintf(
            'Field converted to CKEditor. Commit `%s` and your project config changes, and run `php artisan craft:migrate:all` on other environments for the changes to take effect.',
            str_replace(base_path() . DIRECTORY_SEPARATOR, '', $migrationPath),
        ));

        return self::SUCCESS;
    }

    /**
     * Returns the entry type HTML content should be extracted from, `null` for none, or `false` if the user aborted.
     */
    private function htmlEntryType(Matrix $matrixField): EntryType|false|null
    {
        // look for entry types that have a CKEditor or Plain Text field
        /** @var Collection<string,EntryType> $eligibleEntryTypes */
        $eligibleEntryTypes = Collection::make($matrixField->getEntryTypes())
            ->filter(fn(EntryType $entryType) => Collection::make($entryType->getFieldLayout()->getCustomFields())
                ->contains(fn(FieldInterface $field) => $field instanceof Field || $field instanceof PlainText))
            ->keyBy(fn(EntryType $entryType) => $entryType->handle);

        if ($eligibleEntryTypes->isEmpty()) {
            $this->components->warn("`$matrixField->name` doesn’t have any entry types with CKEditor/Plain Text fields.");
            return confirm('Continue anyway?', true) ? null : false;
        }

        $choice = select(
            'Which entry type should HTML content be extracted from?',
            [
                ...$eligibleEntryTypes->map(fn(EntryType $entryType) => "$entryType->name ($entryType->handle)")->all(),
                'none' => 'None',
            ],
            $eligibleEntryTypes->count() === 1 ? $eligibleEntryTypes->keys()->first() : null,
        );

        return $choice === 'none' ? null : $eligibleEntryTypes->get($choice);
    }

    /**
     * @return array{0:Field|PlainText|null,1:string,2:bool}
     */
    private function prepareContentPopulation(?EntryType $htmlEntryType): array
    {
        if (!$htmlEntryType) {
            return [null, 'none', false];
        }

        $customFields = $htmlEntryType->getFieldLayout()->getCustomFields();
        $htmlField = $this->htmlField($customFields);

        if ($htmlField instanceof PlainText) {
            $flavors = Markdown::flavors();
            $markdownFlavor = select(
                "Which Markdown flavor should `$htmlField->name` fields be parsed with?",
                [...array_combine($flavors, $flavors), 'none' => 'none'],
                in_array('original', $flavors, true) ? 'original' : null,
            );
        } else {
            $markdownFlavor = 'none';
        }

        $preserveHtmlEntries = count($customFields) !== 1 &&
            confirm("Preserve `$htmlEntryType->name` entries alongside their extracted HTML?", false);

        return [$htmlField, $markdownFlavor, $preserveHtmlEntries];
    }

    private function htmlField(array $customFields): Field|PlainText
    {
        /** @var Collection<string,Field|PlainText> $eligibleFields */
        $eligibleFields = Collection::make($customFields)
            ->filter(fn(FieldInterface $field) => $field instanceof Field || $field instanceof PlainText)
            ->keyBy(fn(Field|PlainText $field) => $field->handle);

        if ($eligibleFields->count() === 1) {
            return $eligibleFields->first();
        }

        $choice = select(
            'Which custom field?',
            $eligibleFields->map(fn(Field|PlainText $field) => "$field->name ($field->handle)")->all(),
        );

        return $eligibleFields->get($choice);
    }
}
