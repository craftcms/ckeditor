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
use CraftCms\Cms\Support\Json;
use CraftCms\Cms\Ui\ControlPayload;
use CraftCms\Cms\Ui\Controls\Control;
use CraftCms\Cms\Ui\UiHtmlRenderer;
use Override;

/**
 * The toolbar builder, config options or custom styles setting for a CKEditor field.
 *
 * The control’s value is an array with the `toolbar` key, the `configMode`, `json`, `js` and `jsFile` keys, or the
 * `cssMode`, `css` and `cssFile` keys. The Vue component (`ckeditor:editor-config`) mounts the server-rendered markup,
 * starts the code editors, runs the module once every part of its group is mounted, and emits the inputs’ values
 * whenever they change.
 *
 * @since 6.0.0
 */
class EditorConfigControl extends Control
{
    private string $html = '';

    private string $module = '';

    private ?string $part = null;

    private ?string $group = null;

    /** @var array{styles:string[],scripts:string[],modules:string[]} */
    private array $assets = ['styles' => [], 'scripts' => [], 'modules' => []];

    /** @var array<string,mixed> */
    private array $codeEditor = [];

    /** @var array<string,mixed> */
    private array $globals = [];

    public static function renderHtml(ControlPayload $control, mixed $value, array $attributes, UiHtmlRenderer $renderer): string
    {
        return Html::hiddenInput($attributes['name'] ?? '', Json::encode($value ?? []), [
            'id' => $attributes['id'],
        ]).($control->props['html'] ?? '');
    }

    public function component(): string
    {
        return 'ckeditor:editor-config';
    }

    /**
     * Sets the server-rendered settings markup.
     */
    public function html(string $html): static
    {
        $this->html = $html;

        return $this;
    }

    /**
     * Sets the JavaScript module that initializes the toolbar builder and config options.
     */
    public function module(string $module): static
    {
        $this->module = $module;

        return $this;
    }

    /**
     * Sets which part of the settings this control holds, and the group it shares with the other part, if any.
     */
    public function part(string $part, ?string $group): static
    {
        $this->part = $part;
        $this->group = $group;

        return $this;
    }

    /**
     * Sets the CSS files, classic scripts and module scripts the settings need.
     *
     * @param  array{styles:string[],scripts:string[],modules:string[]}  $assets
     */
    public function assets(array $assets): static
    {
        $this->assets = $assets;

        return $this;
    }

    /**
     * Sets the code editor (Monaco) settings.
     *
     * @param  array<string,mixed>  $codeEditor
     */
    public function codeEditor(array $codeEditor): static
    {
        $this->codeEditor = $codeEditor;

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

    #[Override]
    public function emptyValue(): mixed
    {
        return [];
    }

    #[Override]
    public function props(mixed $value = null): array
    {
        return [
            'html' => $this->html,
            'module' => $this->module,
            'part' => $this->part,
            'group' => $this->group,
            'assets' => $this->assets,
            'codeEditor' => $this->codeEditor,
            'globals' => $this->globals,
        ];
    }
}
