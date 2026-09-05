import { apiRequest, apiUpload } from './api';

export type ApiPurchaseInvoiceItem = {
    id: number;
    purchase_invoice: number;
    variant: number;
    quantity: number;
    unit_cost: number;
    line_total: number;
};

export type ApiPurchaseInvoice = {
    id: number;
    code: string;
    supplier: number;
    staff: number | null;
    invoice_number: string | null;
    invoice_file: string | null;
    total_amount: number;
    note: string | null;
    created_at: string;
    items: ApiPurchaseInvoiceItem[];
};

export type CreatePurchaseInvoicePayload = {
    supplier: number;
    invoice_number?: string | null;
    invoice_file?: string | null;
    note?: string | null;
    items: { variant: number; quantity: number; unit_cost: number }[];
};

export type UploadedInvoiceFile = {
    file_url: string;
    file_name: string;
    file_size: number;
};

export function uploadInvoiceFile(file: File) {
    const form = new FormData();
    form.append('file', file);
    return apiUpload<UploadedInvoiceFile>('/purchase-invoices/upload-file/', form);
}

export function getPurchaseInvoices() {
    return apiRequest<ApiPurchaseInvoice[]>('/purchase-invoices/');
}

export function createPurchaseInvoice(payload: CreatePurchaseInvoicePayload) {
    return apiRequest<ApiPurchaseInvoice>('/purchase-invoices/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}
