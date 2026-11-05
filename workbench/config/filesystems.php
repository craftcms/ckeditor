<?php

declare(strict_types=1);

return [
    'disks' => [
        'images' => [
            'driver' => 'local',
            'root' => public_path('uploads'),
            'url' => rtrim(env('APP_URL', 'http://localhost:8125'), '/').'/uploads',
            'visibility' => 'public',
        ],
    ],
];
