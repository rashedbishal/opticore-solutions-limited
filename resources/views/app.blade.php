<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <meta name="csrf-token" content="{{ csrf_token() }}">
        <link rel="icon" href="/favicon.ico" sizes="any">

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        {{-- Only Roboto Mono is actually rendered: --font-sans resolves to the self-hosted Geist Variable font (see resources/css/app.css), so Plus Jakarta Sans was never visible. --}}
        {{-- Preload hint starts the download in parallel with other critical resources --}}
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;600&display=swap" as="style">
        <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;600&display=swap" rel="stylesheet">

        <script src="/theme-init.js"></script>
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        <x-inertia::head>
            <title>Opticore Solutions Limited</title>
        </x-inertia::head>
    </head>
    <body class="bg-background font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
