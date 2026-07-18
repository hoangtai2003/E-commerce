import { apiRequest, apiUpload } from './api';

export type ApiProductImage = {
    id: number;
    product: number;
    variant: number | null;
    image_url: string;
    thumbnail_url: string | null;
    alt_text: string | null;
    is_primary: boolean;
    sort_order: number;
    file_size: number | null;
    width: number | null;
    height: number | null;
    created_at: string;
    deleted_at: string | null;
};

export type ProductImagePayload = {
    product: number;
    variant?: number | null;
    image_url: string;
    thumbnail_url?: string | null;
    alt_text?: string | null;
    is_primary?: boolean;
    sort_order?: number;
    file_size?: number | null;
    width?: number | null;
    height?: number | null;
};

export type UploadedImageInfo = {
    image_url: string;
    thumbnail_url: string;
    file_size: number;
    width: number;
    height: number;
};

export function uploadImageFile(file: File) {
    const form = new FormData();
    form.append('file', file);
    return apiUpload<UploadedImageInfo>('/products/upload-image/', form);
}

export function getProductImages() {
    return apiRequest<ApiProductImage[]>('/product-images/');
}

export function createProductImage(payload: ProductImagePayload) {
    return apiRequest<ApiProductImage>('/product-images/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function updateProductImage(id: number, payload: Partial<ProductImagePayload>) {
    return apiRequest<ApiProductImage>(`/product-images/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
}

export function deleteProductImage(id: number) {
    return apiRequest<void>(`/product-images/${id}/`, {
        method: 'DELETE',
    });
}
