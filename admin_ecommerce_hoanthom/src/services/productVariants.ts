import { apiRequest } from './api';

export type ApiProductVariant = {
    id: number;
    product: number;
    sku: string;
    variant_name: string | null;
    size: string | null;
    color: string | null;
    price: number;
    cost_price: number | null;
    stock: number;
    low_stock_threshold: number;
    variant_status: 'active' | 'low' | 'out' | 'hidden';
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
};

export type ProductVariantPayload = {
    product: number;
    sku: string;
    variant_name?: string | null;
    size?: string | null;
    color?: string | null;
    price: number;
    cost_price?: number | null;
    low_stock_threshold?: number;
    variant_status?: 'active' | 'low' | 'out' | 'hidden';
};

export function getProductVariants() {
    return apiRequest<ApiProductVariant[]>('/product-variants/');
}

export function createProductVariant(payload: ProductVariantPayload) {
    return apiRequest<ApiProductVariant>('/product-variants/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function updateProductVariant(id: number, payload: ProductVariantPayload) {
    return apiRequest<ApiProductVariant>(`/product-variants/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export function deleteProductVariant(id: number) {
    return apiRequest<void>(`/product-variants/${id}/`, {
        method: 'DELETE',
    });
}
