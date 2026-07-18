import { apiRequest } from './api';

export type ApiProduct = {
    id: number;
    category: number;
    default_supplier: number | null;
    name: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
};

export type ProductPayload = {
    category: number;
    name: string;
    description?: string | null;
    is_active: boolean;
};

export function getProducts() {
    return apiRequest<ApiProduct[]>('/products/');
}

export function createProduct(payload: ProductPayload) {
    return apiRequest<ApiProduct>('/products/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function updateProduct(id: number, payload: ProductPayload) {
    return apiRequest<ApiProduct>(`/products/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export function deleteProduct(id: number) {
    return apiRequest<void>(`/products/${id}/`, {
        method: 'DELETE',
    });
}
