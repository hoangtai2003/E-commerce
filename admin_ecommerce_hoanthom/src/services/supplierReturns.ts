import { apiRequest } from './api';

export type SupplierReturnStatus = 'pending' | 'approved' | 'rejected';
export type SupplierRefundMethod = 'cash' | 'transfer' | 'credit_note';

export type ApiSupplierReturnItem = {
    id: number;
    supplier_return: number;
    variant: number;
    quantity: number;
    unit_cost: number;
    line_total: number;
};

export type ApiSupplierReturn = {
    id: number;
    code: string;
    supplier: number;
    staff: number | null;
    status: SupplierReturnStatus;
    reason: string | null;
    refund_amount: number;
    refund_method: SupplierRefundMethod | null;
    created_at: string;
    processed_at: string | null;
    items: ApiSupplierReturnItem[];
};

export type CreateSupplierReturnPayload = {
    supplier: number;
    reason?: string | null;
    items: { variant: number; quantity: number }[];
};

export function getSupplierReturns() {
    return apiRequest<ApiSupplierReturn[]>('/supplier-returns/');
}

export function createSupplierReturn(payload: CreateSupplierReturnPayload) {
    return apiRequest<ApiSupplierReturn>('/supplier-returns/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function approveSupplierReturn(id: number, refund_method: SupplierRefundMethod) {
    return apiRequest<ApiSupplierReturn>(`/supplier-returns/${id}/approve/`, {
        method: 'POST',
        body: JSON.stringify({ refund_method }),
    });
}

export function rejectSupplierReturn(id: number) {
    return apiRequest<ApiSupplierReturn>(`/supplier-returns/${id}/reject/`, {
        method: 'POST',
    });
}
