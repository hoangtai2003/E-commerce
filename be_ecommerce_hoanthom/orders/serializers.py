from rest_framework import serializers

from products.models import ProductVariant
from .models import Order, OrderItem
from .services import create_order

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = '__all__'

class OrderItemInputSerializer(serializers.Serializer):
    variant = serializers.PrimaryKeyRelatedField(queryset=ProductVariant.objects.all())
    quantity = serializers.IntegerField(min_value=1)

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = [
            'code', 'customer', 'staff', 'promotion', 'channel',
            'subtotal', 'discount_amount', 'total', 'ordered_at', 'created_at', 'updated_at',
        ]

class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemInputSerializer(many=True, write_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'code', 'customer', 'staff', 'promotion', 'channel', 'status', 'payment_method',
            'amount_paid', 'note', 'ordered_at', 'items', 'subtotal', 'discount_amount', 'total',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'code', 'subtotal', 'discount_amount', 'total', 'created_at', 'updated_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        return create_order(items=items_data, **validated_data)

    def to_representation(self, instance):
        return OrderSerializer(instance, context=self.context).data
