<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

namespace CraftCms\Ckeditor\Http\Controllers;

use CraftCms\Ckeditor\Field;
use CraftCms\Cms\Cp\Html\ElementHtml;
use CraftCms\Cms\Support\Arr;
use CraftCms\Cms\Support\Facades\InputNamespace;
use CraftCms\Cms\Support\Json;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use function CraftCms\Cms\template;

/**
 * Field settings controller
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 5.0.0
 */
class FieldSettingsController
{
    /**
     * Returns an entry type chip with its indicators, depending on its config.
     *
     * @param Request $request
     * @param ElementHtml $elementHtml
     * @return JsonResponse
     */
    public function applyEntryTypeIndicators(Request $request, ElementHtml $elementHtml): JsonResponse
    {
        $request->validate(['config' => ['required', 'array']]);
        $config = Arr::only($request->input('config'), ['id', 'uid', 'name', 'handle', 'description', 'group', 'expanded']);

        $entryType = Field::entryType($config);
        abort_unless($entryType, 400, 'Invalid entry type.');

        $chip = $elementHtml->chipHtml($entryType, [
            'inputName' => 'entryTypes[]',
            'inputValue' => Json::encode($entryType->toArray(['id', 'name', 'handle', 'expanded'])),
            'checkbox' => false,
            'showActionMenu' => true,
            'showHandle' => true,
            'showIndicators' => true,
            'hyperlink' => true,
            'sortable' => true,
        ]);

        return new JsonResponse([
            'chip' => $chip,
        ]);
    }

    /**
     * Renders the “Image Field” setting based on the updated entry type selections.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function renderImageField(Request $request): JsonResponse
    {
        $request->validate([
            'namespace' => ['required', 'string'],
            'entryTypes' => ['present'],
        ]);

        $currentValue = $request->input('value');

        $field = new Field();

        if ($currentValue) {
            [$field->imageEntryTypeUid, $field->imageFieldUid] = explode('.', $currentValue, 2);
        }

        $field->setEntryTypes($request->input('entryTypes') ?: []);

        $html = InputNamespace::namespaceInputs(
            fn() => template('ckeditor/_image-field-select.twig', [
                'field' => $field,
            ]),
            $request->input('namespace'),
        );

        return new JsonResponse([
            'html' => $html,
        ]);
    }
}
