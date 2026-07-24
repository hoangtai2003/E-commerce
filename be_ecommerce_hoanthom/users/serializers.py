from rest_framework import serializers
from .models import Role, User
from .services import set_user_password

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=8)

    class Meta:
        model = User
        fields = '__all__'
        read_only_fields = ['deleted_at']
        extra_kwargs = {
            'password_hash': {'write_only': True, 'required': False},
        }

    def create(self, validated_data):
        validated_data.pop('password_hash', None)
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({'password': ['Mật khẩu là bắt buộc khi tạo tài khoản mới.']})
        user = User.objects.create(**validated_data)
        set_user_password(user, password)
        return user

    def update(self, instance, validated_data):
        validated_data.pop('password_hash', None)
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            set_user_password(user, password)
        return user
