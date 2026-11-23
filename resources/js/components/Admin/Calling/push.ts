import { api } from '@/lib/apiFetch';
import pushRoutes from '@/routes/admin/leads/push';

/**
 * "Get call alerts on this device": registers the /admin/ service worker
 * and a browser push subscription, and tells the CMS about it.
 */
export type PushState = 'unsupported' | 'blocked' | 'off' | 'on';

export function pushSupported(): boolean {
    return (
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
    );
}

async function registration(): Promise<ServiceWorkerRegistration> {
    return navigator.serviceWorker.register('/admin-sw.js', {
        scope: '/admin/',
    });
}

export async function pushState(): Promise<PushState> {
    if (!pushSupported()) {
        return 'unsupported';
    }

    if (Notification.permission === 'denied') {
        return 'blocked';
    }

    const reg = await navigator.serviceWorker.getRegistration('/admin/');
    const sub = await reg?.pushManager.getSubscription();

    return sub ? 'on' : 'off';
}

function keyBytes(base64: string): Uint8Array<ArrayBuffer> {
    const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4))
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const raw = atob(padded);
    const bytes = new Uint8Array(new ArrayBuffer(raw.length));

    for (let i = 0; i < raw.length; i++) {
        bytes[i] = raw.charCodeAt(i);
    }

    return bytes;
}

export async function enablePush(publicKey: string): Promise<PushState> {
    if (!pushSupported()) {
        return 'unsupported';
    }

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
        return permission === 'denied' ? 'blocked' : 'off';
    }

    const reg = await registration();
    await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();

    if (sub) {
        // Subscriptions made with older keys don't work any more.
        await sub.unsubscribe();
    }

    sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes(publicKey),
    });

    const json = sub.toJSON();
    await api.post(pushRoutes.subscribe.url(), {
        endpoint: json.endpoint,
        keys: json.keys,
        content_encoding: (
            PushManager.supportedContentEncodings ?? ['aes128gcm']
        ).includes('aes128gcm')
            ? 'aes128gcm'
            : 'aesgcm',
    });

    return 'on';
}

export async function disablePush(): Promise<PushState> {
    const reg = await navigator.serviceWorker.getRegistration('/admin/');
    const sub = await reg?.pushManager.getSubscription();

    if (sub) {
        await api.delete(pushRoutes.unsubscribe.url(), {
            endpoint: sub.endpoint,
        });
        await sub.unsubscribe();
    }

    return 'off';
}
