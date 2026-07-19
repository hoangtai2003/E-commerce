from django.db import models


class Promotion(models.Model):
    DISCOUNT_TYPE_CHOICES = (
        ('percent', 'Percent'),
        ('fixed', 'Fixed'),
    )

    code = models.CharField(max_length=40, unique=True)
    description = models.CharField(max_length=255, blank=True, null=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES)
    discount_value = models.PositiveBigIntegerField()
    min_order = models.PositiveBigIntegerField(default=0)
    usage_limit = models.IntegerField(default=0)
    used_count = models.IntegerField(default=0)
    starts_at = models.DateField(blank=True, null=True)
    ends_at = models.DateField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.code
