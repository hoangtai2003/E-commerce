import { apiRequest } from './api';

export type ApiRole = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    permissions: Record<string, string[]> | null;
    created_at: string;
};

export function getRoles() {
    return apiRequest<ApiRole[]>('/roles/');
}
