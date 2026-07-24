from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReturnViewSet, ReturnItemViewSet

router = DefaultRouter()
router.register(r'returns', ReturnViewSet, basename='return')
router.register(r'return-items', ReturnItemViewSet, basename='return-item')

urlpatterns = [
    path('', include(router.urls)),
]
