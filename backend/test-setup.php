#!/usr/bin/env php
<?php

require_once __DIR__.'/vendor/autoload.php';

use Symfony\Component\Dotenv\Dotenv;
use App\Kernel;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\ConsoleOutput;

$dotenv = new Dotenv();
$dotenv->load(__DIR__.'/.env');

$kernel = new Kernel($_SERVER['APP_ENV'] ?? 'dev', (bool) ($_SERVER['APP_DEBUG'] ?? true));
$application = new Application($kernel);

// Test database connection
try {
    $application->run(new ArrayInput(['doctrine:query:sql', 'sql' => 'SELECT 1']), new ConsoleOutput());
    echo "✅ Database connection: OK\n";
} catch (Exception $e) {
    echo "❌ Database connection: FAILED - " . $e->getMessage() . "\n";
    exit(1);
}

// Test routes
try {
    $output = new ConsoleOutput();
    $application->run(new ArrayInput(['debug:router', '--quiet']), $output);
    echo "✅ Routes: OK\n";
} catch (Exception $e) {
    echo "❌ Routes: FAILED - " . $e->getMessage() . "\n";
    exit(1);
}

// Test cache
try {
    $application->run(new ArrayInput(['cache:clear', '--quiet']), new ConsoleOutput());
    echo "✅ Cache: OK\n";
} catch (Exception $e) {
    echo "❌ Cache: FAILED - " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n🎉 All basic tests passed! Backend is ready.\n";