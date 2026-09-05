from django.db import models

from products.models import ProductVariant
from suppliers.models import Supplier
from users.models import User


class PurchaseInvoice(models.Model):
    code = models.CharField(max_length=30, unique=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name='purchase_invoices')
    staff = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='purchase_invoices', null=True, blank=True)
    invoice_number = models.CharField(max_length=60, blank=True, null=True)
    invoice_file = models.CharField(max_length=500, blank=True, null=True)
    total_amount = models.PositiveBigIntegerField(default=0)
    note = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.code


class PurchaseInvoiceItem(models.Model):
    purchase_invoice = models.ForeignKey(PurchaseInvoice, on_delete=models.CASCADE, related_name='items')
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT, related_name='purchase_invoice_items')
    quantity = models.IntegerField()
    unit_cost = models.PositiveBigIntegerField()
    line_total = models.PositiveBigIntegerField()

    def __str__(self):
        return f'{self.variant.sku} x{self.quantity}'
