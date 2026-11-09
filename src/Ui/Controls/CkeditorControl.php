<?php

/**
 * @link https://craftcms.com/
 *
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license GPL-3.0-or-later
 */

declare(strict_types=1);

namespace CraftCms\Ckeditor\Ui\Controls;

use CraftCms\Cms\Support\Html;
use CraftCms\Cms\Ui\Contracts\ReadableValueControl;
use CraftCms\Cms\Ui\Contracts\WritableValueControl;
use CraftCms\Cms\Ui\ControlPayload;
use CraftCms\Cms\Ui\Controls\Control;
use CraftCms\Cms\Ui\UiHtmlRenderer;
use Override;

/**
 * The CKEditor field input.
 *
 * The control’s value is the field’s HTML. The Vue component (`ckeditor:editor`) loads the editor’s assets, imports
 * the field’s editor setup module, and emits the editor’s data as the value whenever it changes.
 *
 * The value can be copied to another version of the element on the Compare screen, or to another CKEditor field that
 * allows the same entry types with the “Copy value” and “Paste value” field actions, along with the nested entries’
 * card HTML. The field duplicates any nested entries the target element doesn’t own when it’s saved.
 *
 * @since 6.0.0
 */
class CkeditorControl extends Control implements ReadableValueControl, WritableValueControl
{
    private string $module = '';

    private string $containerId = '';

    private bool $showWordCount = false;

    private ?string $css = null;

    /** @var array{styles:string[],scripts:string[],modules:string[]} */
    private array $assets = ['styles' => [], 'scripts' => [], 'modules' => []];

    /** @var array<string,mixed> */
    private array $globals = [];

    /** @var array<string,mixed>|null */
    private ?array $owner = null;

    /** @var array<int,string> */
    private array $cards = [];

    /** @var list<int> */
    private array $entryTypeIds = [];

    public static function renderHtml(ControlPayload $control, mixed $value, array $attributes, UiHtmlRenderer $renderer): string
    {
        return Html::textarea($attributes['name'], (string) ($value ?? ''), [
            'id' => $attributes['id'],
            'class' => ['text', 'w-full'],
            'rows' => 10,
            'disabled' => $attributes['disabled'] ?? false,
            'readonly' => $attributes['readonly'] ?? false,
            'required' => $attributes['required'] ?? false,
            'aria' => [
                'invalid' => $attributes['aria']['invalid'] ?? null,
                'describedby' => $attributes['aria']['describedby'] ?? null,
            ],
        ])->render();
    }

    public function component(): string
    {
        return 'ckeditor:editor';
    }

    /**
     * Sets the JavaScript module source that creates the editor.
     *
     * The module’s default export receives the source element and an options object, and returns the editor promise.
     */
    public function module(string $module): static
    {
        $this->module = $module;

        return $this;
    }

    /**
     * Sets the ID of the editor container, which the field’s custom CSS is scoped to.
     */
    public function containerId(string $containerId): static
    {
        $this->containerId = $containerId;

        return $this;
    }

    /**
     * Sets whether the word count should be shown below the editor.
     */
    public function showWordCount(bool $showWordCount = true): static
    {
        $this->showWordCount = $showWordCount;

        return $this;
    }

    /**
     * Sets custom CSS that should be registered for the editor.
     */
    public function css(?string $css): static
    {
        $this->css = $css;

        return $this;
    }

    /**
     * Sets the CSS files, classic scripts and module scripts the editor needs.
     *
     * @param  array{styles:string[],scripts:string[],modules:string[]}  $assets
     */
    public function assets(array $assets): static
    {
        $this->assets = $assets;

        return $this;
    }

    /**
     * Sets global settings the CKEditor JavaScript reads.
     *
     * @param  array<string,mixed>  $globals
     */
    public function globals(array $globals): static
    {
        $this->globals = $globals;

        return $this;
    }

    /**
     * Sets the owner element’s context, used to make sure nested entries are created for the owner’s draft.
     *
     * @param  array<string,mixed>|null  $owner
     */
    public function owner(?array $owner): static
    {
        $this->owner = $owner;

        return $this;
    }

    /**
     * Sets the card HTML for the nested entries in the value, indexed by entry ID.
     *
     * @param  array<int,string>  $cards
     */
    public function cards(array $cards): static
    {
        $this->cards = $cards;

        return $this;
    }

    /**
     * Sets the IDs of the entry types the field allows nested entries of.
     *
     * @param  list<int>  $entryTypeIds
     */
    public function entryTypeIds(array $entryTypeIds): static
    {
        $this->entryTypeIds = $entryTypeIds;

        return $this;
    }

    /**
     * Returns card HTML indexed by entry ID as a list of entry ID and card HTML pairs.
     *
     * @param  array<int,string>  $cards
     * @return list<array{entryId:int,cardHtml:string}>
     */
    public static function cardList(array $cards): array
    {
        $list = [];
        foreach ($cards as $entryId => $cardHtml) {
            $list[] = ['entryId' => $entryId, 'cardHtml' => $cardHtml];
        }

        return $list;
    }

    #[Override]
    public function valueProps(): array
    {
        return ['cards'];
    }

    #[Override]
    public function getValueScope(): ?string
    {
        // Values are only copied between controls that allow the same entry types, unless a narrower scope is set
        $entryTypeIds = $this->entryTypeIds;
        sort($entryTypeIds);

        $scope = parent::getValueScope();
        $entryTypes = $entryTypeIds ? 'entryTypes:'.implode(',', $entryTypeIds) : null;

        return $scope !== null && $entryTypes !== null ? "{$scope}|{$entryTypes}" : $scope ?? $entryTypes;
    }

    #[Override]
    public function emptyValue(): mixed
    {
        return '';
    }

    #[Override]
    public function props(mixed $value = null): array
    {
        return [
            'module' => $this->module,
            'containerId' => $this->containerId,
            'showWordCount' => $this->showWordCount,
            'css' => $this->css,
            'assets' => $this->assets,
            'globals' => $this->globals,
            'owner' => $this->owner,
            // A list, since entry IDs as keys could serialize as either a JSON object or array
            'cards' => self::cardList($this->cards),
        ];
    }
}
