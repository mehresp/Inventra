"""
Serializers for AuditLog model.
"""
from rest_framework import serializers
from ..models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source='for_actor.username', read_only=True)
    actor_full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'for_actor', 'actor_username', 'actor_full_name',
            'entity', 'entity_id', 'action', 'before', 'after',
            'ip', 'user_agent', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_actor_full_name(self, obj):
        if not obj.for_actor:
            return None
        user = obj.for_actor
        full_name = f"{user.first_name} {user.last_name}".strip()
        return full_name or user.username

