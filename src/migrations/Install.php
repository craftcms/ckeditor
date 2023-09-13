<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\migrations;

use Craft;
use craft\ckeditor\CkeConfig;
use craft\ckeditor\Plugin;
use craft\db\Migration;
use craft\helpers\StringHelper;

/**
 * Install migration.
 */
class Install extends Migration
{
    /**
     * @inheritdoc
     */
    public function safeUp(): bool
    {
        // Is it being installed for the first time?
        $projectConfigService = Craft::$app->getProjectConfig();
        if (!$projectConfigService->get('plugins.ckeditor', true)) {
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
        // Place uninstallation code here...

        return true;
    }
}
