import type { Customer, Promo } from '../../types';
import type { ApiProductVariant } from '../../services/productVariants';
import type { PaymentMethod } from '../../services/orders';

export const fmtMoney = (n: number) => n.toLocaleString("vi-VN") + "₫";

export const initials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return (parts.length > 1 ? parts.at(-2)![0] + parts.at(-1)![0] : parts[0].slice(0, 2)).toUpperCase();
};

export const PAYMENT_METHOD_MAP: Record<string, PaymentMethod> = {
    'Tiền mặt': 'cash',
    'Chuyển khoản': 'transfer',
    'Thẻ tín dụng': 'card',
    'Ví MoMo': 'momo',
};

export const variantLabel = (v: ApiProductVariant) => v.variant_name || [v.size, v.color].filter(Boolean).join(' / ') || v.sku;

export interface PosVariant {
    id: number;
    label: string;
    price: number;
    stock: number;
    sku: string;
}

export interface PosProduct {
    id: number;
    name: string;
    categoryName: string;
    totalStock: number;
    isActive: boolean;
    variants: PosVariant[];
    thumbnailUrl: string | null;
}

export interface CartItem {
    variantId: number;
    productId: number;
    productName: string;
    variantLabel: string | null;
    price: number;
    qty: number;
    maxStock: number;
    thumbnailUrl: string | null;
}

export interface HeldOrder {
    time: string;
    name: string;
    cart: CartItem[];
    promo: Promo | null;
    customer: Customer | null;
    payment: string;
}

export interface LastOrderSummary {
    code: string;
    customerName: string;
    total: number;
    payment: string;
    cashGiven: number;
}
