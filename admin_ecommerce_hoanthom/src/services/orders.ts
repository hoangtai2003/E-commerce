import { apiRequest } from './api';

export type OrderStatus = 'pending' | 'shipping' | 'completed' | 'cancelled';
export type PaymentMethod = 'cod' | 'transfer' | 'card' | 'momo' | 'cash';

export type ApiOrderItem = {
    id: number;
    order: number;
    variant: number;
    product_name: string;
    variant_name: string | null;
    unit_price: number;
    quantity: number;
    line_total: number;
};

export type ApiOrder = {
    id: number;
    code: string;
    customer: number | null;
    staff: number | null;
    promotion: number | null;
    channel: 'online' | 'pos';
    status: OrderStatus;
    payment_method: PaymentMethod;
    subtotal: number;
    discount_amount: number;
    total: number;
    amount_paid: number | null;
    note: string | null;
    ordered_at: string;
    created_at: string;
    updated_at: string;
    items: ApiOrderItem[];
};

export type CreateOrderPayload = {
    customer?: number | null;
    staff?: number | null;
    promotion?: number | null;
    channel?: 'online' | 'pos';
    status?: OrderStatus;
    payment_method?: PaymentMethod;
    amount_paid?: number | null;
    note?: string | null;
    ordered_at?: string;
    items: { variant: number; quantity: number }[];
};

export type UpdateOrderPayload = Partial<{
    status: OrderStatus;
    payment_method: PaymentMethod;
    amount_paid: number | null;
    note: string | null;
}>;

export function getOrders() {
    return apiRequest<ApiOrder[]>('/orders/');
}

export function createOrder(payload: CreateOrderPayload) {
    return apiRequest<ApiOrder>('/orders/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function updateOrder(id: number, payload: UpdateOrderPayload) {
    return apiRequest<ApiOrder>(`/orders/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
}
