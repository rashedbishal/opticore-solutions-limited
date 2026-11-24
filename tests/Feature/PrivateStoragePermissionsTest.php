<?php

use Illuminate\Support\Facades\Storage;

it('saves private files so the web server and the queue worker can both open them', function () {
    $disk = Storage::disk('local');
    $path = 'permissions-test/'.uniqid().'/file.txt';

    $disk->put($path, 'x');

    $file = fileperms($disk->path($path)) & 0777;
    $dir = fileperms(dirname($disk->path($path))) & 0777;

    // Group can read + write (the worker's user shares the group); nobody
    // else can write.
    expect($file & 0060)->toBe(0060)
        ->and($dir & 0070)->toBe(0070)
        ->and($file & 0002)->toBe(0)
        ->and($dir & 0007)->toBe(0);

    $disk->deleteDirectory(dirname(dirname($path)));
});
