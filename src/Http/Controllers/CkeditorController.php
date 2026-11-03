<?php

/**
 * @link https://craftcms.com/
 *
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

declare(strict_types=1);

namespace CraftCms\Ckeditor\Http\Controllers;

use CraftCms\Ckeditor\Field;
use CraftCms\Ckeditor\Ui\Controls\CkeditorControl;
use CraftCms\Cms\Asset\AssetsHelper;
use CraftCms\Cms\Asset\Elements\Asset;
use CraftCms\Cms\Element\Contracts\ElementInterface;
use CraftCms\Cms\Element\ElementHelper;
use CraftCms\Cms\Element\Validation\ElementRules;
use CraftCms\Cms\Entry\Elements\Entry;
use CraftCms\Cms\FieldLayout\LayoutElements\CustomField;
use CraftCms\Cms\Http\Controllers\App\RenderController;
use CraftCms\Cms\Http\RespondsWithFlash;
use CraftCms\Cms\Support\Facades\Assets;
use CraftCms\Cms\Support\Facades\Elements;
use CraftCms\Cms\Support\Facades\Fields;
use CraftCms\Cms\Support\Facades\HtmlStack;
use CraftCms\Cms\User\Elements\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

use function CraftCms\Cms\currentUserElement;
use function CraftCms\Cms\t;

/**
 * CKEditor controller
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 *
 * @since 3.4.0
 */
class CkeditorController
{
    use RespondsWithFlash;

    /**
     * Returns an image’s URL and dimensions.
     */
    public function imageUrl(Request $request): JsonResponse
    {
        $request->validate(['assetId' => ['required']]);
        $transform = $request->input('transform');

        $asset = $this->image($request->input('assetId'));
        $url = $asset->getUrl($transform);

        // Temp uploads never get a URL, but they can still be shown if the temp upload volume has public URLs
        if (! $url && ! $transform) {
            $volume = $asset->getVolume();
            if ($volume->isTemporary() && $volume->hasUrls) {
                $url = AssetsHelper::generateUrl($asset);
            }
        }

        return new JsonResponse([
            'url' => $url,
            'width' => $asset->getWidth($transform),
            'height' => $asset->getHeight($transform),
        ]);
    }

    /**
     * Returns a field’s current value for an owner, based on the `ownerId`, `siteId` and `layoutElementUid` params.
     *
     * The editor reloads its content with it once the owner’s draft is applied, since the nested entries created for
     * the draft get new IDs then.
     */
    public function fieldValue(Request $request): JsonResponse
    {
        $request->validate([
            'ownerId' => ['required', 'integer'],
            'siteId' => ['nullable', 'integer'],
            'layoutElementUid' => ['required', 'string'],
        ]);
        $ownerId = $request->integer('ownerId');

        $owner = Elements::getElementById($ownerId, siteId: $request->integer('siteId') ?: null);
        abort_unless($owner !== null, 400, "Invalid owner ID: $ownerId");
        abort_unless($this->currentUser()->can('view', $owner), 403, 'User not authorized to view this element.');

        $field = $this->layoutElementField($owner, $request->input('layoutElementUid'));
        abort_unless($field !== null, 400, 'Invalid layout element UID.');

        [$value, $cards] = $field->editorValue($owner);

        return new JsonResponse([
            'value' => $value,
            'cards' => CkeditorControl::cardList($cards),
        ]);
    }

    /**
     * Returns card HTML for an entry, based on the `entryId` and `siteId` params.
     */
    public function entryCardHtml(Request $request): JsonResponse
    {
        $request->validate([
            'entryId' => ['required', 'integer'],
            'siteId' => ['nullable', 'integer'],
        ]);
        $entryId = $request->integer('entryId');

        // it's okay to limit to provided siteId, as we're "just" after the card html;
        // all the hard work has already been done
        /** @var Entry|null $entry */
        $entry = Entry::find()
            ->id($entryId)
            ->siteId($request->input('siteId'))
            ->status(null)
            ->revisions(null)
            // a removed entry may be soft-deleted until the owner is saved again, which restores it
            ->trashed(null)
            ->withProvisionalDrafts()
            ->one();

        abort_unless($entry !== null, 400, "Invalid entry ID: $entryId");
        abort_unless($this->currentUser()->can('view', $entry), 403, 'User not authorized to view this element.');

        $field = $this->layoutElementField($entry->getOwner(), $request->input('layoutElementUid'));
        abort_unless($field !== null, 400, 'Invalid layout element UID.');

        return new JsonResponse([
            'cardHtml' => $field->getCardHtml($entry),
            'headHtml' => HtmlStack::headHtml(),
            'bodyHtml' => HtmlStack::bodyHtml(),
        ]);
    }

