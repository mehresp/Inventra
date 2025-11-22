"""
ViewSet for PurchaseOrder model.
"""
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as django_filters

from ..models import PurchaseOrder
from ..serializers import PurchaseOrderSerializer
from ..permissions import CanManageItems, CanViewItems


class PurchaseOrderFilter(django_filters.FilterSet):
    """Filter for PurchaseOrder ViewSet."""
    status = django_filters.ChoiceFilter(choices=PurchaseOrder.Status.choices)
    supplier = django_filters.NumberFilter(field_name='supplier')
    
    class Meta:
        model = PurchaseOrder
        fields = ['status', 'supplier']


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for PurchaseOrder CRUD operations.
    """
    queryset = PurchaseOrder.objects.select_related('supplier').all()
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PurchaseOrderFilter
    search_fields = ['po_no', 'supplier__name']
    ordering_fields = ['created_at', 'po_no']
    ordering = ['-created_at']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [CanManageItems()]
        return [CanViewItems()]

