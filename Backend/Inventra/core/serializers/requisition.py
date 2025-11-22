"""
Serializers for Requisition and RequisitionLine models.
"""
from rest_framework import serializers
from django.utils import timezone
from ..models import Requisition, RequisitionLine, Item, StockLot


class RequisitionLineSerializer(serializers.ModelSerializer):
    item_code = serializers.CharField(source='for_item.code', read_only=True)
    item_name = serializers.CharField(source='for_item.name', read_only=True)
    item_unit = serializers.CharField(source='for_item.unit', read_only=True)
    lot_batch_no = serializers.CharField(source='for_lot.batch_no', read_only=True)
    
    class Meta:
        model = RequisitionLine
        fields = [
            'id', 'for_item', 'item_code', 'item_name', 'item_unit',
            'requested_qty', 'approved_qty', 'issued_qty',
            'for_lot', 'lot_batch_no', 'notes'
        ]
        read_only_fields = ['id']


class RequisitionSerializer(serializers.ModelSerializer):
    lines = RequisitionLineSerializer(many=True, required=False)
    requester_username = serializers.CharField(source='for_requester.username', read_only=True)
    approver_username = serializers.CharField(source='for_approved_by.username', read_only=True)
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Requisition
        fields = [
            'id', 'req_no', 'for_requester', 'requester_username',
            'dept_lab', 'status', 'needed_by', 'notes',
            'for_approved_by', 'approver_username',
            'fulfilled_at', 'items_count', 'lines', 'created_at'
        ]
        read_only_fields = ['id', 'req_no', 'created_at', 'for_approved_by', 'fulfilled_at']
    
    def get_items_count(self, obj):
        return obj.lines.count()
    
    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        user = self.context['request'].user
        
        # Generate req_no if not provided
        if 'req_no' not in validated_data or not validated_data['req_no']:
            validated_data['req_no'] = f"REQ-{timezone.now().strftime('%Y%m%d%H%M%S')}"
        
        # Set requester if not provided
        if 'for_requester' not in validated_data:
            validated_data['for_requester'] = user
        
        # Set status to Draft if creating
        if 'status' not in validated_data:
            validated_data['status'] = Requisition.Status.DRAFT
        
        requisition = Requisition.objects.create(**validated_data)
        
        for line_data in lines_data:
            RequisitionLine.objects.create(for_requisition=requisition, **line_data)
        
        return requisition
    
    def update(self, instance, validated_data):
        lines_data = validated_data.pop('lines', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if lines_data is not None:
            # Update lines
            instance.lines.all().delete()
            for line_data in lines_data:
                RequisitionLine.objects.create(for_requisition=instance, **line_data)
        
        return instance