    /**
     * Duplicates a nested entry and returns the duplicate’s ID.
     *
     * @since 4.0.0
     */
    public function duplicateNestedEntry(Request $request): Response
    {
        $request->validate(['entryId' => ['required']]);
        $entryId = $request->input('entryId'); // id of the entry we're going to duplicate
        $sourceSiteId = $request->input('sourceSiteId');
        $targetSiteId = $request->input('targetSiteId');
        $targetEntryTypeIds = $request->input('targetEntryTypeIds');
        $targetOwnerId = $request->input('targetOwnerId');
        $targetLayoutElementUid = $request->input('targetLayoutElementUid');

        $entry = Entry::find()
            ->id($entryId)
            ->siteId($sourceSiteId)
            ->status(null)
            ->revisions(null)
            ->one();

        abort_unless($entry !== null, 400, "Invalid entry ID: $entryId");
        abort_unless($entry->getPrimaryOwnerId() !== null, 400, "Entry $entryId isn’t a nested entry.");

        $user = $this->currentUser();
        abort_unless($user->can('view', $entry), 403, 'User not authorized to view this element.');

        if ($targetOwnerId !== null && $entry->primaryOwnerId !== (int) $targetOwnerId) {
            $owner = Elements::getElementById((int) $targetOwnerId, null, $targetSiteId);
        } else {
            $owner = $entry->getOwner();
        }

        abort_unless($owner !== null, 400, 'Invalid owner.');
        abort_unless($user->can('save', $owner), 403, 'User not authorized to edit this element.');

        // check if the target field accepts the entry type we're trying to duplicate
        if ($targetEntryTypeIds !== null && ! in_array($entry->typeId, $targetEntryTypeIds)) {
            return $this->asFailure(t('This field doesn’t allow nested {type} entries.', [
                'type' => $entry->getType()->getUiLabel(),
            ], 'ckeditor'));
        }

        // get the field we're duplicating (e.g. pasting) into
        $targetField = $this->layoutElementField($owner, $targetLayoutElementUid);
        $targetFieldId = $targetField?->id;

        $newAttrs = [];
        if ($targetSiteId !== null && $entry->siteId !== (int) $targetSiteId) {
            $newAttrs['siteId'] = (int) $targetSiteId;
        }
        if ($targetOwnerId !== null && $entry->primaryOwnerId !== (int) $targetOwnerId) {
            $newAttrs['primaryOwnerId'] = (int) $targetOwnerId;
        }
        if ($targetFieldId !== null && $entry->fieldId !== $targetFieldId) {
            $newAttrs['fieldId'] = $targetFieldId;
        }

        try {
            $newEntry = Elements::duplicateElement($entry, $newAttrs);
        } catch (Throwable $e) {
            return $this->asFailure(t('Couldn’t duplicate {type}.', [
                'type' => $entry::lowerDisplayName(),
            ]), ['additionalMessage' => $e->getMessage()]);
        }

        return new JsonResponse([
            'newEntryId' => $newEntry->id,
            'newSiteId' => $newEntry->siteId,
            // include the duplicate’s card HTML, so it doesn’t have to be requested separately
            'cardHtml' => $targetField?->getCardHtml($newEntry),
        ]);
    }

    /**
     * Returns whether the current user can preview and edit an image.
     */
    public function imagePermissions(Request $request): JsonResponse
    {
        $request->validate(['assetId' => ['required']]);

        $asset = $this->image($request->input('assetId'));
        $user = $this->currentUser();
        $volume = $asset->getVolume();

        $previewable = Assets::getAssetPreviewHandler($asset) !== null;
        $editable = (
            $asset->getSupportsImageEditor() &&
            $user->can("editImages:$volume->uid") &&
            ($user->id === $asset->uploaderId || $user->can("editPeerImages:$volume->uid"))
        );

        return new JsonResponse([
            'previewable' => $previewable,
            'editable' => $editable,
        ]);
    }

