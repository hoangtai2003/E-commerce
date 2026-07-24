import { apiRequest } from './api';

export type ApiMe = {
    id: number;
    role: number;
    full_name: string;
    email: string;
    phone: string | null;
    status: 'active' | 'inactive';
    last_active_at: string | null;
    created_at: string;
    deleted_at: string | null;
};

export function login(email: string, password: string) {
    return apiRequest<ApiMe>('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

export function logout() {
    return apiRequest<void>('/auth/logout/', { method: 'POST' });
}

export function getMe() {
    return apiRequest<ApiMe>('/auth/me/');
}
