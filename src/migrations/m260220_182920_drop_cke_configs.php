<?php

namespace craft\ckeditor\migrations;

use Craft;
use craft\ckeditor\Field;
use craft\db\Migration;
use craft\db\Query;
use craft\db\Table;
use craft\helpers\App;
use craft\helpers\ArrayHelper;
use craft\helpers\FileHelper;
use craft\helpers\Json;
use craft\helpers\ProjectConfig;
use Throwable;

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

        // Don't make the same changes twice
        $schemaVersion = $projectConfig->get('plugins.ckeditor.schemaVersion', true);
        if (version_compare($schemaVersion, '5.0.0.1', '>=')) {
            return true;
        }

        $fieldConfigs = $projectConfig->find(fn(array $item) => ($item['type'] ?? null) === Field::class);
        $ckeConfigs = $projectConfig->get('ckeditor.configs') ?? [];
        $entriesService = Craft::$app->getEntries();

        // Create config JS/JSON and CSS files, for any configs that are used by 2+ fields
        $configCounts = [];
        $configBaseNames = [];
        foreach ($fieldConfigs as $fieldPath => &$fieldConfig) {
            if (empty($fieldConfig['settings'])) {
                continue;
            }

            $fieldConfig['settings'] = ProjectConfig::unpackAssociativeArrays($fieldConfig['settings']);

            // if we've already lost the ckeConfig and we have some new properties (e.g. toolbar)
            // we need to get the "old" field's settings directly from the database (not from the memoized array)
            if (!isset($fieldConfig['settings']['ckeConfig']) && isset($fieldConfig['settings']['toolbar'])) {
                $fieldUid = str_replace('fields.', '', $fieldPath);
                $fieldConfig['settings'] = $this->getOldFieldSettings($fieldUid) ?? $fieldConfig['settings'];
            }

            if (!isset($fieldConfig['settings']['ckeConfig'])) {
                continue;
            }

            if (!isset($configCounts[$fieldConfig['settings']['ckeConfig']])) {
                $configCounts[$fieldConfig['settings']['ckeConfig']] = 1;
            } else {
                $configCounts[$fieldConfig['settings']['ckeConfig']]++;
            }
        }
        unset($fieldConfig);
        
        if (!App::isEphemeral()) {
            foreach ($configCounts as $ckeConfigUid => $count) {
                if ($count < 2 || !isset($ckeConfigs[$ckeConfigUid])) {
                    continue;
                }

                $ckeConfig = &$ckeConfigs[$ckeConfigUid];
                $baseName = str_replace(' ', '-', $ckeConfig['name'] ?? $ckeConfigUid);
                if (isset($configBaseNames[$baseName])) {
                    $baseName .= sprintf('-%s', mt_rand());
                }
                $configBaseNames[$baseName] = true;

                if (isset($ckeConfig['options']) || isset($ckeConfig['js'])) {
                    if (isset($ckeConfig['options'])) {
                        $file = "$baseName.json";
                        Json::encodeToFile(Field::configFilePath($file), $ckeConfig['options']);
                    } else {
                        $file = "$baseName.js";
                        FileHelper::writeToFile(Field::configFilePath($file), $ckeConfig['js']);
                    }

                    $ckeConfig['jsFile'] = $file;
                    unset($ckeConfig['options'], $ckeConfig['js']);
                }

                if (isset($ckeConfig['css'])) {
                    $file = "$baseName.css";
                    FileHelper::writeToFile(Field::configFilePath($file), $ckeConfig['css']);
                    $ckeConfig['cssFile'] = $file;
                    unset($ckeConfig['css']);
                }

                unset($ckeConfig);
            }
        }

        // Now update the field settings
        foreach ($fieldConfigs as $fieldPath => $fieldConfig) {
            if (empty($fieldConfig['settings'])) {
                continue;
            }

            $settings = $fieldConfig['settings'];
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
                    'jsFile' => $ckeConfig['jsFile'] ?? null,
                    'css' => $ckeConfig['css'] ?? null,
                    'cssFile' => $ckeConfig['cssFile'] ?? null,
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

    private function getOldFieldSettings(string $fieldUid): ?array
    {
        $settings = (new Query())
            ->select('settings')
            ->from(['fields' => Table::FIELDS])
            ->where(['uid' => $fieldUid])
            ->scalar();

        if ($settings) {
            try {
                return Json::decode($settings);
            } catch (Throwable $e) {
                // fail silently
            }
        }

        return null;
    }
}
