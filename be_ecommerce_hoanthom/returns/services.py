from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from inventory.services import record_movement
from orders.models import Order
from .models import Return, ReturnItem


def _next_return_code():
    count = Return.objects.count()
    return f'TH-{count + 1:04d}'


def _already_returned_qty(order_item_id):
    total = ReturnItem.objects.filter(
        order_item_id=order_item_id
    ).exclude(
        return_slip__status='rejected'
    ).aggregate(total=Sum('quantity'))['total']
    return total or 0


def create_return(*, order_id, items, staff=None, reason=None):
    if not items:
        raise ValidationError({'items': ['Phiếu trả hàng phải có ít nhất 1 sản phẩm.']})

    try:
        order = Order.objects.get(pk=order_id)
    except Order.DoesNotExist:
        raise ValidationError({'order': ['Không tìm thấy đơn hàng.']})

    with transaction.atomic():
        return_obj = Return.objects.create(
            code=_next_return_code(),
            order=order,
            staff=staff,
            status='pending',
            reason=reason,
        )

        refund_amount = 0
        for item in items:
            order_item = item['order_item']
            quantity = item['quantity']

            if order_item.order_id != order.id:
                raise ValidationError({'items': [f'Dòng hàng #{order_item.id} không thuộc đơn hàng này.']})

            already_returned = _already_returned_qty(order_item.id)
            remaining = order_item.quantity - already_returned
            if quantity > remaining:
                raise ValidationError({
                    'items': [f'Số lượng trả cho "{order_item.product_name}" vượt quá số lượng còn có thể trả ({remaining}).']
                })

            unit_price = order_item.unit_price
            line_total = unit_price * quantity

            ReturnItem.objects.create(
                return_slip=return_obj,
                order_item=order_item,
                variant=order_item.variant,
                quantity=quantity,
                unit_price=unit_price,
                line_total=line_total,
            )
            refund_amount += line_total

        return_obj.refund_amount = refund_amount
        return_obj.save(update_fields=['refund_amount'])

    return return_obj


def approve_return(return_id, *, staff=None, refund_method=None):
    with transaction.atomic():
        try:
            return_obj = Return.objects.select_for_update().get(pk=return_id)
        except Return.DoesNotExist:
            raise ValidationError({'detail': 'Không tìm thấy phiếu trả hàng.'})

        if return_obj.status != 'pending':
            raise ValidationError({'status': ['Phiếu trả hàng này đã được xử lý, không thể duyệt lại.']})

        for return_item in return_obj.items.all():
            record_movement(
                variant_id=return_item.variant_id,
                movement_type='return',
                quantity=return_item.quantity,
                ref_type='return',
                ref_id=return_obj.id,
                staff=staff,
            )

        return_obj.status = 'approved'
        return_obj.processed_at = timezone.now()
        if refund_method:
            return_obj.refund_method = refund_method
        return_obj.save(update_fields=['status', 'processed_at', 'refund_method'])

    return return_obj


def reject_return(return_id, *, staff=None):
    with transaction.atomic():
        try:
            return_obj = Return.objects.select_for_update().get(pk=return_id)
        except Return.DoesNotExist:
            raise ValidationError({'detail': 'Không tìm thấy phiếu trả hàng.'})

        if return_obj.status != 'pending':
            raise ValidationError({'status': ['Phiếu trả hàng này đã được xử lý, không thể từ chối lại.']})

        return_obj.status = 'rejected'
        return_obj.processed_at = timezone.now()
        return_obj.save(update_fields=['status', 'processed_at'])

    return return_obj
