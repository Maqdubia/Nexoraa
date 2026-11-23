
const CACHE_PREFIX = "nexora-pwa-";
const SHELL_CACHE = CACHE_PREFIX + "shell-v1";
const STATIC_CACHE = CACHE_PREFIX + "static-v1";

const APP_SHELL_KEY = "/__nexora_offline_shell__";

const STATIC_ASSETS = [
    "/static/manifest.webmanifest"
];

// Install service worker.
self.addEventListener("install", (event) => {
    event.waitUntil(
        (async () => {
            const shellCache = await caches.open(SHELL_CACHE);

            try {
                const response = await fetch("/login", {
                    cache: "no-cache"
                });

                if (response.ok) {
                    await shellCache.put(
                        APP_SHELL_KEY,
                        response.clone()
                    );
                }
            } catch (error) {
                console.log("NEXORA shell will be cached on first visit.");
            }

            const staticCache = await caches.open(STATIC_CACHE);

            await Promise.all(
                STATIC_ASSETS.map(async (asset) => {
                    try {
                        const response = await fetch(asset);

                        if (response.ok) {
                            await staticCache.put(asset, response);
                        }
                    } catch (error) {
                        console.log("Static asset unavailable:", asset);
                    }
                })
            );

            await self.skipWaiting();
        })()
    );
});

// Activate and clean older Nexora caches.
self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const cacheNames = await caches.keys();

            await Promise.all(
                cacheNames
                    .filter(
                        (name) =>
                            name.startsWith(CACHE_PREFIX) &&
                            name !== SHELL_CACHE &&
                            name !== STATIC_CACHE
                    )
                    .map((name) => caches.delete(name))
            );

            await self.clients.claim();
        })()
    );
});

// Handle network requests.
self.addEventListener("fetch", (event) => {
    const request = event.request;

    if (request.method !== "GET") return;

    const url = new URL(request.url);

    if (url.origin !== self.location.origin) return;

    // Never cache private or sensitive application data.
    if (
        url.pathname.startsWith("/api/") ||
        url.pathname.startsWith("/media/") ||
        url.pathname.startsWith("/admin/")
    ) {
        return;
    }

    // Network-first navigation with offline fallback.
    if (request.mode === "navigate") {
        event.respondWith(
            (async () => {
                try {
                    const response = await fetch(request);

                    if (response.ok) {
                        const cache = await caches.open(SHELL_CACHE);

                        await cache.put(
                            APP_SHELL_KEY,
                            response.clone()
                        );
                    }

                    return response;
                } catch (error) {
                    const cache = await caches.open(SHELL_CACHE);
                    const cached = await cache.match(APP_SHELL_KEY);

                    if (cached) return cached;

                    return new Response(
                        "NEXORA is offline. Please reconnect to the internet.",
                        {
                            status: 503,
                            headers: {
                                "Content-Type": "text/plain; charset=utf-8"
                            }
                        }
                    );
                }
            })()
        );

        return;
    }

    // Cache public, built frontend assets only.
    const isFrontendAsset =
        url.pathname.startsWith("/static/assets/");

    const isPwaAsset =
        STATIC_ASSETS.includes(url.pathname);

    if (!isFrontendAsset && !isPwaAsset) return;

    event.respondWith(
        (async () => {
            const cache = await caches.open(STATIC_CACHE);
            const cached = await cache.match(request);

            if (cached) return cached;

            try {
                const response = await fetch(request);

                if (response.ok) {
                    await cache.put(request, response.clone());
                }

                return response;
            } catch (error) {
                return new Response(
                    "This resource is unavailable offline.",
                    { status: 504 }
                );
            }
        })()
    );
});
