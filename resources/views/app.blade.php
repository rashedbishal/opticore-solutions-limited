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
        {{-- Roboto Mono isn't needed for first paint (body text uses the self-hosted Geist font), so load it without blocking the render: swap the media type once it's fetched. --}}
        <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;600&display=swap"
            media="print"
            onload="this.media='all'"
        >
        <noscript>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;600&display=swap">
        </noscript>

        {{-- Inlined to avoid an extra render-blocking network request before paint --}}
        <script>
            (function () {
                try {
                    var stored = localStorage.getItem('preferred-theme');
                    var theme =
                        stored ||
                        (window.matchMedia('(prefers-color-scheme: dark)').matches
                            ? 'dark'
                            : 'light');
                    if (theme === 'dark') {
                        document.documentElement.classList.add('dark');
                    }
                } catch (e) {}
            })();
        </script>
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
