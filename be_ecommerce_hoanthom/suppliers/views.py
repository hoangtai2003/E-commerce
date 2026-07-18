from rest_framework import viewsets
from .models import Supplier
from .serializers import SupplierSerializer

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by('-created_at')
    serializer_class = SupplierSerializer

    def perform_destroy(self, instance):
        instance.soft_delete()
