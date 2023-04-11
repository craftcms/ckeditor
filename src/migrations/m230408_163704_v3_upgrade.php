<?php

namespace craft\ckeditor\migrations;

use Craft;
use craft\ckeditor\CkeConfig;
use craft\ckeditor\Plugin;
use craft\db\Migration;
use craft\helpers\StringHelper;

/**
 * m230408_163704_v3_upgrade migration.
 */
class m230408_163704_v3_upgrade extends Migration
{
    /**
     * @inheritdoc
     */
    public function safeUp(): bool
    {
        // Is it being updated for the first time?
        $projectConfigService = Craft::$app->getProjectConfig();
        if (version_compare($projectConfigService->get('plugins.ckeditor.schemaVersion', true), '3.0.0.0', '<')) {
            Plugin::getInstance()->getCkeConfigs()->save(new CkeConfig([
                'uid' => StringHelper::UUID(),
                'name' => 'Simple',
            ]));
        }

        return true;
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
