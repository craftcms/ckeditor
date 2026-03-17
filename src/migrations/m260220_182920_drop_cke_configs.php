<?php

namespace craft\ckeditor\migrations;

use Craft;
use craft\ckeditor\Field;
use craft\db\Migration;
use craft\helpers\ArrayHelper;
use craft\helpers\ProjectConfig;

/**
 * m260220_182920_drop_cke_configs migration.
 */
class m260220_182920_drop_cke_configs extends Migration
{
    /**
     * @inheritdoc
     */
    public function safeUp(): bool
    {
        $projectConfig = Craft::$app->getProjectConfig();
        $fieldConfigs = $projectConfig->find(fn(array $item) => ($item['type'] ?? null) === Field::class);
        $ckeConfigs = $projectConfig->get('ckeditor.configs') ?? [];
        $entriesService = Craft::$app->getEntries();

        foreach ($fieldConfigs as $fieldPath => $fieldConfig) {
            if (empty($fieldConfig['settings'])) {
                continue;
            }

            $settings = ProjectConfig::unpackAssociativeArrays($fieldConfig['settings']);
            $ckeConfigUid = ArrayHelper::remove($settings, 'ckeConfig');
            $expandEntryButtons = ArrayHelper::remove($settings, 'expandEntryButtons') ?? false;

            if ($ckeConfigUid && isset($ckeConfigs[$ckeConfigUid])) {
                $ckeConfig = $ckeConfigs[$ckeConfigUid];
                $toolbar = $ckeConfig['toolbar'] ?? [];

                // anchor → bookmark
                $key = array_search('anchor', $toolbar);
                if ($key !== false) {
                    $toolbar[$key] = 'bookmark';
                }

                if (!empty($settings['entryTypes']) && $expandEntryButtons) {
                    foreach ($settings['entryTypes'] as &$entryTypeConfig) {
                        $entryType = $entriesService->getEntryTypeByUid($entryTypeConfig['uid']);
                        if ($entryType?->icon) {
                            $entryTypeConfig['expanded'] = true;
                        }
                    }
                }

                $settings += [
                    'toolbar' => $toolbar,
                    'headingLevels' => $ckeConfig['headingLevels'] ?? false,
                    'advancedLinkFields' => $ckeConfig['advancedLinkFields'] ?? [],
                    'options' => $ckeConfig['options'] ?? null,
                    'js' => $ckeConfig['js'] ?? null,
                    'css' => $ckeConfig['css'] ?? null,
                    'entryTypes' => $ckeConfigs['entryTypes'] ?? [], // in case m250523_124328_v5_upgrade already ran
                    'fullGraphqlData' => false,
                ];

                // clean up the rest of the settings while we're here
                unset(
                    $settings['initJs'],
                    $settings['removeInlineStyles'],
                    $settings['removeEmptyTags'],
                    $settings['removeNbsp'],
                    $settings['createButtonLabel'],
                    $settings['expandEntryButtons'],
                );
            }

            $fieldConfig['settings'] = $settings;
            $projectConfig->set($fieldPath, $fieldConfig);
        }

        $projectConfig->remove('ckeditor.configs');

        return true;
    }

    /**
     * @inheritdoc
     */
    public function safeDown(): bool
    {
        echo "m260220_182920_drop_cke_configs cannot be reverted.\n";
        return false;
    }
}
