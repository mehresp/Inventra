"""
ViewSet for StockLot model.
"""
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from ..models import StockLot
from ..serializers import StockLotSerializer
from ..permissions import IsAuditor, CanManageMovements, CanViewMovements


class StockLotViewSet(viewsets.ModelViewSet):
    """
    ViewSet for StockLot CRUD operations.
    """
    queryset = StockLot.objects.select_related('for_item', 'for_warehouse').all()
    serializer_class = StockLotSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['for_item', 'for_warehouse']
    search_fields = ['batch_no', 'for_item__code', 'for_item__name']
    ordering_fields = ['batch_no', 'expiry_date', 'qty']
    ordering = ['expiry_date', 'batch_no']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [CanManageMovements()]
        return [CanViewMovements()]

