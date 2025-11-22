"""
ViewSet for InventoryCount model.
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as django_filters

from ..models import InventoryCount
from ..serializers import InventoryCountSerializer
from ..permissions import CanManageInventoryCount, CanViewMovements
from ..services import InventoryCountService


class InventoryCountFilter(django_filters.FilterSet):
    """Filter for InventoryCount ViewSet."""
    status = django_filters.ChoiceFilter(choices=InventoryCount.Status.choices)
    warehouse = django_filters.NumberFilter(field_name='for_warehouse')
    
    class Meta:
        model = InventoryCount
        fields = ['status', 'warehouse']


class InventoryCountViewSet(viewsets.ModelViewSet):
    """
    ViewSet for InventoryCount CRUD operations with custom actions.
    """
    queryset = InventoryCount.objects.select_related(
        'for_warehouse'
    ).prefetch_related('lines__for_item').all()
    serializer_class = InventoryCountSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = InventoryCountFilter
    search_fields = ['period', 'for_warehouse__name']
    ordering_fields = ['started_at', 'closed_at', 'period']
    ordering = ['-started_at']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'start', 'import_data', 'close']:
            return [CanManageInventoryCount()]
        return [CanViewMovements()]
    
    @action(detail=False, methods=['post'])
    def start(self, request):
        """Start a new inventory count."""
        warehouse_id = request.data.get('warehouse_id')
        period = request.data.get('period')
        
        if not warehouse_id or not period:
            return Response(
                {'error': {'code': 400, 'message': 'warehouse_id and period are required', 'details': {}}},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from ..models import Warehouse
        try:
            warehouse = Warehouse.objects.get(id=warehouse_id)
        except Warehouse.DoesNotExist:
            return Response(
                {'error': {'code': 404, 'message': 'Warehouse not found', 'details': {}}},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            count = InventoryCountService.start_count(warehouse, period)
            serializer = self.get_serializer(count)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': {'code': 400, 'message': str(e), 'details': {}}},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def import_data(self, request, pk=None):
        """Import counted quantities from CSV or manual entry."""
        count = self.get_object()
        count_data = request.data.get('count_data', [])
        
        if not isinstance(count_data, list):
            return Response(
                {'error': {'code': 400, 'message': 'count_data must be a list', 'details': {}}},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            count = InventoryCountService.import_count_data(count, count_data)
            serializer = self.get_serializer(count)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': {'code': 400, 'message': str(e), 'details': {}}},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Close inventory count and generate ADJUST movements."""
        count = self.get_object()
        
        try:
            count = InventoryCountService.close_count(count, request.user)
            serializer = self.get_serializer(count)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': {'code': 400, 'message': str(e), 'details': {}}},
                status=status.HTTP_400_BAD_REQUEST
            )

