"""
Serializers for Item model.
"""
from rest_framework import serializers
from ..models import Item, Category


class ItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='for_category.name', read_only=True)
    current_stock = serializers.SerializerMethodField()
    is_below_min = serializers.SerializerMethodField()
    
    class Meta:
        model = Item
        fields = [
            'id', 'code', 'name', 'unit', 'min_stock', 'for_category',
            'category_name', 'is_active', 'current_stock', 'is_below_min',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_current_stock(self, obj):
        # Get current stock for the first warehouse or all warehouses
        warehouse_id = self.context.get('warehouse_id')
        if warehouse_id:
            from ..models import Warehouse
            try:
                warehouse = Warehouse.objects.get(id=warehouse_id)
                return float(obj.get_current_stock(warehouse))
            except Warehouse.DoesNotExist:
                return None
        return float(obj.get_current_stock())
    
    def get_is_below_min(self, obj):
        warehouse_id = self.context.get('warehouse_id')
        if warehouse_id:
            from ..models import Warehouse
            try:
                warehouse = Warehouse.objects.get(id=warehouse_id)
                return obj.is_below_min_stock(warehouse)
            except Warehouse.DoesNotExist:
                return None
        return obj.is_below_min_stock()

