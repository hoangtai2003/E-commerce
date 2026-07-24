from rest_framework import serializers

from orders.models import OrderItem
from .models import Return, ReturnItem
from .services import create_return


class ReturnItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReturnItem
        fields = '__all__'


class ReturnItemInputSerializer(serializers.Serializer):
    order_item = serializers.PrimaryKeyRelatedField(queryset=OrderItem.objects.all())
    quantity = serializers.IntegerField(min_value=1)


class ReturnSerializer(serializers.ModelSerializer):
    items = ReturnItemSerializer(many=True, read_only=True)

    class Meta:
        model = Return
        fields = '__all__'
        read_only_fields = [
            'code', 'order', 'staff', 'status', 'refund_amount', 'refund_method',
            'processed_at', 'created_at',
        ]


class ReturnCreateSerializer(serializers.ModelSerializer):
    items = ReturnItemInputSerializer(many=True, write_only=True)

    class Meta:
        model = Return
        fields = ['id', 'code', 'order', 'staff', 'reason', 'items', 'status', 'refund_amount', 'created_at']
        read_only_fields = ['id', 'code', 'status', 'refund_amount', 'created_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        return create_return(
            order_id=validated_data['order'].id,
            items=items_data,
            staff=validated_data.get('staff'),
            reason=validated_data.get('reason'),
        )

    def to_representation(self, instance):
        return ReturnSerializer(instance, context=self.context).data
