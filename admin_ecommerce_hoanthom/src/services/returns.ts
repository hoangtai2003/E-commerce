import { apiRequest } from './api';

export type ReturnStatus = 'pending' | 'approved' | 'rejected';
export type RefundMethod = 'cash' | 'transfer' | 'card' | 'momo';

export type ApiReturnItem = {
    id: number;
    return_slip: number;
    order_item: number;
    variant: number;
    quantity: number;
    unit_price: number;
    line_total: number;
};

export type ApiReturn = {
    id: number;
    code: string;
    order: number;
    staff: number | null;
    status: ReturnStatus;
    reason: string | null;
    refund_amount: number;
    refund_method: RefundMethod | null;
    created_at: string;
    processed_at: string | null;
    items: ApiReturnItem[];
};

export type CreateReturnPayload = {
    order: number;
    reason?: string | null;
    items: { order_item: number; quantity: number }[];
};

export function getReturns() {
    return apiRequest<ApiReturn[]>('/returns/');
}

export function createReturn(payload: CreateReturnPayload) {
    return apiRequest<ApiReturn>('/returns/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function approveReturn(id: number, refund_method: RefundMethod) {
    return apiRequest<ApiReturn>(`/returns/${id}/approve/`, {
        method: 'POST',
        body: JSON.stringify({ refund_method }),
    });
}

export function rejectReturn(id: number) {
    return apiRequest<ApiReturn>(`/returns/${id}/reject/`, {
        method: 'POST',
    });
}
