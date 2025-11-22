"""
Serializers for Category model.
"""
from rest_framework import serializers
from ..models import Category


class CategorySerializer(serializers.ModelSerializer):
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'items_count']
        read_only_fields = ['id']
    
    def get_items_count(self, obj):
        return obj.items.filter(is_active=True).count()

