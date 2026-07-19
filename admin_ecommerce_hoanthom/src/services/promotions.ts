import { apiRequest } from './api';
import type { Promo } from '../types';

type ApiPromotion = {
    id: number;
    code: string;
    description: string | null;
    discount_type: 'percent' | 'fixed';
    discount_value: number;
    min_order: number;
    usage_limit: number;
    used_count: number;
    starts_at: string | null;
    ends_at: string | null;
    is_active: boolean;
    created_at: string;
};

export type PromotionPayload = {
    code: string;
    description?: string | null;
    discount_type: 'percent' | 'fixed';
    discount_value: number;
    min_order?: number;
    usage_limit?: number;
    starts_at?: string | null;
    ends_at?: string | null;
    is_active?: boolean;
};

function toPromo(api: ApiPromotion): Promo {
    return {
        id: api.id,
        code: api.code,
        type: api.discount_type,
        value: api.discount_value,
        minOrder: api.min_order,
        used: api.used_count,
        limit: api.usage_limit,
        end: api.ends_at ?? '',
        active: api.is_active,
        desc: api.description ?? '',
    };
}

export async function getPromotions(): Promise<Promo[]> {
    const data = await apiRequest<ApiPromotion[]>('/promotions/');
    return data.map(toPromo);
}

export async function createPromotion(payload: PromotionPayload): Promise<Promo> {
    const created = await apiRequest<ApiPromotion>('/promotions/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return toPromo(created);
}

export async function updatePromotion(id: number, payload: PromotionPayload): Promise<Promo> {
    const updated = await apiRequest<ApiPromotion>(`/promotions/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
    return toPromo(updated);
}

export async function togglePromotionActive(id: number, isActive: boolean): Promise<Promo> {
    const updated = await apiRequest<ApiPromotion>(`/promotions/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive }),
    });
    return toPromo(updated);
}

export function deletePromotion(id: number) {
    return apiRequest<void>(`/promotions/${id}/`, {
        method: 'DELETE',
    });
}
