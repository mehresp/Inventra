"""
ViewSet for Item model.
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as django_filters

from ..models import Item, Warehouse, Category
from ..serializers import ItemSerializer
from ..permissions import CanManageItems, CanViewItems
from ..services import StockService, ReportService


class ItemFilter(django_filters.FilterSet):
    """Filter for Item ViewSet."""
    below_min = django_filters.BooleanFilter(method='filter_below_min')
    category = django_filters.NumberFilter(field_name='for_category')
    warehouse = django_filters.NumberFilter(method='filter_warehouse')
    
    class Meta:
        model = Item
        fields = ['is_active', 'category', 'below_min', 'warehouse']
    
    def filter_below_min(self, queryset, name, value):
        if not value:
            return queryset
        # Filter items with stock below minimum (uses ReportService logic)
        warehouse_id = self.data.get('warehouse')
        category_id = self.data.get('category')
        warehouse = None
        category = None
        if warehouse_id:
            try:
                warehouse = Warehouse.objects.get(id=warehouse_id)
            except (Warehouse.DoesNotExist, ValueError):
                pass
        if category_id:
            try:
                category = Category.objects.get(id=category_id)
            except (Category.DoesNotExist, ValueError):
                pass
        shortages = ReportService.get_shortages(warehouse=warehouse, category=category)
        item_ids = [s['item'].id for s in shortages]
        return queryset.filter(id__in=item_ids) if item_ids else queryset.none()
    
    def filter_warehouse(self, queryset, name, value):
        # This is handled in serializer context
        return queryset


class ItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Item CRUD operations.
    """
    queryset = Item.objects.select_related('for_category').all()
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ItemFilter
    search_fields = ['code', 'name']
    ordering_fields = ['code', 'name', 'created_at', 'updated_at']
    ordering = ['code']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [CanManageItems()]
        return [CanViewItems()]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        # Get warehouse from query params
        warehouse_id = self.request.query_params.get('warehouse')
        if warehouse_id:
            context['warehouse_id'] = warehouse_id
        return context
    
    @action(detail=True, methods=['get'])
    def stock(self, request, pk=None):
        """Get current stock for item in warehouse."""
        item = self.get_object()
        warehouse_id = request.query_params.get('warehouse')
        
        if warehouse_id:
            from ..models import Warehouse
            try:
                warehouse = Warehouse.objects.get(id=warehouse_id)
                current_stock = StockService.get_current_stock(item, warehouse)
                is_below_min = item.is_below_min_stock(warehouse)
            except Warehouse.DoesNotExist:
                return Response(
                    {'error': {'code': 404, 'message': 'Warehouse not found', 'details': {}}},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            current_stock = StockService.get_current_stock(item)
            is_below_min = item.is_below_min_stock()
        
        return Response({
            'item_id': item.id,
            'item_code': item.code,
            'warehouse_id': warehouse_id,
            'current_stock': float(current_stock),
            'min_stock': item.min_stock,
            'is_below_min': is_below_min
        })

