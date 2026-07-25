from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SupplierReturnViewSet, SupplierReturnItemViewSet

router = DefaultRouter()
router.register(r'supplier-returns', SupplierReturnViewSet, basename='supplier-return')
router.register(r'supplier-return-items', SupplierReturnItemViewSet, basename='supplier-return-item')

urlpatterns = [
    path('', include(router.urls)),
]
