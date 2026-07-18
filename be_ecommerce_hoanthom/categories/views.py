from rest_framework import viewsets
from .models import Category
from .serializers import CategorySerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('sort_order', '-created_at')
    serializer_class = CategorySerializer

    def perform_destroy(self, instance):
        instance.soft_delete()
