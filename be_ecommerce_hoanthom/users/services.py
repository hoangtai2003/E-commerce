import jwt
from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import User

ACCESS_TOKEN_TYPE = 'access'
REFRESH_TOKEN_TYPE = 'refresh'


def authenticate_user(*, email, password):
    user = User.objects.filter(email=email, status='active').first()
    if user is None or not user.password_hash or not check_password(password, user.password_hash):
        raise ValidationError({'detail': 'Email hoặc mật khẩu không đúng.'})

    user.last_active_at = timezone.now()
    user.save(update_fields=['last_active_at'])
    return user


def set_user_password(user, raw_password):
    user.password_hash = make_password(raw_password)
    user.save(update_fields=['password_hash'])


def _encode(user, token_type, lifetime):
    now = timezone.now()
    payload = {
        'user_id': user.id,
        'type': token_type,
        'iat': now,
        'exp': now + lifetime,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def issue_tokens(user):
    access_token = _encode(user, ACCESS_TOKEN_TYPE, settings.JWT_ACCESS_TOKEN_LIFETIME)
    refresh_token = _encode(user, REFRESH_TOKEN_TYPE, settings.JWT_REFRESH_TOKEN_LIFETIME)
    return access_token, refresh_token


def decode_token(token, expected_type):
    """Trả về payload đã decode. Raise jwt.ExpiredSignatureError / jwt.InvalidTokenError
    cho caller tự quyết định response (401 ở authentication.py, ở RefreshView...)."""
    payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    if payload.get('type') != expected_type:
        raise jwt.InvalidTokenError('token_type_mismatch')
    return payload
