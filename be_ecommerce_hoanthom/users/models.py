from django.db import models
from django.utils import timezone


class Role(models.Model):
    code = models.CharField(max_length=30, unique=True)
    name = models.CharField(max_length=80)
    description = models.CharField(max_length=255, blank=True, null=True)
    permissions = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class UserManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class User(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    )

    role = models.ForeignKey(Role, on_delete=models.PROTECT, related_name='users')
    full_name = models.CharField(max_length=120)
    email = models.EmailField(max_length=160, unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    password_hash = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    last_active_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = UserManager()
    all_objects = models.Manager()

    is_authenticated = True

    def __str__(self):
        return self.full_name

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at'])
