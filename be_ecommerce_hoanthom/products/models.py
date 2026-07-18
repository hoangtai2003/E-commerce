from django.db import models
from django.utils import timezone

from categories.models import Category
from suppliers.models import Supplier


class ProductManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='products')
    default_supplier = models.ForeignKey(
        Supplier, on_delete=models.SET_NULL, related_name='default_for_products', null=True, blank=True
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    emoji = models.CharField(max_length=16, blank=True, null=True)
    tint = models.CharField(max_length=20, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = ProductManager()
    all_objects = models.Manager()

    def __str__(self):
        return self.name

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at'])


class ProductVariantManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class ProductVariant(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('low', 'Low'),
        ('out', 'Out'),
        ('hidden', 'Hidden'),
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    sku = models.CharField(max_length=60, unique=True)
    variant_name = models.CharField(max_length=120, blank=True, null=True)
    size = models.CharField(max_length=40, blank=True, null=True)
    color = models.CharField(max_length=40, blank=True, null=True)
    price = models.PositiveBigIntegerField()
    cost_price = models.PositiveBigIntegerField(blank=True, null=True)
    stock = models.IntegerField(default=0)
    low_stock_threshold = models.IntegerField(default=5)
    variant_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = ProductVariantManager()
    all_objects = models.Manager()

    def __str__(self):
        return self.sku

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at'])
