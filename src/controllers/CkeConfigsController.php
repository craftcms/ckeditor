<?php

namespace craft\ckeditor\controllers;

use Craft;
use craft\ckeditor\CkeConfig;
use craft\ckeditor\helpers\CkeditorConfigSchema;
use craft\ckeditor\Plugin;
use craft\ckeditor\web\assets\ckeconfig\CkeConfigAsset;
use craft\helpers\StringHelper;
use craft\web\assets\admintable\AdminTableAsset;
use craft\web\Controller;
use craft\web\CpScreenResponseBehavior;
use yii\base\InvalidArgumentException;
use yii\web\NotFoundHttpException;
use yii\web\Response;

/**
 * Assets controller
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 3.0.0
 */
class CkeConfigsController extends Controller
{
    public function beforeAction($action): bool
    {
        if (!parent::beforeAction($action)) {
            return false;
        }

        $this->requireAdmin();
        return true;
    }

    public function actionIndex(): Response
    {
        $ckeConfigs = Plugin::getInstance()->getCkeConfigs()->getAll();

        $this->view->registerAssetBundle(AdminTableAsset::class);

        return $this->renderTemplate('ckeditor/cke-configs/_index', [
            'ckeConfigs' => $ckeConfigs,
        ]);
    }

    public function actionEdit(?CkeConfig $ckeConfig = null, ?string $uid = null): Response
    {
        if (!$ckeConfig) {
            if ($uid !== null) {
                try {
                    $ckeConfig = Plugin::getInstance()->getCkeConfigs()->getByUid($uid);
                } catch (InvalidArgumentException $e) {
                    throw new NotFoundHttpException($e->getMessage());
                }
            } else {
                $ckeConfig = new CkeConfig();
            }
        }

        if ($ckeConfig->name) {
            $title = $ckeConfig->name;
        } elseif ($ckeConfig->uid) {
            $title = Craft::t('ckeditor', 'Edit CKEditor Config');
        } else {
            $title = Craft::t('ckeditor', 'Create a new CKEditor config');
        }

        return $this->asCpScreen()
            ->action('ckeditor/cke-configs/save')
            ->altActions([
                [
                    'label' => Craft::t('app', 'Save and continue editing'),
                    'action' => 'ckeditor/cke-configs/save',
                    'params' => ['continueEditing' => true],
                    'shortcut' => true,
                ],
            ])
            ->addCrumb(Craft::t('app', 'Settings'), 'settings')
            ->addCrumb(Craft::t('ckeditor', 'CKEditor Configs'), 'settings/ckeditor')
            ->title($title)
            ->prepareScreen(function(Response $response) use ($ckeConfig) {
                $jsonSchemaUri = sprintf('https://craft-code-editor.com/%s', $this->view->namespaceInputId('config-options-json'));
                /** @var Response|CpScreenResponseBehavior $response */
                $response->contentTemplate('ckeditor/cke-configs/_edit.twig', [
                    'ckeConfig' => $ckeConfig,
                    'jsonSchema' => CkeditorConfigSchema::create(),
                    'jsonSchemaUri' => $jsonSchemaUri,
                ]);

                $this->view->registerAssetBundle(CkeConfigAsset::class);
                $this->view->registerJsWithVars(
                    fn(
                        $toolbarBuilderId,
                        $configOptionsId,
                        $jsonSchemaUri,
                    ) => <<<JS
const configOptions = new CKEditor5.craftcms.ConfigOptions($configOptionsId, $jsonSchemaUri);
new CKEditor5.craftcms.ToolbarBuilder($toolbarBuilderId, configOptions);
JS,
                    [
                        $this->view->namespaceInputId('toolbar-builder'),
                        $this->view->namespaceInputId('config-options'),
                        $jsonSchemaUri,
                    ],
                );
            });
    }

    public function actionSave(): ?Response
    {
        $this->requirePostRequest();

        $headingLevels = $this->request->getBodyParam('headingLevels') ?: false;
        if ($headingLevels) {
            $headingLevels = array_map(fn(string $level) => (int)$level, $headingLevels);
        }

        $ckeConfig = new CkeConfig([
            'uid' => $this->request->getBodyParam('uid') ?? StringHelper::UUID(),
            'name' => $this->request->getBodyParam('name'),
            'toolbar' => $this->request->getBodyParam('toolbar'),
            'headingLevels' => $headingLevels,
            'json' => $this->request->getBodyParam('json'),
            'js' => $this->request->getBodyParam('js'),
            'css' => $this->request->getBodyParam('css'),
        ]);

        if (!Plugin::getInstance()->getCkeConfigs()->save($ckeConfig)) {
            return $this->asModelFailure(
                $ckeConfig,
                Craft::t('ckeditor', 'Couldn’t save CKEditor config.'),
                'ckeConfig',
            );
        }

        $redirectUrl = 'settings/ckeditor';
        if ($this->request->getBodyParam('continueEditing')) {
            $redirectUrl .= '/' . $ckeConfig->uid;
        }

        return $this->asModelSuccess(
            $ckeConfig,
            Craft::t('ckeditor', 'CKEditor config saved.'),
            'ckeConfig',
            redirect: $redirectUrl,
        );
    }

    public function actionDelete(): Response
    {
        // todo: ideally the VueAdminTable can post a `uid` param
        $uid = $this->request->getBodyParam('uid') ?? $this->request->getBodyParam('id');
        Plugin::getInstance()->getCkeConfigs()->delete($uid);
        return $this->asSuccess(Craft::t('ckeditor', 'CKEditor config deleted.'));
    }
}
