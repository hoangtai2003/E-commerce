import os
import uuid

from django.conf import settings
from PIL import Image
from rest_framework import status, views, viewsets
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from .models import Product, ProductVariant, ProductImage
from .serializers import ProductSerializer, ProductVariantSerializer, ProductImageSerializer

ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
THUMBNAIL_SIZE = (300, 300)

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

class ProductImageViewSet(viewsets.ModelViewSet):
    queryset = ProductImage.objects.all().order_by('sort_order', '-created_at')
    serializer_class = ProductImageSerializer

    def perform_destroy(self, instance):
        instance.soft_delete()

class ProductImageUploadView(views.APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        upload = request.FILES.get('file')
        if not upload:
            return Response({'file': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)

        ext = os.path.splitext(upload.name)[1].lower()
        if ext not in ALLOWED_IMAGE_EXTENSIONS:
            return Response(
                {'file': [f'Unsupported image format. Allowed: {", ".join(sorted(ALLOWED_IMAGE_EXTENSIONS))}']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        products_dir = os.path.join(settings.MEDIA_ROOT, 'products')
        thumbnails_dir = os.path.join(products_dir, 'thumbnails')
        os.makedirs(products_dir, exist_ok=True)
        os.makedirs(thumbnails_dir, exist_ok=True)

        filename = f'{uuid.uuid4().hex}{ext}'
        file_path = os.path.join(products_dir, filename)
        with open(file_path, 'wb+') as dest:
            for chunk in upload.chunks():
                dest.write(chunk)

        with Image.open(file_path) as image:
            width, height = image.size
            thumb = image.copy()
            thumb.thumbnail(THUMBNAIL_SIZE)
            if thumb.mode in ('RGBA', 'P') and ext in ('.jpg', '.jpeg'):
                thumb = thumb.convert('RGB')
            thumb.save(os.path.join(thumbnails_dir, filename))

        file_size = os.path.getsize(file_path)
        image_url = request.build_absolute_uri(f'{settings.MEDIA_URL}products/{filename}')
        thumbnail_url = request.build_absolute_uri(f'{settings.MEDIA_URL}products/thumbnails/{filename}')

        return Response(
            {
                'image_url': image_url,
                'thumbnail_url': thumbnail_url,
                'file_size': file_size,
                'width': width,
                'height': height,
            },
            status=status.HTTP_201_CREATED,
        )
