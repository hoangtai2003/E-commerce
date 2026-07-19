from rest_framework import viewsets
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderCreateSerializer, OrderItemSerializer

class OrderViewSet(viewsets.ModelViewSet):
    """Orders are transactional records: no PUT/DELETE. Line items are fixed at creation
    time (see services.create_order) — only status/payment_method/amount_paid/note stay editable."""

    http_method_names = ['get', 'post', 'patch', 'head', 'options']
    queryset = Order.objects.all().order_by('-created_at').prefetch_related('items')

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

class OrderItemViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = OrderItem.objects.all().order_by('id')
    serializer_class = OrderItemSerializer
