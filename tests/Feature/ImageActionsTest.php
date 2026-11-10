<?php

declare(strict_types=1);

use CraftCms\Cms\Asset\AssetUploadHandler;
use CraftCms\Cms\Asset\Data\AssetIngest;
use CraftCms\Cms\Asset\Data\Volume;
use CraftCms\Cms\Asset\Elements\Asset;
use CraftCms\Cms\Edition;
use CraftCms\Cms\Entry\Elements\Entry;
use CraftCms\Cms\Field\Assets;
use CraftCms\Cms\Filesystem\Data\UploadedFile;
use CraftCms\Cms\Support\Facades\Elements;
use CraftCms\Cms\Support\Facades\Fields;
use CraftCms\Cms\Support\Facades\Folders;
use CraftCms\Cms\Support\Facades\UserPermissions;
use CraftCms\Cms\Support\Facades\Volumes;
use CraftCms\Cms\User\Elements\User as UserElement;
use CraftCms\Cms\User\Models\User;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    config()->set('filesystems.disks.ckeditor-source', ['driver' => 'local', 'root' => storage_path('framework/testing/ckeditor-source')]);
    config()->set('filesystems.disks.ckeditor-images', ['driver' => 'local', 'root' => storage_path('framework/testing/ckeditor-images')]);
    Storage::fake('ckeditor-source');
    Storage::fake('ckeditor-images', ['url' => 'https://localhost/uploads']);

    $this->volume = new Volume([
        'name' => 'Images',
        'handle' => 'images',
        'fsHandle' => 'ckeditor-images',
        'hasUrls' => true,
    ]);
    expect(Volumes::saveVolume($this->volume))->toBeTrue();

    $this->image = uploadAsset($this->volume, 'photo.png', pngContents(40, 30));
});

/**
 * Returns the contents of a PNG image with the given dimensions.
 */
function pngContents(int $width, int $height): string
{
    $image = imagecreatetruecolor($width, $height);
    ob_start();
    imagepng($image);

    return (string) ob_get_clean();
}

/**
 * Uploads a file to the root folder of the given volume.
 */
function uploadAsset(Volume $volume, string $filename, string $contents, string $mimeType = 'image/png'): Asset
{
    Storage::disk('ckeditor-source')->put($filename, $contents);

    $result = app(AssetUploadHandler::class)->ingest(new AssetIngest(
        source: new UploadedFile(Storage::disk('ckeditor-source'), $filename, $filename),
        filename: $filename,
        mimeType: $mimeType,
        folder: Folders::getRootFolderByVolumeId($volume->id),
        sanitizeOnUpload: false,
    ));

    return Asset::find()->id($result->asset->id)->one();
}

describe('image-url', function () {
    it('returns an image’s URL and dimensions', function () {
        $this->actingAs(User::first(), 'craft')
            ->postJson(cpAction('image-url'), ['assetId' => $this->image->id])
            ->assertOk()
            ->assertJson([
                'url' => $this->image->getUrl(),
                'width' => 40,
                'height' => 30,
            ]);
    });

    it('rejects assets that aren’t images', function () {
        $file = uploadAsset($this->volume, 'notes.txt', 'Some text', 'text/plain');

        $this->actingAs(User::first(), 'craft')
            ->postJson(cpAction('image-url'), ['assetId' => $file->id])
            ->assertNotFound();
    });

    it('rejects unknown assets', function () {
        $this->actingAs(User::first(), 'craft')
            ->postJson(cpAction('image-url'), ['assetId' => 999999])
            ->assertNotFound();
    });
});

describe('image-alt', function () {
    it('returns an image’s alternative text', function () {
        $this->image->alt = 'A black rectangle';
        Elements::saveElement($this->image);

        $this->actingAs(User::first(), 'craft')
            ->postJson(cpAction('image-alt'), ['assetId' => $this->image->id])
            ->assertOk()
            ->assertJson([
                'alt' => 'A black rectangle',
                'siteId' => $this->image->siteId,
            ]);
    });

    it('validates the asset ID', function () {
        $this->actingAs(User::first(), 'craft')
            ->postJson(cpAction('image-alt'))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['assetId']);
    });
});

