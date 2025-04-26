<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace craft\ckeditor;

use Craft;
use craft\base\Actionable;
use craft\base\Chippable;
use craft\base\Model;
use craft\helpers\Json;
use Illuminate\Support\Collection;
use yii\base\InvalidArgumentException;
use yii\validators\Validator;

/**
 * CKEditor Config model
 *
 * @property string|null $json
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 3.0.0
 */
class CkeConfig extends Model implements Chippable, Actionable
{
    public static function get(int|string $id): ?static
    {
        /** @phpstan-ignore-next-line */
        return Plugin::getInstance()->getCkeConfigs()->getByUid($id);
    }

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
     * @var int[]|false The available heading levels
     * @since 3.1.0
     */
    public array|false $headingLevels = [1, 2, 3, 4, 5, 6];

    /**
     * @var array|null Additional CKEditor config options
     * @since 3.1.0
     */
    public ?array $options = null;

    /**
     * @var string|null JavaScript code that returns additional CKEditor config properties as an object
     */
    public ?string $js = null;

    /**
     * @var string|null JSON code that defines additional CKEditor config properties as an object
     * @see getJson()
     * @see setJson()
     * @since 3.1.0
     */
    public ?string $_json = null;

    /**
     * @var string|null CSS styles that should be registered for the field.
     */
    public ?string $css = null;

    public function __construct($config = [])
    {
        if (isset($config['toolbar']) && is_array($config['toolbar'])) {
            // anchor → bookmark
            $key = array_search('anchor', $config['toolbar']);
            if ($key !== false) {
                $config['toolbar'][$key] = 'bookmark';
            }
        }

        if (!array_key_exists('options', $config)) {
            // Only use `json` or `js`, not both
            if (!empty($config['json'])) {
                unset($config['js']);
                $config['json'] = trim($config['json']);
                if ($config['json'] === '' || preg_match('/^\{\s*\}$/', $config['json'])) {
                    unset($config['json']);
                }
            } else {
                unset($config['json']);
                if (isset($config['js'])) {
                    $config['js'] = trim($config['js']);
                    if ($config['js'] === '' || preg_match('/^return\s*\{\s*\}$/', $config['js'])) {
                        unset($config['js']);
                    }
                }
            }
        }

        if (isset($config['css'])) {
            $config['css'] = trim($config['css']);
            if ($config['css'] === '') {
                unset($config['css']);
            }
        }

        unset($config['listPlugin']);

        parent::__construct($config);
    }

    public function getId(): ?string
    {
        return $this->uid;
    }

    public function getUiLabel(): string
    {
        return $this->name;
    }

    public function getActionMenuItems(): array
    {
        $items = [];

        if (
            $this->uid &&
            Craft::$app->getUser()->getIsAdmin() &&
            Craft::$app->getConfig()->getGeneral()->allowAdminChanges
        ) {
            $editId = sprintf('action-edit-%s', mt_rand());
            $items[] = [
                'id' => $editId,
                'icon' => 'edit',
                'label' => Craft::t('app', 'Edit'),
            ];

            $view = Craft::$app->getView();
            $view->registerJsWithVars(fn($id, $params) => <<<JS
$('#' + $id).on('click', () => {
  new Craft.CpScreenSlideout('ckeditor/cke-configs/edit', {
    params: $params,
  });
});
JS, [
                $view->namespaceInputId($editId),
                ['uid' => $this->uid],
            ]);
        }

        return $items;
    }

    public function attributeLabels(): array
    {
        return [
            'name' => Craft::t('app', 'Name'),
            'toolbar' => Craft::t('ckeditor', 'Toolbar'),
            'json' => Craft::t('ckeditor', 'Config Options'),
            'js' => Craft::t('ckeditor', 'Config Options'),
            'css' => Craft::t('ckeditor', 'Custom Styles'),
        ];
    }

    /**
     * @since 3.1.0
     */
    public function hasButton(string $button): bool
    {
        return in_array($button, $this->toolbar, true);
    }

    /**
     * @since 3.1.0
     */
    public function getButtonPos(string $button): int|false
    {
        return array_search($button, $this->toolbar);
    }

    /**
     * @since 3.1.0
     */
    public function addButton(string $button): void
    {
        if ($button === '|' || !$this->hasButton($button)) {
            $this->toolbar[] = $button;
        }
    }

    /**
     * @since 3.1.0
     */
    public function addButtonAt(string $button, int $pos): void
    {
        if ($button === '|' || !$this->hasButton($button)) {
            array_splice($this->toolbar, $pos, 0, [$button]);
        }
    }

    /**
     * @since 3.1.0
     */
    public function addButtonBefore(string $button, string $after): void
    {
        $afterPos = $this->getButtonPos($after);
        if ($afterPos !== false) {
            $this->addButtonAt($button, $afterPos);
        } else {
            $this->addButton($button);
        }
    }

    /**
     * @since 3.1.0
     */
    public function addButtonAfter(string $button, string $after): void
    {
        $afterPos = $this->getButtonPos($after);
        if ($afterPos !== false) {
            $this->addButtonAt($button, $afterPos + 1);
        } else {
            $this->addButton($button);
        }
    }

    /**
     * @since 3.1.0
     */
    public function removeButton(string $button): void
    {
        $pos = $this->getButtonPos($button);
        if ($pos !== false) {
            array_splice($this->toolbar, $pos, 1);
            $this->toolbar = array_values($this->toolbar);
        }
    }

    /**
     * @since 3.1.0
     */
    public function getJson(): ?string
    {
        if (!isset($this->_json)) {
            if (isset($this->options)) {
                $json = Json::encode($this->options, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                $this->_json = str_replace('    ', '  ', $json);
            }
        }
        return $this->_json;
    }

    /**
     * @since 3.1.0
     */
    public function setJson(?string $json): void
    {
        $this->_json = $json;

        try {
            $this->options = Json::decode($json);
        } catch (InvalidArgumentException) {
            $this->options = null;
        }
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
            [
                'json',
                function(string $attribute, ?array $params, Validator $validator) {
                    try {
                        $this->options = Json::decode($this->_json);
                    } catch (InvalidArgumentException) {
                        $validator->addError($this, $attribute, Craft::t('ckeditor', '{attribute} isn’t valid JSON.'));
                        return;
                    }
                },
                'when' => fn() => isset($this->_json),
            ],
        ];
    }
}
