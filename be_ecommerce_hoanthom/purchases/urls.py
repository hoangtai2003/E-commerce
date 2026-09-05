from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PurchaseInvoiceViewSet, PurchaseInvoiceItemViewSet, PurchaseInvoiceFileUploadView

router = DefaultRouter()
router.register(r'purchase-invoices', PurchaseInvoiceViewSet, basename='purchase-invoice')
router.register(r'purchase-invoice-items', PurchaseInvoiceItemViewSet, basename='purchase-invoice-item')

urlpatterns = [
    path('purchase-invoices/upload-file/', PurchaseInvoiceFileUploadView.as_view(), name='purchase-invoice-upload-file'),
    path('', include(router.urls)),
]
