from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import SupplierReturn, SupplierReturnItem
from .serializers import SupplierReturnSerializer, SupplierReturnCreateSerializer, SupplierReturnItemSerializer
from .services import approve_supplier_return, reject_supplier_return


class SupplierReturnViewSet(viewsets.ModelViewSet):
    """Supplier return slips are workflow records: no PUT/PATCH/DELETE on the resource
    itself — status only moves pending -> approved/rejected via approve/reject below."""

    http_method_names = ['get', 'post', 'head', 'options']
    queryset = SupplierReturn.objects.all().order_by('-created_at').prefetch_related('items')

    def get_serializer_class(self):
        if self.action == 'create':
            return SupplierReturnCreateSerializer
        return SupplierReturnSerializer

    def perform_create(self, serializer):
        serializer.save(staff=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        supplier_return = approve_supplier_return(pk, staff=request.user, refund_method=request.data.get('refund_method'))
        return Response(SupplierReturnSerializer(supplier_return).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        supplier_return = reject_supplier_return(pk, staff=request.user)
        return Response(SupplierReturnSerializer(supplier_return).data)


class SupplierReturnItemViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SupplierReturnItem.objects.all().order_by('id')
    serializer_class = SupplierReturnItemSerializer
