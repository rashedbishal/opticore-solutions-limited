function getCsrf(): string {
    return (
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.content ?? ''
    );
}

function getSocketId(): string | null {
    try {
        return (window as any).__echoInstance?.socketId?.() ?? null;
    } catch {
        return null;
    }
}

async function apiFetch<T = unknown>(
    url: string,
    options: RequestInit = {},
): Promise<{ data: T; status: number }> {
    const socketId = getSocketId();

    const headers: Record<string, string> = {
        Accept: 'application/json',
        'X-CSRF-TOKEN': getCsrf(),
        'X-Requested-With': 'XMLHttpRequest',
        ...(socketId ? { 'X-Socket-ID': socketId } : {}),
    };

    if (options.body !== undefined && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            ...headers,
            ...((options.headers as Record<string, string>) ?? {}),
        },
    });

    if (!response.ok) {
        const err: any = new Error(`HTTP ${response.status}`);

        err.response = response;
        err.status = response.status;

        try {
            err.responseData = await response.json();
        } catch {
            // ignore
        }

        throw err;
    }

    const contentType = response.headers.get('content-type') ?? '';
    const data: T = contentType.includes('application/json')
        ? await response.json()
        : ((await response.text()) as unknown as T);

    return { data, status: response.status };
}

export const api = {
    get: <T = unknown>(url: string) => apiFetch<T>(url, { method: 'GET' }),
    post: <T = unknown>(url: string, body?: unknown) =>
        apiFetch<T>(url, {
            method: 'POST',
            body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
        }),
    put: <T = unknown>(url: string, body?: unknown) =>
        apiFetch<T>(url, {
            method: 'PUT',
            body: JSON.stringify(body ?? {}),
        }),
    patch: <T = unknown>(url: string, body?: unknown) =>
        apiFetch<T>(url, {
            method: 'PATCH',
            body: JSON.stringify(body ?? {}),
        }),
    delete: <T = unknown>(url: string, body?: unknown) =>
        apiFetch<T>(url, {
            method: 'DELETE',
            body: body !== undefined ? JSON.stringify(body) : undefined,
        }),
};

export default apiFetch;
