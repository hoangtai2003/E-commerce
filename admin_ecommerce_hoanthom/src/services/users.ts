import { apiRequest } from './api';

export type ApiUser = {
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

export type UserPayload = {
    role: number;
    full_name: string;
    email: string;
    phone?: string | null;
    status?: 'active' | 'inactive';
    password?: string;
};

export function getUsers() {
    return apiRequest<ApiUser[]>('/users/');
}

export function createUser(payload: UserPayload) {
    return apiRequest<ApiUser>('/users/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function updateUser(id: number, payload: UserPayload) {
    return apiRequest<ApiUser>(`/users/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export function deleteUser(id: number) {
    return apiRequest<void>(`/users/${id}/`, {
        method: 'DELETE',
    });
}
