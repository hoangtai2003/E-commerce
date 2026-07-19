from django.db import models
from django.utils import timezone

from customers.models import Customer
from products.models import ProductVariant
from promotions.models import Promotion
from users.models import User


class Order(models.Model):
    CHANNEL_CHOICES = (
        ('online', 'Online'),
        ('pos', 'POS'),
    )
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('shipping', 'Shipping'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    PAYMENT_METHOD_CHOICES = (
        ('cod', 'COD'),
        ('transfer', 'Transfer'),
        ('card', 'Card'),
        ('momo', 'Momo'),
        ('cash', 'Cash'),
    )

    code = models.CharField(max_length=30, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, related_name='orders', null=True, blank=True)
    staff = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='orders', null=True, blank=True)
    promotion = models.ForeignKey(Promotion, on_delete=models.SET_NULL, related_name='orders', null=True, blank=True)
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, default='pos')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='cash')
    subtotal = models.PositiveBigIntegerField(default=0)
    discount_amount = models.PositiveBigIntegerField(default=0)
    total = models.PositiveBigIntegerField(default=0)
    amount_paid = models.PositiveBigIntegerField(null=True, blank=True)
    note = models.CharField(max_length=255, blank=True, null=True)
    ordered_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.code


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT, related_name='order_items')
    product_name = models.CharField(max_length=200)
    variant_name = models.CharField(max_length=120, blank=True, null=True)
    unit_price = models.PositiveBigIntegerField()
    quantity = models.IntegerField()
    line_total = models.PositiveBigIntegerField()

    def __str__(self):
        return f'{self.product_name} x{self.quantity}'
