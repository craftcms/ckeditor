<?php

declare(strict_types=1);

namespace Workbench\Database\Seeders;

use CraftCms\Ckeditor\Field;
use CraftCms\Cms\Asset\Data\Volume;
use CraftCms\Cms\Entry\Data\EntryType;
use CraftCms\Cms\Entry\Elements\Entry;
use CraftCms\Cms\Field\Assets;
use CraftCms\Cms\Field\PlainText;
use CraftCms\Cms\FieldLayout\FieldLayout;
use CraftCms\Cms\FieldLayout\LayoutElements\CustomField;
use CraftCms\Cms\FieldLayout\LayoutElements\Entries\EntryTitleField;
use CraftCms\Cms\Section\Data\Section;
use CraftCms\Cms\Section\Data\SectionSiteSettings;
use CraftCms\Cms\Section\Enums\SectionType;
use CraftCms\Cms\Support\Facades\Elements;
use CraftCms\Cms\Support\Facades\EntryTypes;
use CraftCms\Cms\Support\Facades\Fields;
use CraftCms\Cms\Support\Facades\Sections;
use CraftCms\Cms\Support\Facades\Sites;
use CraftCms\Cms\Support\Facades\Volumes;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use RuntimeException;

class EditorSeeder extends Seeder
{
    public function run(): void
    {
        if (Sections::getSectionByHandle('articles')) {
            return;
        }

        $save = static function (bool $saved): void {
            if (! $saved) {
                throw new RuntimeException('Could not save editor fixture.');
            }
        };
        $volume = new Volume(['name' => 'Images', 'handle' => 'images', 'fsHandle' => 'images', 'hasUrls' => true]);
        $save(Volumes::saveVolume($volume));

        $plain = Fields::createField(['type' => PlainText::class, 'name' => 'Summary', 'handle' => 'summary']);
        $image = Fields::createField(['type' => Assets::class, 'name' => 'Image', 'handle' => 'image', 'sources' => ['volume:'.$volume->uid], 'defaultUploadLocationSource' => 'volume:'.$volume->uid]);
        $save(Fields::saveField($plain));
        $save(Fields::saveField($image));

        $type = static function (string $name, string $handle, array $fields) use ($save): EntryType {
            $type = new EntryType(['name' => $name, 'handle' => $handle]);
            $type->setFieldLayout(FieldLayout::createFromConfig([
                'type' => Entry::class,
                'tabs' => [['name' => 'Content', 'elements' => [
                    ['type' => EntryTitleField::class, 'uid' => (string) Str::uuid()],
                    ...array_map(static fn ($field) => ['type' => CustomField::class, 'uid' => (string) Str::uuid(), 'fieldUid' => $field->uid], $fields),
                ]]],
            ]));
            $save(EntryTypes::saveEntryType($type));

            return EntryTypes::getEntryTypeById($type->id);
        };
        $quote = $type('Quote', 'quote', [$plain]);
        $photo = $type('Photo', 'photo', [$image, $plain]);
        $body = Fields::createField([
            'type' => Field::class, 'name' => 'Body', 'handle' => 'body',
            'toolbar' => ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'insertImage', 'createEntry', 'sourceEditing', 'undo', 'redo'],
            'entryTypes' => [['uid' => $quote->uid]],
            'defaultUploadLocationVolume' => $volume->uid,
        ]);
        $save(Fields::saveField($body));
        $gallery = Fields::createField([
            'type' => Field::class, 'name' => 'Photo story', 'handle' => 'photoStory',
            'toolbar' => ['bold', 'insertImage', 'createEntry', 'undo', 'redo'],
            'imageMode' => 'entries',
            'entryTypes' => [['uid' => $photo->uid]],
            'imageEntryTypeUid' => $photo->uid,
            'imageFieldUid' => $photo->getFieldLayout()->getCustomFieldElements()[0]->uid,
            'defaultUploadLocationVolume' => $volume->uid,
        ]);
        $save(Fields::saveField($gallery));
        $article = $type('Article', 'article', [$plain, $body, $gallery]);
        $section = new Section([
            'name' => 'Articles', 'handle' => 'articles', 'type' => SectionType::Channel,
            'entryTypes' => [$article->id],
            'siteSettings' => [new SectionSiteSettings(['siteId' => Sites::getPrimarySite()->id])],
        ]);
        $save(Sections::saveSection($section));
        $entry = new Entry(['sectionId' => $section->id, 'typeId' => $article->id, 'title' => 'Autumn in Brussels']);
        $entry->setFieldValues([
            'summary' => 'A weekend walk through the city.',
            'body' => '<h2>A walk through Brussels</h2><p>The autumn market opens on Saturday.</p>',
            'photoStory' => '<p>Photographs from the walk.</p>',
        ]);
        $save(Elements::saveElement($entry));
    }
}
