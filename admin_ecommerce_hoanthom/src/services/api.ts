const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://[IP_ADDRESS]/api';

export class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

let refreshPromise: Promise<boolean> | null = null;

function refreshAccessToken(): Promise<boolean> {
    if (!refreshPromise) {
        refreshPromise = fetch(`${API_BASE_URL}/auth/refresh/`, {
            method: 'POST',
            credentials: 'include',
        })
            .then(res => res.ok)
            .catch(() => false)
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
}

async function fetchWithAuthRetry(url: string, options: RequestInit, isAuthEndpoint: boolean): Promise<Response> {
    let res = await fetch(url, { credentials: 'include', ...options });

    if (res.status === 401 && !isAuthEndpoint) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            res = await fetch(url, { credentials: 'include', ...options });
        }
        if (res.status === 401) {
            window.dispatchEvent(new CustomEvent('auth:expired'));
        }
    }

    return res;
}

const NO_RETRY_PATHS = ['/auth/login/', '/auth/refresh/', '/auth/logout/'];

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetchWithAuthRetry(`${API_BASE_URL}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    }, NO_RETRY_PATHS.includes(path));

    if (!res.ok) {
        const body = await res.text();
        throw new ApiError(res.status, body || res.statusText);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
    const res = await fetchWithAuthRetry(`${API_BASE_URL}${path}`, {
        method: 'POST',
        body: formData,
    }, false);

    if (!res.ok) {
        const body = await res.text();
        throw new ApiError(res.status, body || res.statusText);
    }

    return res.json() as Promise<T>;
}
