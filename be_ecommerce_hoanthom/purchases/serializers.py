from rest_framework import serializers

from products.models import ProductVariant
from .models import PurchaseInvoice, PurchaseInvoiceItem
from .services import create_purchase_invoice


class PurchaseInvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseInvoiceItem
        fields = '__all__'


class PurchaseInvoiceItemInputSerializer(serializers.Serializer):
    variant = serializers.PrimaryKeyRelatedField(queryset=ProductVariant.objects.all())
    quantity = serializers.IntegerField(min_value=1)
    unit_cost = serializers.IntegerField(min_value=0)


class PurchaseInvoiceSerializer(serializers.ModelSerializer):
    items = PurchaseInvoiceItemSerializer(many=True, read_only=True)

    class Meta:
        model = PurchaseInvoice
        fields = '__all__'
        read_only_fields = ['code', 'supplier', 'staff', 'total_amount', 'created_at']


class PurchaseInvoiceCreateSerializer(serializers.ModelSerializer):
    items = PurchaseInvoiceItemInputSerializer(many=True, write_only=True)

    class Meta:
        model = PurchaseInvoice
        fields = ['id', 'code', 'supplier', 'staff', 'invoice_number', 'invoice_file', 'note', 'items', 'total_amount', 'created_at']
        read_only_fields = ['id', 'code', 'total_amount', 'created_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        return create_purchase_invoice(
            supplier_id=validated_data['supplier'].id,
            items=items_data,
            staff=validated_data.get('staff'),
            invoice_number=validated_data.get('invoice_number'),
            invoice_file=validated_data.get('invoice_file'),
            note=validated_data.get('note'),
        )

    def to_representation(self, instance):
        return PurchaseInvoiceSerializer(instance, context=self.context).data
