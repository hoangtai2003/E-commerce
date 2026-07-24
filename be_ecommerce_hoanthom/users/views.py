import jwt
from django.conf import settings
from django.db.models.deletion import ProtectedError
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import CookieJWTAuthentication
from .models import Role, User
from .serializers import RoleSerializer, UserSerializer
from .services import REFRESH_TOKEN_TYPE, authenticate_user, decode_token, issue_tokens

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all().order_by('name')
    serializer_class = RoleSerializer

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError:
            raise ValidationError('Không thể xoá vai trò đang được gán cho người dùng.')

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer

    def perform_destroy(self, instance):
        instance.soft_delete()


def _set_access_cookie(response, access_token):
    response.set_cookie(
        settings.JWT_ACCESS_COOKIE_NAME,
        access_token,
        max_age=int(settings.JWT_ACCESS_TOKEN_LIFETIME.total_seconds()),
        httponly=True,
        secure=settings.JWT_COOKIE_SECURE,
        samesite=settings.JWT_COOKIE_SAMESITE,
        path='/',
    )


def _set_refresh_cookie(response, refresh_token):
    response.set_cookie(
        settings.JWT_REFRESH_COOKIE_NAME,
        refresh_token,
        max_age=int(settings.JWT_REFRESH_TOKEN_LIFETIME.total_seconds()),
        httponly=True,
        secure=settings.JWT_COOKIE_SECURE,
        samesite=settings.JWT_COOKIE_SAMESITE,
        path='/api/auth/refresh/',
    )


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '')
        password = request.data.get('password', '')
        user = authenticate_user(email=email, password=password)

        access_token, refresh_token = issue_tokens(user)
        response = Response(UserSerializer(user).data)
        _set_access_cookie(response, access_token)
        _set_refresh_cookie(response, refresh_token)
        return response


class RefreshView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.COOKIES.get(settings.JWT_REFRESH_COOKIE_NAME)
        if not token:
            return Response({'detail': 'refresh_token_missing'}, status=401)

        try:
            payload = decode_token(token, REFRESH_TOKEN_TYPE)
        except jwt.PyJWTError:
            return Response({'detail': 'refresh_token_invalid'}, status=401)

        user = User.objects.filter(pk=payload.get('user_id'), status='active').first()
        if user is None:
            return Response({'detail': 'refresh_token_invalid'}, status=401)

        access_token = issue_tokens(user)[0]
        response = Response({'detail': 'ok'})
        _set_access_cookie(response, access_token)
        return response


class LogoutView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        response = Response({'detail': 'ok'})
        response.delete_cookie(settings.JWT_ACCESS_COOKIE_NAME, path='/')
        response.delete_cookie(settings.JWT_REFRESH_COOKIE_NAME, path='/api/auth/refresh/')
        return response


class MeView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
