const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://[IP_ADDRESS]/api';

export class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });

    if (!res.ok) {
        const body = await res.text();
        throw new ApiError(res.status, body || res.statusText);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
}
