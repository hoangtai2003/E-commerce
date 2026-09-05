from django.db import transaction
from rest_framework.exceptions import ValidationError

from inventory.services import record_movement
from suppliers.models import Supplier
from .models import PurchaseInvoice, PurchaseInvoiceItem


def _next_purchase_code():
    count = PurchaseInvoice.objects.count()
    return f'PN-{count + 1:04d}'


def create_purchase_invoice(*, supplier_id, items, staff=None, invoice_number=None, invoice_file=None, note=None):
    if not items:
        raise ValidationError({'items': ['Phiếu nhập hàng phải có ít nhất 1 sản phẩm.']})

    try:
        supplier = Supplier.objects.get(pk=supplier_id)
    except Supplier.DoesNotExist:
        raise ValidationError({'supplier': ['Không tìm thấy nhà cung cấp.']})

    with transaction.atomic():
        invoice = PurchaseInvoice.objects.create(
            code=_next_purchase_code(),
            supplier=supplier,
            staff=staff,
            invoice_number=invoice_number,
            invoice_file=invoice_file,
            note=note,
        )

        total_amount = 0
        for item in items:
            variant = item['variant']
            quantity = item['quantity']
            unit_cost = item['unit_cost']
            line_total = unit_cost * quantity

            PurchaseInvoiceItem.objects.create(
                purchase_invoice=invoice,
                variant=variant,
                quantity=quantity,
                unit_cost=unit_cost,
                line_total=line_total,
            )

            record_movement(
                variant_id=variant.id,
                movement_type='purchase',
                quantity=quantity,
                ref_type='purchase_invoice',
                ref_id=invoice.id,
                staff=staff,
            )

            variant.cost_price = unit_cost
            variant.save(update_fields=['cost_price'])

            total_amount += line_total

        invoice.total_amount = total_amount
        invoice.save(update_fields=['total_amount'])

    return invoice
