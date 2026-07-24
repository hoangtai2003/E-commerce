from django.db import models

from orders.models import Order, OrderItem
from products.models import ProductVariant
from users.models import User


class Return(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    REFUND_METHOD_CHOICES = (
        ('cash', 'Cash'),
        ('transfer', 'Transfer'),
        ('card', 'Card'),
        ('momo', 'Momo'),
    )

    code = models.CharField(max_length=30, unique=True)
    order = models.ForeignKey(Order, on_delete=models.PROTECT, related_name='returns')
    staff = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='returns', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reason = models.CharField(max_length=255, blank=True, null=True)
    refund_amount = models.PositiveBigIntegerField(default=0)
    refund_method = models.CharField(max_length=20, choices=REFUND_METHOD_CHOICES, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.code


class ReturnItem(models.Model):
    return_slip = models.ForeignKey(Return, on_delete=models.CASCADE, related_name='items', db_column='return_id')
    order_item = models.ForeignKey(OrderItem, on_delete=models.PROTECT, related_name='return_items')
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT, related_name='return_items')
    quantity = models.IntegerField()
    unit_price = models.PositiveBigIntegerField()
    line_total = models.PositiveBigIntegerField()

    def __str__(self):
        return f'{self.variant.sku} x{self.quantity}'
