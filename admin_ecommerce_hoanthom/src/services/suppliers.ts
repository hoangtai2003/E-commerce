import { apiRequest } from './api';
import type { Supplier } from '../types';

export type SupplierPayload = {
    name: string;
    contact_name: string;
    phone: string;
    email: string;
    address: string;
    note: string;
};

export function getSuppliers() {
    return apiRequest<Supplier[]>('/suppliers/');
}

export function createSupplier(payload: SupplierPayload) {
    return apiRequest<Supplier>('/suppliers/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function updateSupplier(id: number, payload: SupplierPayload) {
    return apiRequest<Supplier>(`/suppliers/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export function deleteSupplier(id: number) {
    return apiRequest<void>(`/suppliers/${id}/`, {
        method: 'DELETE',
    });
}
