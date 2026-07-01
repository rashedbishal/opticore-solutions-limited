<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <meta name="csrf-token" content="{{ csrf_token() }}">
        <link rel="canonical" href="{{ url()->current() }}">
        <link rel="icon" href="/favicon.ico" sizes="any">

        {{-- Preload both logos so they're ready before React paints the navbar.
             Both are ~7 KB so the cost of fetching both is negligible, and
             media-query-conditioned preloads are poorly supported and cause
             console warnings when the query doesn't match. --}}
        <link rel="preload" as="image" href="/images/logo/opticore.webp" fetchpriority="high">
        <link rel="preload" as="image" href="/images/logo/opticore-white.webp" fetchpriority="high">

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        {{-- Only Roboto Mono is actually rendered: --font-sans resolves to the self-hosted Geist Variable font (see resources/css/app.css), so Plus Jakarta Sans was never visible. --}}
        {{-- Roboto Mono isn't needed for first paint (body text uses the self-hosted Geist font), so load it without blocking the render: swap the media type once it's fetched. An inline `onload` attribute can't satisfy CSP (hashes don't cover event-handler attributes), so the swap runs from an inline <script> instead, which SecurityHeaders hashes and allows like any other inline script here. --}}
        <link
            id="font-roboto-mono"
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;600&display=swap"
            media="print"
        >
        <script>
            document.getElementById('font-roboto-mono').addEventListener('load', function () {
                this.media = 'all';
            });
        </script>
        <noscript>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;600&display=swap">
        </noscript>

        {{-- Google Tag Manager --}}
        <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-P6NS89RJ');</script>
        {{-- End Google Tag Manager --}}

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
            <title>{{ $pageTitle ?? 'Opticore Solutions Limited' }}</title>
            @isset($pageDescription)
                <meta name="description" content="{{ $pageDescription }}">
            @endisset
        </x-inertia::head>
    </head>
    <body class="bg-background font-sans antialiased">
        {{-- Google Tag Manager (noscript) --}}
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-P6NS89RJ"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
        {{-- End Google Tag Manager (noscript) --}}
        <x-inertia::app />
    </body>
</html>
