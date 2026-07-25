from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from inventory.services import record_movement
from suppliers.models import Supplier
from .models import SupplierReturn, SupplierReturnItem


def _next_supplier_return_code():
    count = SupplierReturn.objects.count()
    return f'TNCC-{count + 1:04d}'


def _reserved_pending_qty(variant_id):
    """Số lượng đang bị "giữ chỗ" bởi các phiếu trả NCC khác đang chờ duyệt cho cùng
    variant — tránh 2 phiếu pending cùng lúc cộng dồn vượt quá tồn kho thực tế."""
    total = SupplierReturnItem.objects.filter(
        variant_id=variant_id,
        supplier_return__status='pending',
    ).aggregate(total=Sum('quantity'))['total']
    return total or 0


def create_supplier_return(*, supplier_id, items, staff=None, reason=None):
    if not items:
        raise ValidationError({'items': ['Phiếu trả hàng phải có ít nhất 1 sản phẩm.']})

    try:
        supplier = Supplier.objects.get(pk=supplier_id)
    except Supplier.DoesNotExist:
        raise ValidationError({'supplier': ['Không tìm thấy nhà cung cấp.']})

    with transaction.atomic():
        supplier_return = SupplierReturn.objects.create(
            code=_next_supplier_return_code(),
            supplier=supplier,
            staff=staff,
            status='pending',
            reason=reason,
        )

        refund_amount = 0
        for item in items:
            variant = item['variant']
            quantity = item['quantity']

            already_reserved = _reserved_pending_qty(variant.id)
            remaining = variant.stock - already_reserved
            if quantity > remaining:
                raise ValidationError({
                    'items': [f'Số lượng trả cho "{variant.sku}" vượt quá tồn kho hiện có thể trả ({max(0, remaining)}).']
                })

            unit_cost = variant.cost_price or 0
            line_total = unit_cost * quantity

            SupplierReturnItem.objects.create(
                supplier_return=supplier_return,
                variant=variant,
                quantity=quantity,
                unit_cost=unit_cost,
                line_total=line_total,
            )
            refund_amount += line_total

        supplier_return.refund_amount = refund_amount
        supplier_return.save(update_fields=['refund_amount'])

    return supplier_return


def approve_supplier_return(supplier_return_id, *, staff=None, refund_method=None):
    with transaction.atomic():
        try:
            supplier_return = SupplierReturn.objects.select_for_update().get(pk=supplier_return_id)
        except SupplierReturn.DoesNotExist:
            raise ValidationError({'detail': 'Không tìm thấy phiếu trả hàng nhà cung cấp.'})

        if supplier_return.status != 'pending':
            raise ValidationError({'status': ['Phiếu trả hàng này đã được xử lý, không thể duyệt lại.']})

        for item in supplier_return.items.all():
            record_movement(
                variant_id=item.variant_id,
                movement_type='supplier_return',
                quantity=-item.quantity,
                ref_type='supplier_return',
                ref_id=supplier_return.id,
                staff=staff,
            )

        supplier_return.status = 'approved'
        supplier_return.processed_at = timezone.now()
        if refund_method:
            supplier_return.refund_method = refund_method
        supplier_return.save(update_fields=['status', 'processed_at', 'refund_method'])

    return supplier_return


def reject_supplier_return(supplier_return_id, *, staff=None):
    with transaction.atomic():
        try:
            supplier_return = SupplierReturn.objects.select_for_update().get(pk=supplier_return_id)
        except SupplierReturn.DoesNotExist:
            raise ValidationError({'detail': 'Không tìm thấy phiếu trả hàng nhà cung cấp.'})

        if supplier_return.status != 'pending':
            raise ValidationError({'status': ['Phiếu trả hàng này đã được xử lý, không thể từ chối lại.']})

        supplier_return.status = 'rejected'
        supplier_return.processed_at = timezone.now()
        supplier_return.save(update_fields=['status', 'processed_at'])

    return supplier_return
