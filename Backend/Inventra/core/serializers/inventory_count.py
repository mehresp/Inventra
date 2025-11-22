"""
Serializers for InventoryCount and InventoryCountLine models.
"""
from rest_framework import serializers
from ..models import InventoryCount, InventoryCountLine, Warehouse, Item


class InventoryCountLineSerializer(serializers.ModelSerializer):
    item_code = serializers.CharField(source='for_item.code', read_only=True)
    item_name = serializers.CharField(source='for_item.name', read_only=True)
    item_unit = serializers.CharField(source='for_item.unit', read_only=True)
    
    class Meta:
        model = InventoryCountLine
        fields = [
            'id', 'for_item', 'item_code', 'item_name', 'item_unit',
            'system_qty', 'counted_qty', 'delta'
        ]
        read_only_fields = ['id']


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

