import { apiRequest } from './api';
import type { Customer } from '../types';

type ApiCustomer = {
    id: number;
    full_name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    tier: 'new' | 'loyal' | 'vip';
    total_orders: number;
    total_spent: number;
    joined_at: string;
    created_at: string;
    deleted_at: string | null;
};

function toCustomer(api: ApiCustomer): Customer {
    return {
        id: api.id,
        name: api.full_name,
        email: api.email ?? '',
        phone: api.phone ?? '',
        joined: api.joined_at,
        orders: api.total_orders,
        spent: api.total_spent,
        tier: api.tier,
    };
}

export async function getCustomers(): Promise<Customer[]> {
    const data = await apiRequest<ApiCustomer[]>('/customers/');
    return data.map(toCustomer);
}
