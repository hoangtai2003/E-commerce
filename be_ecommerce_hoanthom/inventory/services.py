from django.db import transaction
from rest_framework.exceptions import ValidationError

from products.models import ProductVariant
from .models import InventoryMovement


def record_movement(*, variant_id, movement_type, quantity, ref_type=None, ref_id=None, note=None, staff=None):
    with transaction.atomic():
        variant = ProductVariant.objects.select_for_update().get(pk=variant_id)
        new_stock = variant.stock + quantity
        if new_stock < 0:
            raise ValidationError({'quantity': ['Số lượng vượt quá tồn kho hiện có.']})

        movement = InventoryMovement.objects.create(
            variant=variant,
            movement_type=movement_type,
            quantity=quantity,
            stock_after=new_stock,
            ref_type=ref_type,
            ref_id=ref_id,
            note=note,
            staff=staff,
        )

        variant.stock = new_stock
        variant.save(update_fields=['stock'])

    return movement