    /**
     * Returns an image’s alternative text.
     */
    public function imageAlt(Request $request): JsonResponse
    {
        $request->validate(['assetId' => ['required']]);

        $asset = $this->image($request->input('assetId'), $request->input('siteId'));

        return new JsonResponse([
            'alt' => $asset->alt,
            'siteId' => $asset->siteId,
        ]);
    }

    /**
     * Returns an element rendered for the control panel, along with the IDs of the sites it supports.
     *
     * @since 5.0.0
     */
    public function renderElementWithSupportedSites(Request $request, RenderController $renderController): JsonResponse
    {
        $renderData = $renderController->elements($request)->getData(true);
        $siteIds = [];

        $elementParam = $request->input('elements.0');

        /** @var class-string<ElementInterface> $elementType */
        $elementType = $elementParam['type'];
        $element = $elementType::find()
            ->id($elementParam['id'])
            ->drafts(null)
            ->revisions(null)
            ->siteId($elementParam['siteId'])
            ->status(null)
            ->one();

        if ($element) {
            $siteIds = array_map(
                fn (array $site) => $site['siteId'],
                ElementHelper::supportedSitesForElement($element),
            );
        }

        return new JsonResponse([
            'elements' => $renderData['elements'],
            'headHtml' => $renderData['headHtml'],
            'bodyHtml' => $renderData['bodyHtml'],
            'siteIds' => $siteIds,
        ]);
    }

    /**
     * Creates a nested entry for images added to a field in “entries” image mode.
     */
    public function createImageEntry(Request $request): JsonResponse
    {
        $request->validate([
            'fieldId' => ['required'],
            'ownerId' => ['required'],
            'siteId' => ['required'],
            'assetIds' => ['required'],
        ]);

        $fieldId = (int) $request->input('fieldId');
        $ownerId = (int) $request->input('ownerId');
        $siteId = (int) $request->input('siteId');

        $owner = Elements::getElementById($ownerId, siteId: $siteId);
        abort_unless($owner !== null, 400, "Invalid owner ID: $ownerId");
        abort_unless($this->currentUser()->can('save', $owner), 403, 'User not authorized to create this element.');

        $field = Fields::getFieldById($fieldId);
        abort_unless($field instanceof Field, 400, "Invalid CKEditor field: $fieldId");

        $imageEntryType = $field->getImageEntryType();
        $imageField = $field->getImageField();

        abort_if(
            $field->imageMode !== Field::IMAGE_MODE_ENTRIES || ! $imageEntryType || ! $imageField,
            400,
            "Invalid CKEditor field: $fieldId",
        );

        $entry = new Entry([
            'typeId' => $imageEntryType->id,
            'siteId' => $siteId,
            'fieldId' => $field->id,
            'ownerId' => $ownerId,
            'slug' => ElementHelper::tempSlug(),
        ]);
        $entry->setFieldValue($imageField->handle, $request->input('assetIds'));
        $entry->ruleset->useScenario(ElementRules::SCENARIO_ESSENTIALS);

        if (! Elements::saveElement($entry)) {
            abort(500, sprintf('Could not save the nested entry: %s', implode(', ', $entry->errors()->all())));
        }

        return new JsonResponse([
            'entryId' => $entry->id,
            'siteId' => $siteId,
        ]);
    }

    private function image(mixed $assetId, mixed $siteId = null): Asset
    {
        $query = Asset::find()
            ->id($assetId)
            ->kind('image');

        if ($siteId) {
            $query->siteId($siteId);
        }

        /** @var Asset|null $asset */
        $asset = $query->one();
        abort_unless($asset !== null, 404, 'Image not found');

        return $asset;
    }

    private function layoutElementField(?ElementInterface $owner, ?string $layoutElementUid): ?Field
    {
        if (! $owner || ! $layoutElementUid) {
            return null;
        }

        $layoutElement = $owner->getFieldLayout()?->getElementByUid($layoutElementUid);
        $field = $layoutElement instanceof CustomField ? $layoutElement->getField() : null;

        return $field instanceof Field ? $field : null;
    }

    private function currentUser(): User
    {
        $user = currentUserElement();
        abort_unless($user !== null, 403);

        return $user;
    }
}
