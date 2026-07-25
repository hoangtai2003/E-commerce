from django.db import models

from products.models import ProductVariant
from users.models import User


class InventoryMovement(models.Model):
    MOVEMENT_TYPE_CHOICES = (
        ('sale', 'Sale'),
        ('purchase', 'Purchase'),
        ('return', 'Return'),
        ('adjustment', 'Adjustment'),
        ('supplier_return', 'Supplier Return'),
    )

    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT, related_name='inventory_movements')
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPE_CHOICES)
    quantity = models.IntegerField()
    stock_after = models.IntegerField()
    ref_type = models.CharField(max_length=30, blank=True, null=True)
    ref_id = models.PositiveBigIntegerField(blank=True, null=True)
    note = models.CharField(max_length=255, blank=True, null=True)
    staff = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='inventory_movements', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.movement_type} {self.quantity:+d} -> variant #{self.variant_id}'
