<?php

declare(strict_types=1);

use CraftCms\Ckeditor\Field;
use CraftCms\Cms\Database\Migration;
use CraftCms\Cms\Database\Table;
use CraftCms\Cms\ProjectConfig\ProjectConfig;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Upgrades CKEditor data from Craft 5:
 *
 * - renames the stored field type to the new class name
 * - moves CKEditor’s reference tracking into Craft’s field references table, then drops `ckeditor_references`
 */
return new class extends Migration
{
    private const OLD_FIELD_TYPE = 'craft\ckeditor\Field';

    public function up(): void
    {
        $this->renameFieldType();
        $this->moveReferences();
    }

    private function renameFieldType(): void
    {
        DB::table(Table::FIELDS)
            ->where('type', self::OLD_FIELD_TYPE)
            ->update(['type' => Field::class]);

        $projectConfig = app(ProjectConfig::class);
        $muteEvents = $projectConfig->muteEvents;
        $projectConfig->muteEvents = true;

        try {
            $fieldConfigs = $projectConfig->find(fn(array $item) => ($item['type'] ?? null) === self::OLD_FIELD_TYPE);

            foreach (array_keys($fieldConfigs) as $path) {
                $projectConfig->set("$path.type", Field::class);
            }
        } finally {
            $projectConfig->muteEvents = $muteEvents;
        }
    }

    private function moveReferences(): void
    {
        if (!Schema::hasTable('ckeditor_references')) {
            return;
        }

        if (Schema::hasTable(Table::FIELDREFERENCES)) {
            DB::table('ckeditor_references')
                ->select(['fieldId', 'fieldInstanceUid', 'sourceId', 'sourceSiteId', 'targetId'])
                ->orderBy('id')
                ->chunk(500, function(Collection $rows) {
                    DB::table(Table::FIELDREFERENCES)->insertOrIgnore(
                        $rows->map(fn(object $row) => (array)$row)->all(),
                    );
                });
        }

        Schema::drop('ckeditor_references');
    }
};
