<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor;

use Craft;
use yii\base\Component;
use yii\base\InvalidArgumentException;

/**
 * CKEditor Configs service
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 */
class CkeConfigs extends Component
{
    public const PROJECT_CONFIG_PATH = 'ckeditor.configs';

    /**
     * @return CkeConfig[]
     */
    public function getAll(): array
    {
        $configs = [];
        $configArrs = Craft::$app->getProjectConfig()->get(self::PROJECT_CONFIG_PATH) ?? [];

        foreach ($configArrs as $uid => $configArr) {
            $configs[] = new CkeConfig($configArr + ['uid' => $uid]);
        }

        usort($configs, fn(CkeConfig $a, CkeConfig $b) => $a->name <=> $b->name);
        return $configs;
    }

    /**
     * @throws InvalidArgumentException if $uid is invalid
     */
    public function getByUid(string $uid): CkeConfig
    {
        $config = Craft::$app->getProjectConfig()->get($this->_pcPath($uid));

        if ($config === null) {
            throw new InvalidArgumentException("Invalid CKEditor config UUID: $uid");
        }

        return new CkeConfig($config + ['uid' => $uid]);
    }

    /**
     * @throws InvalidArgumentException if $config doesn’t validate
     */
    public function save(CkeConfig $ckeConfig, bool $runValidation = true): bool
    {
        if ($runValidation && !$ckeConfig->validate()) {
            return false;
        }

        Craft::$app->getProjectConfig()->set($this->_pcPath($ckeConfig->uid), array_filter([
            'name' => $ckeConfig->name,
            'toolbar' => $ckeConfig->toolbar,
            'headingLevels' => $ckeConfig->headingLevels ?: false,
            'options' => $ckeConfig->options,
            'js' => $ckeConfig->js,
            'css' => $ckeConfig->css,
        ], fn($item) => $item !== null));

        return true;
    }

    public function delete(string $uid): void
    {
        Craft::$app->getProjectConfig()->remove($this->_pcPath($uid));
    }

    private function _pcPath(string $uid): string
    {
        return sprintf('%s.%s', self::PROJECT_CONFIG_PATH, $uid);
    }
}
