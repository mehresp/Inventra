"""
Serializers for Warehouse model.
"""
from rest_framework import serializers
from ..models import Warehouse


class WarehouseSerializer(serializers.ModelSerializer):
    items_count = serializers.SerializerMethodField()
    last_count_date = serializers.SerializerMethodField()
    
    class Meta:
        model = Warehouse
        fields = ['id', 'name', 'location', 'is_active', 'items_count', 'last_count_date', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_items_count(self, obj):
        from ..models import Item
        # Count distinct items with stock in this warehouse
        return Item.objects.filter(
            lots__for_warehouse=obj,
            lots__qty__gt=0,
            is_active=True
        ).distinct().count()
    
    def get_last_count_date(self, obj):
        last_count = obj.inventory_counts.filter(
            status='Closed'
        ).order_by('-closed_at').first()
        if last_count and last_count.closed_at:
            return last_count.closed_at
        return None

