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
 * @since 6.0.0
 */
class CkeditorControl extends Control
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
        ];
    }
}
