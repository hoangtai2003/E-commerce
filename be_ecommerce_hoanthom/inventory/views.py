from rest_framework import viewsets
from .models import InventoryMovement
from .serializers import InventoryMovementSerializer

class InventoryMovementViewSet(viewsets.ModelViewSet):
    """Ledger is append-only — update/delete disabled so stock_after history never desyncs from ProductVariant.stock."""

    http_method_names = ['get', 'post', 'head', 'options']
    queryset = InventoryMovement.objects.all().order_by('-created_at')
    serializer_class = InventoryMovementSerializer
