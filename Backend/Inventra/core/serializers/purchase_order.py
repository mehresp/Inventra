"""
Serializers for PurchaseOrder model.
"""
from rest_framework import serializers
from ..models import PurchaseOrder, Supplier


class PurchaseOrderSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    
    class Meta:
        model = PurchaseOrder
        fields = ['id', 'po_no', 'supplier', 'supplier_name', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']

