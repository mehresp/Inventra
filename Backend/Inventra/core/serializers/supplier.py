"""
Serializers for Supplier model.
"""
from rest_framework import serializers
from ..models import Supplier


class SupplierSerializer(serializers.ModelSerializer):
    orders_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'contact', 'orders_count']
        read_only_fields = ['id']
    
    def get_orders_count(self, obj):
        return obj.purchase_orders.count()

