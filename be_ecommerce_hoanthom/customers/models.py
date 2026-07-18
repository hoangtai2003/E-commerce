from django.db import models
from datetime import date
from django.utils import timezone


class CustomerManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(
            deleted_at__isnull=True
        )

class Customer(models.Model):
    TIER_CHOICES = [
        ('new', 'New'),
        ('loyal', 'Loyal'),
        ('vip', 'VIP'),
    ]

    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=15, blank=True, null=True)
    email = models.EmailField(max_length=254, blank=True, null=True)
    address = models.TextField(max_length=255, blank=True, null=True)
    tier = models.CharField(
        max_length=20,
        choices=TIER_CHOICES,
        default='new',
        verbose_name='Customer Tier'
    )
    total_orders = models.IntegerField(
        default=0,
        verbose_name='Total Orders'
    )
    total_spent = models.PositiveBigIntegerField(
        default=0,
        verbose_name='Total Spent'
    )
    joined_at = models.DateField(
        default=date.today,
        verbose_name='Joined Date'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    # Manager
    objects = CustomerManager()
    all_objects = models.Manager()  # To allow soft-deleted objects to be retrieved

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at"])

    
    
    