describe('image-permissions', function () {
    it('lets admins preview and edit images', function () {
        $this->actingAs(User::first(), 'craft')
            ->postJson(cpAction('image-permissions'), ['assetId' => $this->image->id])
            ->assertOk()
            ->assertJson(['previewable' => true, 'editable' => true]);
    });

    it('doesn’t let users without image editing permissions edit images', function () {
        Edition::set(Edition::Pro);

        $user = new UserElement(['username' => 'author', 'email' => 'author@example.com']);
        expect(Elements::saveElement($user))->toBeTrue();
        UserPermissions::saveUserPermissions($user->id, ['accessCp', "viewAssets:{$this->volume->uid}"]);

        $this->actingAs(User::find($user->id), 'craft')
            ->postJson(cpAction('image-permissions'), ['assetId' => $this->image->id])
            ->assertOk()
            ->assertJson(['previewable' => true, 'editable' => false]);
    });

    it('lets users edit their own images, but not other people’s without permission', function (bool $ownImage, bool $editable) {
        Edition::set(Edition::Pro);

        $user = new UserElement(['username' => 'author', 'email' => 'author@example.com']);
        expect(Elements::saveElement($user))->toBeTrue();
        UserPermissions::saveUserPermissions($user->id, [
            'accessCp',
            "viewAssets:{$this->volume->uid}",
            "editImages:{$this->volume->uid}",
        ]);

        if ($ownImage) {
            $this->image->uploaderId = $user->id;
            Elements::saveElement($this->image);
        }

        $this->actingAs(User::find($user->id), 'craft')
            ->postJson(cpAction('image-permissions'), ['assetId' => $this->image->id])
            ->assertOk()
            ->assertJson(['editable' => $editable]);
    })->with([
        'own image' => [true, true],
        'someone else’s image' => [false, false],
    ]);
});

describe('create-image-entry', function () {
    beforeEach(function () {
        $imageField = Fields::createField([
            'type' => Assets::class,
            'name' => 'Image',
            'handle' => 'image',
        ]);
        expect(Fields::saveField($imageField))->toBeTrue();

        $this->imageEntryType = createEntryType('imageBlock', [$imageField]);
        $imageLayoutElementUid = $this->imageEntryType->getFieldLayout()->getCustomFieldElements()[0]->uid;

        [
            'field' => $this->field,
            'section' => $section,
            'entryType' => $entryType,
        ] = createCkeditorSetup([
            'imageMode' => 'entries',
            'entryTypes' => [['uid' => $this->imageEntryType->uid]],
            'imageEntryTypeUid' => $this->imageEntryType->uid,
            'imageFieldUid' => $imageLayoutElementUid,
        ]);

        $this->owner = createEntry($section, $entryType, '<p>Intro</p>');

        $this->actingAs(User::first(), 'craft');
    });

    it('creates a nested entry for an image', function () {
        $response = $this->postJson(cpAction('create-image-entry'), [
            'fieldId' => $this->field->id,
            'ownerId' => $this->owner->id,
            'siteId' => $this->owner->siteId,
            'assetIds' => [$this->image->id],
        ])->assertOk()->assertJson(['siteId' => $this->owner->siteId]);

        $entry = Entry::find()->id($response->json('entryId'))->status(null)->drafts(null)->one();

        expect($entry->typeId)->toBe($this->imageEntryType->id)
            ->and($entry->fieldId)->toBe($this->field->id)
            ->and($entry->getOwnerId())->toBe($this->owner->id)
            ->and($entry->getFieldValue('image')->ids())->toBe([$this->image->id]);
    });

    it('validates required params', function () {
        $this->postJson(cpAction('create-image-entry'))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['fieldId', 'ownerId', 'siteId', 'assetIds']);
    });

    it('rejects an invalid owner', function () {
        $this->postJson(cpAction('create-image-entry'), [
            'fieldId' => $this->field->id,
            'ownerId' => 999999,
            'siteId' => $this->owner->siteId,
            'assetIds' => [$this->image->id],
        ])->assertBadRequest();
    });

    it('rejects fields that don’t store images as entries', function () {
        $field = createCkeditorField(handle: 'summary');

        $this->postJson(cpAction('create-image-entry'), [
            'fieldId' => $field->id,
            'ownerId' => $this->owner->id,
            'siteId' => $this->owner->siteId,
            'assetIds' => [$this->image->id],
        ])->assertBadRequest()->assertJson(['message' => "Invalid CKEditor field: $field->id"]);
    });

    it('rejects fields that aren’t CKEditor fields', function () {
        $imageField = Fields::getFieldByHandle('image');

        $this->postJson(cpAction('create-image-entry'), [
            'fieldId' => $imageField->id,
            'ownerId' => $this->owner->id,
            'siteId' => $this->owner->siteId,
            'assetIds' => [$this->image->id],
        ])->assertBadRequest();
    });
});
