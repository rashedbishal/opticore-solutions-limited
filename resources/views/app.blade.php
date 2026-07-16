<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="color-scheme" content="light dark">
        <meta name="theme-color" content="#fcfcfd">

        <meta name="csrf-token" content="{{ csrf_token() }}">
        <link rel="canonical" href="{{ url()->current() }}">
        <link rel="icon" href="/favicon.ico" sizes="any">

        {{-- Organization/WebSite JSON-LD so Google can understand the brand's
             identity and social profiles (a contributing signal toward rich
             results like sitelinks — not something that can be forced
             directly). Built from the same SiteSetting singleton the footer
             uses, so it stays in sync with the admin-editable social links.

             The '@@context'/'@@type'/etc keys below use Blade's '@@' escape:
             Blade scans the whole file for `@word` directives even inside
             PHP code, and Laravel's built-in `@context`/`@endcontext`
             directive (for the Context facade) would otherwise silently
             swallow the literal "@context" JSON-LD key. --}}
        @php($siteSettings = \App\Models\SiteSetting::current()->toPublicArray())
        <script type="application/ld+json">
            {!! json_encode([
                '@@context' => 'https://schema.org',
                '@@graph' => [
                    [
                        '@@type' => 'Organization',
                        '@@id' => url('/').'#organization',
                        'name' => config('app.name'),
                        'url' => url('/'),
                        'logo' => asset('images/logo/opticore.png'),
                        'email' => $siteSettings['email'],
                        'sameAs' => array_values(array_filter([
                            $siteSettings['socialFacebook'],
                            $siteSettings['socialX'],
                            $siteSettings['socialInstagram'],
                            $siteSettings['socialLinkedin'],
                            $siteSettings['socialYoutube'],
                            $siteSettings['socialBehance'],
                            $siteSettings['socialPinterest'],
                            $siteSettings['socialTiktok'],
                        ])),
                    ],
                    [
                        '@@type' => 'WebSite',
                        '@@id' => url('/').'#website',
                        'name' => config('app.name'),
                        'url' => url('/'),
                        'publisher' => ['@@id' => url('/').'#organization'],
                    ],
                ],
            ], JSON_UNESCAPED_SLASHES) !!}
        </script>

        {{-- Preload both logos so they're ready before React paints the navbar.
             Both are ~7 KB so the cost of fetching both is negligible, and
             media-query-conditioned preloads are poorly supported and cause
             console warnings when the query doesn't match. --}}
        <link rel="preload" as="image" href="/images/logo/opticore.webp" fetchpriority="high">
        <link rel="preload" as="image" href="/images/logo/opticore-white.webp" fetchpriority="high">

        {{-- Metropolis ExtraBold (weight 800, see .site-typography's h1-h6 rule
             in app.css) is the heaviest-used heading weight — the homepage hero
             <h1> and SectionHeader.tsx both render in it above the fold. It's
             self-hosted with font-display: swap, so without a preload hint the
             browser only discovers it needs the file once it parses the CSS and
             matches it against the DOM, fetching it later than necessary and
             widening the visible fallback-font flash/reflow on first paint.
             Preloading here starts the fetch in parallel with app.css/app.tsx. --}}
        <link rel="preload" as="font" type="font/woff2" href="{{ \Illuminate\Support\Facades\Vite::asset('resources/fonts/metropolis/Metropolis-ExtraBold.woff2') }}" crossorigin>

        {{-- Inter Variable (regular, non-italic) is the body-copy font on every
             public page (--font-sans in app.css), so unlike the headline weight
             above it's needed for nearly all above-the-fold text, not just
             headings. Same rationale: without this hint the browser only
             discovers it after parsing app.css. Only the non-italic axis is
             preloaded — italic text is rare enough on this site that eagerly
             fetching both weights isn't worth the extra bytes on the critical
             path. --}}
        <link rel="preload" as="font" type="font/woff2" href="{{ \Illuminate\Support\Facades\Vite::asset('resources/fonts/Inter/Inter-VariableFont_opsz,wght.woff2') }}" crossorigin>

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

        {{-- Google Tag Manager: injected on first user interaction (mirroring the
             same interaction-or-fallback-timeout pattern AppLayout uses to defer
             the chat widgets), rather than on `load`. gtm.js's evaluation and the
             tags/pixels it loads in turn are the single largest main-thread cost
             on this site, so keeping it off the critical path until the visitor
             has actually engaged (or a fallback timer elapses) keeps it from
             competing with hydration and initial rendering. --}}
        <script>
            (function () {
                var fired = false;

                function loadGTM() {
                    if (fired) {
                        return;
                    }
                    fired = true;

                    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                    })(window,document,'script','dataLayer','GTM-P6NS89RJ');

                    events.forEach(function (event) {
                        window.removeEventListener(event, loadGTM);
                    });
                    clearTimeout(fallbackTimer);
                }

                var events = ['mousemove', 'touchstart', 'keydown', 'scroll'];
                events.forEach(function (event) {
                    window.addEventListener(event, loadGTM, {
                        once: true,
                        passive: true,
                    });
                });

                // Fallback so visitors who never interact (or bots) still get
                // tracked eventually, instead of never loading GTM at all.
                var fallbackTimer = setTimeout(loadGTM, 8000);
            })();
        </script>
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
                        var meta = document.querySelector('meta[name="theme-color"]');
                        if (meta) {
                            meta.setAttribute('content', '#0a0a0a');
                        }
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
