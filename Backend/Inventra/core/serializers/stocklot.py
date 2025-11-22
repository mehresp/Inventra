"""
Serializers for StockLot model.
"""
from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from ..models import StockLot, Item, Warehouse


class StockLotSerializer(serializers.ModelSerializer):
    item_code = serializers.CharField(source='for_item.code', read_only=True)
    item_name = serializers.CharField(source='for_item.name', read_only=True)
    warehouse_name = serializers.CharField(source='for_warehouse.name', read_only=True)
    status = serializers.SerializerMethodField()
    days_until_expiry = serializers.SerializerMethodField()
    
    class Meta:
        model = StockLot
        fields = [
            'id', 'for_item', 'item_code', 'item_name',
            'for_warehouse', 'warehouse_name', 'batch_no',
            'expiry_date', 'qty', 'status', 'days_until_expiry'
        ]
        read_only_fields = ['id']
    
    def get_status(self, obj):
        if not obj.expiry_date:
            return 'no_expiry'
        
        today = timezone.now().date()
        days_diff = (obj.expiry_date - today).days
        
        if days_diff < 0:
            return 'expired'
        elif days_diff <= 30:
            return 'expiring'
        else:
            return 'active'
    
    def get_days_until_expiry(self, obj):
        if not obj.expiry_date:
            return None
        
        today = timezone.now().date()
        days_diff = (obj.expiry_date - today).days
        return days_diff

