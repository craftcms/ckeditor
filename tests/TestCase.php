<?php

declare(strict_types=1);

namespace CraftCms\Ckeditor\Tests;

use CraftCms\Ckeditor\Field;
use CraftCms\Cms\Plugin\Testing\PluginTestCase;
use Illuminate\Foundation\Bootstrap\LoadEnvironmentVariables;
use Illuminate\Support\Facades\DB;
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

    #[Override]
    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);

        // Load tests/.env, if there is one
        $app->useEnvironmentPath(__DIR__);
        $app->bootstrapWith([LoadEnvironmentVariables::class]);

        // The database config was resolved before tests/.env was loaded, so apply its DB_* values now.
        // Without them, tests run against an in-memory SQLite database.
        $connection = env('DB_CONNECTION', 'sqlite');
        $config = $app->make('config');
        $config->set('database.default', $connection);

        if ($connection === 'sqlite') {
            $database = env('DB_DATABASE', ':memory:');

            if ($database !== ':memory:' && ! str_starts_with($database, '/')) {
                $database = dirname(__DIR__)."/$database";
            }

            if ($database !== ':memory:' && ! file_exists($database)) {
                touch($database);
            }

            $config->set("database.connections.$connection.database", $database);
        } else {
            $config->set("database.connections.$connection.host", env('DB_HOST', '127.0.0.1'));
            $config->set("database.connections.$connection.port", env('DB_PORT'));
            $config->set("database.connections.$connection.database", env('DB_DATABASE'));
            $config->set("database.connections.$connection.username", env('DB_USERNAME'));
            $config->set("database.connections.$connection.password", env('DB_PASSWORD', ''));
            $config->set("database.connections.$connection.prefix", env('DB_PREFIX', ''));

            if ($connection === 'pgsql' && env('DB_SCHEMA')) {
                $config->set("database.connections.$connection.search_path", env('DB_SCHEMA'));
            }
        }

        DB::purge($connection);
    }
}
