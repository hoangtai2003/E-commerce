from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, ProductVariantViewSet, ProductImageViewSet, ProductImageUploadView

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'product-variants', ProductVariantViewSet, basename='product-variant')
router.register(r'product-images', ProductImageViewSet, basename='product-image')

urlpatterns = [
    path('products/upload-image/', ProductImageUploadView.as_view(), name='product-image-upload'),
    path('', include(router.urls)),
]
