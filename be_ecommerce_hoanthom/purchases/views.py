import os
import uuid

from django.conf import settings
from rest_framework import status, views, viewsets
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from .models import PurchaseInvoice, PurchaseInvoiceItem
from .serializers import PurchaseInvoiceSerializer, PurchaseInvoiceCreateSerializer, PurchaseInvoiceItemSerializer

ALLOWED_INVOICE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.pdf'}


class PurchaseInvoiceViewSet(viewsets.ModelViewSet):
    """Purchase invoices are ledger records: no PUT/PATCH/DELETE — hàng đã về kho thật
    ngay khi tạo phiếu (xem services.create_purchase_invoice), không có bước duyệt."""

    http_method_names = ['get', 'post', 'head', 'options']
    queryset = PurchaseInvoice.objects.all().order_by('-created_at').prefetch_related('items')

    def get_serializer_class(self):
        if self.action == 'create':
            return PurchaseInvoiceCreateSerializer
        return PurchaseInvoiceSerializer

    def perform_create(self, serializer):
        serializer.save(staff=self.request.user)


class PurchaseInvoiceItemViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PurchaseInvoiceItem.objects.all().order_by('id')
    serializer_class = PurchaseInvoiceItemSerializer


class PurchaseInvoiceFileUploadView(views.APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        upload = request.FILES.get('file')
        if not upload:
            return Response({'file': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)

        ext = os.path.splitext(upload.name)[1].lower()
        if ext not in ALLOWED_INVOICE_EXTENSIONS:
            return Response(
                {'file': [f'Định dạng không hỗ trợ. Cho phép: {", ".join(sorted(ALLOWED_INVOICE_EXTENSIONS))}']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invoices_dir = os.path.join(settings.MEDIA_ROOT, 'purchase_invoices')
        os.makedirs(invoices_dir, exist_ok=True)

        filename = f'{uuid.uuid4().hex}{ext}'
        file_path = os.path.join(invoices_dir, filename)
        with open(file_path, 'wb+') as dest:
            for chunk in upload.chunks():
                dest.write(chunk)

        file_size = os.path.getsize(file_path)
        file_url = request.build_absolute_uri(f'{settings.MEDIA_URL}purchase_invoices/{filename}')

        return Response(
            {
                'file_url': file_url,
                'file_name': upload.name,
                'file_size': file_size,
            },
            status=status.HTTP_201_CREATED,
        )
