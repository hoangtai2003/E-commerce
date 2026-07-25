from rest_framework import serializers

from products.models import ProductVariant
from .models import SupplierReturn, SupplierReturnItem
from .services import create_supplier_return


class SupplierReturnItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplierReturnItem
        fields = '__all__'


class SupplierReturnItemInputSerializer(serializers.Serializer):
    variant = serializers.PrimaryKeyRelatedField(queryset=ProductVariant.objects.all())
    quantity = serializers.IntegerField(min_value=1)


class SupplierReturnSerializer(serializers.ModelSerializer):
    items = SupplierReturnItemSerializer(many=True, read_only=True)

    class Meta:
        model = SupplierReturn
        fields = '__all__'
        read_only_fields = [
            'code', 'supplier', 'staff', 'status', 'refund_amount', 'refund_method',
            'processed_at', 'created_at',
        ]


class SupplierReturnCreateSerializer(serializers.ModelSerializer):
    items = SupplierReturnItemInputSerializer(many=True, write_only=True)

    class Meta:
        model = SupplierReturn
        fields = ['id', 'code', 'supplier', 'staff', 'reason', 'items', 'status', 'refund_amount', 'created_at']
        read_only_fields = ['id', 'code', 'status', 'refund_amount', 'created_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        return create_supplier_return(
            supplier_id=validated_data['supplier'].id,
            items=items_data,
            staff=validated_data.get('staff'),
            reason=validated_data.get('reason'),
        )

    def to_representation(self, instance):
        return SupplierReturnSerializer(instance, context=self.context).data
