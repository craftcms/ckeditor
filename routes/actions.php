<?php

use CraftCms\Ckeditor\Http\Controllers\CkeditorController;
use CraftCms\Cms\Http\Middleware\RequireCpRequest;
use Illuminate\Support\Facades\Route;

// Registered under both `actions/ckeditor/` and `admin/actions/ckeditor/`, so the Craft 5 action URLs keep working.
// The site action prefix is reachable by guests, so every route requires a logged-in control panel user.

Route::middleware(['auth', 'can:accessCp', RequireCpRequest::class])->group(function() {
    Route::post('ckeditor/image-url', [CkeditorController::class, 'imageUrl']);
    Route::post('ckeditor/entry-card-html', [CkeditorController::class, 'entryCardHtml']);
    Route::post('ckeditor/duplicate-nested-entry', [CkeditorController::class, 'duplicateNestedEntry']);
    Route::post('ckeditor/image-permissions', [CkeditorController::class, 'imagePermissions']);
    Route::post('ckeditor/image-alt', [CkeditorController::class, 'imageAlt']);
    Route::post('ckeditor/render-element-with-supported-sites', [CkeditorController::class, 'renderElementWithSupportedSites']);
    Route::post('ckeditor/create-image-entry', [CkeditorController::class, 'createImageEntry']);
});

