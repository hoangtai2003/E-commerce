from django.db import models

class Category(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('hidden', 'Hidden'),
    )
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

