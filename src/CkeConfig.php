<?php

namespace craft\ckeditor;

use Craft;
use craft\base\Model;
use Illuminate\Support\Collection;
use yii\validators\Validator;

/**
 * CKEditor Config model
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 */
class CkeConfig extends Model
{
    /**
     * @var string|null The configuration UUID
     */
    public ?string $uid = null;

    /**
     * @var string|null The configuration name
     */
    public ?string $name = null;

    /**
     * @var string[] The toolbar configuration
     */
    public array $toolbar = ['heading', '|', 'bold', 'italic', 'link'];

    /**
     * @var string|null JavaScript code that returns additional CKEditor config properties as an object
     */
    public ?string $js = null;

    /**
     * @var string|null CSS styles that should be registered for the field.
     */
    public ?string $css = null;

    public function __construct($config = [])
    {
        if (isset($config['js'])) {
            $config['js'] = trim($config['js']);
            if ($config['js'] === '' || preg_match('/^\{\s*\}$/', $config['js'])) {
                unset($config['js']);
            }
        }

        if (isset($config['css'])) {
            $config['css'] = trim($config['css']);
            if ($config['css'] === '') {
                unset($config['css']);
            }
        }

        parent::__construct($config);
    }

    protected function defineRules(): array
    {
        return [
            ['name', 'trim'],
            [['name', 'toolbar'], 'required'],
            ['name', function(string $attribute, ?array $params, Validator $validator) {
                $duplicateName = Collection::make(Plugin::getInstance()->getCkeConfigs()->getAll())
                    ->contains(fn(CkeConfig $ckeConfig) => (
                        $ckeConfig->name === $this->name &&
                        $ckeConfig->uid !== $this->uid
                    ));
                if ($duplicateName) {
                    $validator->addError($this, $attribute, Craft::t('yii', '{attribute} "{value}" has already been taken.'));
                }
            }],
        ];
    }
}
