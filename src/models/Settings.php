<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor\models;

use craft\base\Model;
use craft\helpers\App;

/**
 * CKEditor plugin settings.
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 5.10.0
 */
class Settings extends Model
{
    /**
     * @var string|null A commercial CKEditor license key, which can be set to an environment variable (e.g. `$CKEDITOR_LICENSE_KEY`).
     *
     * If not set, CKEditor will be used under the GPL license.
     */
    public ?string $licenseKey = null;

    /**
     * Returns the parsed CKEditor license key.
     *
     * @return string|null
     */
    public function getLicenseKey(): ?string
    {
        return App::parseEnv($this->licenseKey) ?: null;
    }
}
