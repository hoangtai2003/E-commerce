from rest_framework import viewsets
from .models import Product, ProductVariant
from .serializers import ProductSerializer, ProductVariantSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer

    def perform_destroy(self, instance):
        instance.soft_delete()

class ProductVariantViewSet(viewsets.ModelViewSet):
    queryset = ProductVariant.objects.all().order_by('-created_at')
    serializer_class = ProductVariantSerializer

    def perform_destroy(self, instance):
        instance.soft_delete()
