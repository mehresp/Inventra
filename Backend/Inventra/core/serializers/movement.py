"""
Serializers for Movement model.
"""
from rest_framework import serializers
from decimal import Decimal
from ..models import Movement, Item, Warehouse


class MovementSerializer(serializers.ModelSerializer):
    item_code = serializers.CharField(source='for_item.code', read_only=True)
    item_name = serializers.CharField(source='for_item.name', read_only=True)
    warehouse_from_name = serializers.CharField(source='for_warehouse_from.name', read_only=True)
    warehouse_to_name = serializers.CharField(source='for_warehouse_to.name', read_only=True)
    actor_username = serializers.CharField(source='for_actor.username', read_only=True)
    actor_full_name = serializers.SerializerMethodField()
    qty = serializers.DecimalField(max_digits=14, decimal_places=3, coerce_to_string=False)
    
    class Meta:
        model = Movement
        fields = [
            'id', 'type', 'ref_type', 'ref_no', 'for_item', 'item_code', 'item_name',
            'for_warehouse_from', 'warehouse_from_name',
            'for_warehouse_to', 'warehouse_to_name',
            'qty', 'for_actor', 'actor_username', 'actor_full_name',
            'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'for_actor']
    
    def to_representation(self, instance):
        """Convert Decimal fields to float for JSON serialization."""
        ret = super().to_representation(instance)
        if 'qty' in ret and isinstance(ret['qty'], Decimal):
            ret['qty'] = float(ret['qty'])
        return ret
    
    def get_actor_full_name(self, obj):
        user = obj.for_actor
        full_name = f"{user.first_name} {user.last_name}".strip()
        return full_name or user.username
    
    def validate(self, data):
        movement_type = data.get('type')
        warehouse_from = data.get('for_warehouse_from')
        warehouse_to = data.get('for_warehouse_to')
        
        if movement_type == Movement.Type.TRANSFER:
            if not warehouse_from or not warehouse_to:
                raise serializers.ValidationError(
                    "TRANSFER movements require both from and to warehouses."
                )
            if warehouse_from == warehouse_to:
                raise serializers.ValidationError(
                    "TRANSFER source and destination warehouses must be different."
                )
        elif movement_type in [Movement.Type.IN, Movement.Type.RETURN]:
            if not warehouse_to:
                raise serializers.ValidationError(
                    f"{movement_type} movements require a destination warehouse."
                )
        elif movement_type == Movement.Type.OUT:
            if not warehouse_from:
                raise serializers.ValidationError(
                    "OUT movements require a source warehouse."
                )
        
        return data

