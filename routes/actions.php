<?php

declare(strict_types=1);

use CraftCms\Ckeditor\Http\Controllers\CkeditorController;
use CraftCms\Cms\Http\Middleware\RequireCpRequest;
use Illuminate\Support\Facades\Route;

// Craft registers these under both the CP and site action prefixes. The site prefix is reachable by guests,
// so every route requires a logged-in control panel user on a control panel request.

Route::middleware(['auth', 'can:accessCp', RequireCpRequest::class])->group(function () {
    Route::post('ckeditor/image-url', [CkeditorController::class, 'imageUrl']);
    Route::post('ckeditor/entry-card-html', [CkeditorController::class, 'entryCardHtml']);
    Route::post('ckeditor/field-value', [CkeditorController::class, 'fieldValue']);
    Route::post('ckeditor/duplicate-nested-entry', [CkeditorController::class, 'duplicateNestedEntry']);
    Route::post('ckeditor/image-permissions', [CkeditorController::class, 'imagePermissions']);
    Route::post('ckeditor/image-alt', [CkeditorController::class, 'imageAlt']);
    Route::post('ckeditor/render-element-with-supported-sites', [CkeditorController::class, 'renderElementWithSupportedSites']);
    Route::post('ckeditor/create-image-entry', [CkeditorController::class, 'createImageEntry']);
});
