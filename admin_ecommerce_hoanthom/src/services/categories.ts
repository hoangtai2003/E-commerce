import { apiRequest } from './api';
import type { Category } from '../types';

export type CategoryPayload = {
    name: string;
    description: string;
    status: 'active' | 'hidden';
};

export function getCategories() {
    return apiRequest<Category[]>('/categories/');
}

export function createCategory(payload: CategoryPayload) {
    return apiRequest<Category>('/categories/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function updateCategory(id: number, payload: CategoryPayload) {
    return apiRequest<Category>(`/categories/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export function deleteCategory(id: number) {
    return apiRequest<void>(`/categories/${id}/`, {
        method: 'DELETE',
    });
}
