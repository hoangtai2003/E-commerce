import { apiRequest } from './api';

export type MovementType = 'sale' | 'purchase' | 'return' | 'adjustment' | 'supplier_return';

export type ApiInventoryMovement = {
    id: number;
    variant: number;
    movement_type: MovementType;
    quantity: number;
    stock_after: number;
    ref_type: string | null;
    ref_id: number | null;
    note: string | null;
    staff: number | null;
    created_at: string;
};

export type CreateMovementPayload = {
    variant: number;
    movement_type: MovementType;
    quantity: number;
    note?: string | null;
    staff?: number | null;
};

export function getInventoryMovements() {
    return apiRequest<ApiInventoryMovement[]>('/inventory-movements/');
}

export function createInventoryMovement(payload: CreateMovementPayload) {
    return apiRequest<ApiInventoryMovement>('/inventory-movements/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}
