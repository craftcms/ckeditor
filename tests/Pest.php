<?php

declare(strict_types=1);

use CraftCms\Ckeditor\Field;
use CraftCms\Ckeditor\Tests\TestCase;
use CraftCms\Cms\Entry\Data\EntryType;
use CraftCms\Cms\Entry\Elements\Entry;
use CraftCms\Cms\Field\Contracts\FieldInterface;
use CraftCms\Cms\FieldLayout\FieldLayout;
use CraftCms\Cms\FieldLayout\LayoutElements\CustomField;
use CraftCms\Cms\FieldLayout\LayoutElements\Entries\EntryTitleField;
use CraftCms\Cms\Section\Data\Section;
use CraftCms\Cms\Section\Data\SectionSiteSettings;
use CraftCms\Cms\Section\Enums\SectionType;
use CraftCms\Cms\Site\Data\Site;
use CraftCms\Cms\Support\Facades\Elements;
use CraftCms\Cms\Support\Facades\EntryTypes;
use CraftCms\Cms\Support\Facades\Fields;
use CraftCms\Cms\Support\Facades\Sections;
use CraftCms\Cms\Support\Facades\Sites;
use CraftCms\Cms\Support\Str;

uses(TestCase::class)->in('Feature', 'Unit');

/**
 * Creates and saves a CKEditor field.
 */
function createCkeditorField(array $settings = [], string $handle = 'body'): Field
{
    /** @var Field $field */
    $field = Fields::createField([
        'type' => Field::class,
        'name' => Str::title($handle),
        'handle' => $handle,
        ...$settings,
    ]);

    expect(Fields::saveField($field))->toBeTrue();

    return $field;
}

/**
 * Creates and saves an entry type with the given custom fields in its layout.
 *
 * @param  FieldInterface[]  $fields
 */
function createEntryType(string $handle, array $fields = []): EntryType
{
    $entryType = new EntryType([
        'name' => Str::title($handle),
        'handle' => $handle,
    ]);

    $entryType->setFieldLayout(FieldLayout::createFromConfig([
        'type' => Entry::class,
        'tabs' => [
            [
                'name' => 'Content',
                'elements' => [
                    ['type' => EntryTitleField::class, 'uid' => Str::uuid()->toString()],
                    ...array_map(fn ($field) => [
                        'type' => CustomField::class,
                        'uid' => Str::uuid()->toString(),
                        'fieldUid' => $field->uid,
                    ], $fields),
                ],
            ],
        ],
    ]));

    expect(EntryTypes::saveEntryType($entryType))->toBeTrue();

    return EntryTypes::getEntryTypeById($entryType->id);
}

/**
 * Creates and saves a channel section for the given entry type, enabled for every site.
 */
function createSection(EntryType $entryType, string $handle = 'pages'): Section
{
    $section = new Section([
        'name' => Str::title($handle),
        'handle' => $handle,
        'type' => SectionType::Channel,
        'entryTypes' => [$entryType->id],
        'siteSettings' => Sites::getAllSites()
            ->map(fn (Site $site) => new SectionSiteSettings(['siteId' => $site->id]))
            ->values()
            ->all(),
    ]);

    expect(Sections::saveSection($section))->toBeTrue();

    return Sections::getSectionById($section->id);
}

/**
 * Creates a section whose entries have a CKEditor field, optionally allowing nested entries of a given type.
 *
 * @return array{field: Field, section: Section, entryType: EntryType, nestedEntryType: ?EntryType}
 */
function createCkeditorSetup(array $fieldSettings = [], bool $withNestedEntries = false): array
{
    $nestedEntryType = null;

    if ($withNestedEntries) {
        $nestedEntryType = createEntryType('quote');
        $fieldSettings = [
            'toolbar' => ['heading', '|', 'bold', 'italic', 'link', 'createEntry'],
            'entryTypes' => [['uid' => $nestedEntryType->uid]],
            ...$fieldSettings,
        ];
    }

    $field = createCkeditorField($fieldSettings);
    $entryType = createEntryType('page', [$field]);
    $section = createSection($entryType);

    return [
        'field' => Fields::getFieldById($field->id),
        'section' => $section,
        'entryType' => $entryType,
        'nestedEntryType' => $nestedEntryType,
    ];
}

/**
 * Creates and saves an entry in the given section, with the given CKEditor field value.
 */
function createEntry(Section $section, EntryType $entryType, ?string $body = null, string $title = 'Test entry'): Entry
{
    $entry = new Entry([
        'sectionId' => $section->id,
        'typeId' => $entryType->id,
        'title' => $title,
    ]);

    if ($body !== null) {
        $entry->setFieldValue('body', $body);
    }

    expect(Elements::saveElement($entry))->toBeTrue();

    return Entry::find()->id($entry->id)->status(null)->one();
}

/**
 * Creates and saves an entry nested within the given owner’s CKEditor field.
 */
function createNestedEntry(Entry $owner, Field $field, EntryType $entryType, string $title = 'Nested entry'): Entry
{
    $entry = new Entry([
        'fieldId' => $field->id,
        'ownerId' => $owner->id,
        'typeId' => $entryType->id,
        'title' => $title,
    ]);

    expect(Elements::saveElement($entry))->toBeTrue();

    return Entry::find()->id($entry->id)->status(null)->one();
}

/**
 * Returns the URL for a CKEditor control panel action.
 */
function cpAction(string $action): string
{
    return "/admin/actions/ckeditor/ckeditor/$action";
}

/**
 * Creates and saves a second site in the primary site’s group.
 */
function createSecondSite(string $handle = 'second', string $language = 'de-DE'): Site
{
    $site = new Site([
        'groupId' => Sites::getPrimarySite()->groupId,
        'name' => Str::title($handle),
        'handle' => $handle,
        'language' => $language,
        'baseUrl' => "https://localhost/$handle/",
    ]);

    expect(Sites::saveSite($site))->toBeTrue();

    return Sites::getSiteById($site->id);
}
