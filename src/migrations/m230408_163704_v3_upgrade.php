<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\migrations;

use Craft;
use craft\ckeditor\CkeConfig;
use craft\ckeditor\Field;
use craft\ckeditor\Plugin;
use craft\db\Migration;
use craft\helpers\StringHelper;
use craft\services\ProjectConfig;

/**
 * m230408_163704_v3_upgrade migration.
 */
class m230408_163704_v3_upgrade extends Migration
{
    private ProjectConfig $projectConfig;
    private string $uid;

    /**
     * @inheritdoc
     */
    public function safeUp(): bool
    {
        // Is it being updated for the first time?
        $this->projectConfig = Craft::$app->getProjectConfig();
        if (version_compare($this->projectConfig->get('plugins.ckeditor.schemaVersion', true), '3.0.0.0', '<')) {
            $this->uid = StringHelper::UUID();
            Plugin::getInstance()->getCkeConfigs()->save(new CkeConfig([
                'uid' => $this->uid,
                'name' => 'Simple',
            ]));

            $config = $this->projectConfig->get();
            if (is_array($config)) {
                $this->updateConfig($config, '');
            }
        }

        return true;
    }

    private function updateConfig(array $config, string $path): void
    {
        if (isset($config['type']) && $config['type'] === Field::class) {
            // found one
            unset($config['settings']['initJs']);
            $config['settings']['ckeConfig'] = $this->uid;
            $this->projectConfig->set($path, $config);
        } else {
            // keep looking
            foreach ($config as $key => $value) {
                if (is_array($value)) {
                    $this->updateConfig($value, ($path ? "$path." : '') . $key);
                }
            }
        }
    }

    /**
     * @inheritdoc
     */
    public function safeDown(): bool
    {
        echo "m230408_163704_v3_upgrade cannot be reverted.\n";
        return false;
    }
}
