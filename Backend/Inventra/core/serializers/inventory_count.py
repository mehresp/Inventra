"""
Serializers for InventoryCount and InventoryCountLine models.
"""
from rest_framework import serializers
from decimal import Decimal
from ..models import InventoryCount, InventoryCountLine, Warehouse, Item


class InventoryCountLineSerializer(serializers.ModelSerializer):
    item_code = serializers.CharField(source='for_item.code', read_only=True)
    item_name = serializers.CharField(source='for_item.name', read_only=True)
    item_unit = serializers.CharField(source='for_item.unit', read_only=True)
    system_qty = serializers.DecimalField(max_digits=14, decimal_places=3, coerce_to_string=False)
    counted_qty = serializers.DecimalField(max_digits=14, decimal_places=3, coerce_to_string=False)
    delta = serializers.DecimalField(max_digits=14, decimal_places=3, coerce_to_string=False)
    
    class Meta:
        model = InventoryCountLine
        fields = [
            'id', 'for_item', 'item_code', 'item_name', 'item_unit',
            'system_qty', 'counted_qty', 'delta'
        ]
        read_only_fields = ['id']
    
    def to_representation(self, instance):
        """Convert Decimal fields to float for JSON serialization."""
        ret = super().to_representation(instance)
        for field in ['system_qty', 'counted_qty', 'delta']:
            if field in ret and isinstance(ret[field], Decimal):
                ret[field] = float(ret[field])
        return ret


class InventoryCountSerializer(serializers.ModelSerializer):
    lines = InventoryCountLineSerializer(many=True, read_only=True)
    warehouse_name = serializers.CharField(source='for_warehouse.name', read_only=True)
    discrepancies_count = serializers.SerializerMethodField()
    
    class Meta:
        model = InventoryCount
        fields = [
            'id', 'period', 'for_warehouse', 'warehouse_name',
            'status', 'started_at', 'closed_at',
            'discrepancies_count', 'lines'
        ]
        read_only_fields = ['id', 'started_at', 'closed_at']
    
    def get_discrepancies_count(self, obj):
        return obj.lines.filter(delta__ne=0).count()

