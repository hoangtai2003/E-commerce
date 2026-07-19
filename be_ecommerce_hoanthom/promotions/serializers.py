from rest_framework import serializers
from .models import Promotion

class PromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = '__all__'
        read_only_fields = ['used_count']

    def validate(self, attrs):
        discount_type = attrs.get('discount_type', getattr(self.instance, 'discount_type', None))
        discount_value = attrs.get('discount_value', getattr(self.instance, 'discount_value', None))

        if discount_type == 'percent' and discount_value is not None and not (1 <= discount_value <= 100):
            raise serializers.ValidationError(
                {'discount_value': ['Giá trị phần trăm giảm giá phải nằm trong khoảng 1-100.']}
            )
        if discount_type == 'fixed' and discount_value is not None and discount_value <= 0:
            raise serializers.ValidationError(
                {'discount_value': ['Giá trị giảm giá cố định phải lớn hơn 0.']}
            )

        return attrs
