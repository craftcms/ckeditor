<?php

/**
 * @link https://craftcms.com/
 *
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

declare(strict_types=1);

namespace CraftCms\Ckeditor;

use CraftCms\Cms\Plugin\PluginSettings;
use CraftCms\Cms\Support\Env;

/**
 * CKEditor plugin settings.
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 *
 * @since 5.10.0
 */
class Settings extends PluginSettings
{
    /**
     * @var string|null A commercial CKEditor license key, which can be set to an environment variable (e.g. `$CKEDITOR_LICENSE_KEY`).
     *
     * If not set, CKEditor will be used under the GPL license.
     */
    public ?string $licenseKey = null;

    /**
     * Returns the parsed CKEditor license key.
     */
    public function getLicenseKey(): ?string
    {
        return Env::parse($this->licenseKey) ?: null;
    }
}
