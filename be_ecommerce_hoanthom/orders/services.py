from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from inventory.services import record_movement
from .models import Order, OrderItem


def _next_order_code(channel):
    prefix = 'POS' if channel == 'pos' else 'AUR'
    count = Order.objects.filter(code__startswith=f'{prefix}-').count()
    return f'{prefix}-{count + 1:04d}'


def _validate_promotion(promotion, subtotal):
    today = timezone.localdate()
    if not promotion.is_active:
        raise ValidationError({'promotion': ['Mã khuyến mãi hiện không hoạt động.']})
    if promotion.starts_at and today < promotion.starts_at:
        raise ValidationError({'promotion': ['Mã khuyến mãi chưa bắt đầu.']})
    if promotion.ends_at and today > promotion.ends_at:
        raise ValidationError({'promotion': ['Mã khuyến mãi đã hết hạn.']})
    if promotion.usage_limit > 0 and promotion.used_count >= promotion.usage_limit:
        raise ValidationError({'promotion': ['Mã khuyến mãi đã hết lượt sử dụng.']})
    if subtotal < promotion.min_order:
        raise ValidationError({'promotion': ['Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã này.']})


def create_order(*, items, customer=None, staff=None, promotion=None, channel='pos',
                  status='pending', payment_method='cash', amount_paid=None, note=None, ordered_at=None):
    if not items:
        raise ValidationError({'items': ['Đơn hàng phải có ít nhất 1 sản phẩm.']})

    with transaction.atomic():
        order = Order.objects.create(
            code=_next_order_code(channel),
            customer=customer,
            staff=staff,
            channel=channel,
            status=status,
            payment_method=payment_method,
            amount_paid=amount_paid,
            note=note,
            ordered_at=ordered_at or timezone.now(),
        )

        subtotal = 0
        for item in items:
            variant = item['variant']
            quantity = item['quantity']
            unit_price = variant.price
            line_total = unit_price * quantity

            OrderItem.objects.create(
                order=order,
                variant=variant,
                product_name=variant.product.name,
                variant_name=variant.variant_name or ' / '.join(filter(None, [variant.size, variant.color])) or None,
                unit_price=unit_price,
                quantity=quantity,
                line_total=line_total,
            )
            record_movement(
                variant_id=variant.id,
                movement_type='sale',
                quantity=-quantity,
                ref_type='order',
                ref_id=order.id,
                staff=staff,
            )
            subtotal += line_total

        discount_amount = 0
        if promotion is not None:
            _validate_promotion(promotion, subtotal)
            if promotion.discount_type == 'percent':
                discount_amount = subtotal * promotion.discount_value // 100
            else:
                discount_amount = min(promotion.discount_value, subtotal)
            promotion.used_count += 1
            promotion.save(update_fields=['used_count'])

        order.promotion = promotion
        order.subtotal = subtotal
        order.discount_amount = discount_amount
        order.total = subtotal - discount_amount
        order.save(update_fields=['promotion', 'subtotal', 'discount_amount', 'total'])

    return order
