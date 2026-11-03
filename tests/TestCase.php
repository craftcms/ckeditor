<?php

declare(strict_types=1);

namespace CraftCms\Ckeditor\Tests;

use CraftCms\Ckeditor\Field;
use CraftCms\Cms\Plugin\Testing\PluginTestCase;
use Override;
use ReflectionProperty;

abstract class TestCase extends PluginTestCase
{
    #[Override]
    protected function setUp(): void
    {
        // The field caches its nested entry managers and registers its event listeners once per process,
        // but each test gets a fresh app (and event dispatcher)
        new ReflectionProperty(Field::class, 'entryManagers')->setValue(null, []);
        new ReflectionProperty(Field::class, 'registeredListeners')->setValue(null, false);

        parent::setUp();
    }
}
