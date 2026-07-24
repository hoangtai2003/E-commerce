from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Return, ReturnItem
from .serializers import ReturnSerializer, ReturnCreateSerializer, ReturnItemSerializer
from .services import approve_return, reject_return


class ReturnViewSet(viewsets.ModelViewSet):
    """Return slips are workflow records: no PUT/PATCH/DELETE on the resource itself —
    status only moves pending -> approved/rejected via the approve/reject actions below."""

    http_method_names = ['get', 'post', 'head', 'options']
    queryset = Return.objects.all().order_by('-created_at').prefetch_related('items')

    def get_serializer_class(self):
        if self.action == 'create':
            return ReturnCreateSerializer
        return ReturnSerializer

    def perform_create(self, serializer):
        serializer.save(staff=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        return_obj = approve_return(pk, staff=request.user, refund_method=request.data.get('refund_method'))
        return Response(ReturnSerializer(return_obj).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        return_obj = reject_return(pk, staff=request.user)
        return Response(ReturnSerializer(return_obj).data)


class ReturnItemViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ReturnItem.objects.all().order_by('id')
    serializer_class = ReturnItemSerializer
