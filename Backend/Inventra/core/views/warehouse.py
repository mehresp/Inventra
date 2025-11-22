"""
ViewSet for Warehouse model.
"""
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from ..models import Warehouse
from ..serializers import WarehouseSerializer
from ..permissions import CanManageItems, CanViewItems


class WarehouseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Warehouse CRUD operations.
    """
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'location']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [CanManageItems()]
        return [CanViewItems()]

