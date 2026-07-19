from rest_framework import serializers
from .models import InventoryMovement
from .services import record_movement

class InventoryMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryMovement
        fields = '__all__'
        read_only_fields = ['stock_after']

    def create(self, validated_data):
        return record_movement(
            variant_id=validated_data['variant'].id,
            movement_type=validated_data['movement_type'],
            quantity=validated_data['quantity'],
            ref_type=validated_data.get('ref_type'),
            ref_id=validated_data.get('ref_id'),
            note=validated_data.get('note'),
            staff=validated_data.get('staff'),
        )
