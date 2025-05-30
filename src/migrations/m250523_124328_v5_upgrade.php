<?php

namespace craft\ckeditor\migrations;

use Craft;
use craft\ckeditor\CkeConfigs;
use craft\ckeditor\Field;
use craft\ckeditor\Plugin;
use craft\db\Migration;
use craft\helpers\ProjectConfig;
use craft\helpers\StringHelper;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

/**
 * m250523_124328_v5_upgrade migration.
 */
class m250523_124328_v5_upgrade extends Migration
{
    /**
     * @inheritdoc
     */
    public function safeUp(): bool
    {
        // get all CKE fields grouped by the cke config they use; keyed by the cke config uid
        $fieldsByConfig = Collection::make(Craft::$app->getFields()->getFieldsByType(Field::class))
            /** @phpstan-ignore-next-line */
            ->groupBy(fn(Field $field) => $field->ckeConfig);

        $projectConfig = Craft::$app->getProjectConfig();

        /** @var Collection<Field[]> $fields **/
        foreach ($fieldsByConfig->all() as $ckeConfigUid => $fields) {
            // if there's only one field that uses this config
            if ($fields->count() == 1) {
                $this->updateConfigs($ckeConfigUid, $fields[0]);
            } else {
                // key fields by field uid
                $fields = $fields->keyBy('uid');
                $fieldEntryTypeConfigs = [];
                foreach ($fields as $field) {
                    // compare entry types for each field
                    $pcFieldConfig = $projectConfig->get($projectConfig::PATH_FIELDS . '.' . $field->uid);
                    $fieldEntryTypeConfigs[$field->uid] = ProjectConfig::unpackAssociativeArrays($pcFieldConfig['settings']['entryTypes']);
                    $fieldEntryTypeConfigs[$field->uid]['expandEntryButtons'] = $pcFieldConfig['settings']['expandEntryButtons'];
                }
                // get the list of the unique entry types configs
                $uniqueFieldEntryTypeConfigs = Collection::make($fieldEntryTypeConfigs)
                    ->uniqueStrict()
                    ->values();

                // if all the fields share the same config
                if ($uniqueFieldEntryTypeConfigs->count() == 1) {
                    // update that config and all the fields
                    foreach ($fields as $field) {
                        // todo: could/should we only update the cke config once and field config for each field, in this case
                        $this->updateConfigs($field->ckeConfig, $field);
                    }
                } else {
                    // otherwise
                    foreach ($uniqueFieldEntryTypeConfigs as $key => $uniqueFieldEntryTypeConfig) {
                        // get all the fields that use each unique config
                        $fieldsForThisConfig = Arr::where(
                            $fieldEntryTypeConfigs,
                            fn($fieldEntryTypeConfig) => $fieldEntryTypeConfig === $uniqueFieldEntryTypeConfig
                        );

                        // get the CKE config by UID
                        $ckeConfig = Plugin::getInstance()->getCkeConfigs()->getByUid($ckeConfigUid);

                        // if it's not the first group of fields, we need to duplicate the config
                        if ($key > 0) {
                            // duplicate cke config
                            $duplicatedCkeConfig = clone $ckeConfig;
                            $duplicatedCkeConfig->uid = StringHelper::UUID();
                            $duplicatedCkeConfig->name .= ' ' . ($key + 1);
                            Plugin::getInstance()->getCkeConfigs()->save($duplicatedCkeConfig);
                        } else {
                            $duplicatedCkeConfig = $ckeConfig;
                        }

                        // update the configs for each field
                        foreach ($fieldsForThisConfig as $fieldUid => $config) {
                            /** @var Field $field */
                            $field = $fields[$fieldUid];
                            $this->updateConfigs($duplicatedCkeConfig->uid, $field);

                            // if it's not the first group of fields, update each field with the duplicated CKE config uid
                            if ($key > 0) {
                                // update the field to use the new duplicate
                                $field->ckeConfig = $duplicatedCkeConfig->uid;
                                Craft::$app->getFields()->saveField($field);
                            }
                        }
                    }
                }
            }
        }

        return true;
    }

    /**
     * @inheritdoc
     */
    public function safeDown(): bool
    {
        echo "m250523_124328_v5_upgrade cannot be reverted.\n";
        return false;
    }

    private function updateConfigs(string $ckeConfigUid, Field $field): void
    {
        $projectConfig = Craft::$app->getProjectConfig();

        // move the entry types from field to the config
        $pcCkeConfig = $projectConfig->get(CkeConfigs::PROJECT_CONFIG_PATH . '.' . $ckeConfigUid);
        $pcFieldConfig = $projectConfig->get($projectConfig::PATH_FIELDS . '.' . $field->uid);

        $entryTypesConfig = ProjectConfig::unpackAssociativeArrays($pcFieldConfig['settings']['entryTypes']);
        $pcCkeConfig['entryTypes'] = $entryTypesConfig;
        unset($pcFieldConfig['settings']['entryTypes']);

        if ($pcFieldConfig['settings']['expandEntryButtons']) {
            foreach ($entryTypesConfig as $key => $item) {
                try {
                    $entryType = Craft::$app->getEntries()->getEntryType($item['uid']);
                    if ($entryType->getIcon() !== null) {
                        // mark as expanded
                        $entryTypesConfig[$key]['expanded'] = true;
                    }
                    // otherwise, the default expanded => false will be used
                } catch (\Throwable $e) {
                    // if something went wrong, the default expanded => false will be used
                }
            }
            $pcCkeConfig['entryTypes'] = $entryTypesConfig;
        }
        unset($pcFieldConfig['settings']['expandEntryButtons']);

        $projectConfig->set(sprintf('%s.%s', CkeConfigs::PROJECT_CONFIG_PATH, $ckeConfigUid), $pcCkeConfig);
        $projectConfig->set(sprintf('%s.%s', $projectConfig::PATH_FIELDS, $field->uid), $pcFieldConfig);
    }
}
