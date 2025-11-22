"""
Serializers for Role model.
"""
from rest_framework import serializers
from ..models import Role


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name']
        read_only_fields = ['id']

