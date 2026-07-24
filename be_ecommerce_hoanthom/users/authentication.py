import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import User
from .services import ACCESS_TOKEN_TYPE, decode_token


class CookieJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        token = request.COOKIES.get(settings.JWT_ACCESS_COOKIE_NAME)
        if not token:
            return None

        try:
            payload = decode_token(token, ACCESS_TOKEN_TYPE)
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('access_token_expired')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('invalid_token')

        user = User.objects.filter(pk=payload.get('user_id'), status='active').first()
        if user is None:
            raise AuthenticationFailed('invalid_token')

        return (user, None)

    def authenticate_header(self, request):
        # Khai báo header này để DRF trả 401 (chưa xác thực) thay vì tự hạ xuống 403
        # khi thiếu/hết hạn cookie — FE dựa vào đúng mã 401 để quyết định gọi refresh.
        return 'Bearer'
