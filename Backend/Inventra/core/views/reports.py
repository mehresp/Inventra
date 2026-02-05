"""
ViewSet for Reports endpoints.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from ..models import Requisition, InventoryCount
from ..permissions import CanViewItems
from ..services import ReportService


class ReportsViewSet(viewsets.ViewSet):
    """
    ViewSet for Reports endpoints.
    """
    permission_classes = [IsAuthenticated, CanViewItems]
    
    @action(detail=False, methods=['get'])
    def shortages(self, request):
        """Get items with stock below minimum."""
        warehouse_id = request.query_params.get('warehouse')
        category_id = request.query_params.get('category')
        
        warehouse = None
        if warehouse_id:
            from ..models import Warehouse
            try:
                warehouse = Warehouse.objects.get(id=warehouse_id)
            except Warehouse.DoesNotExist:
                return Response(
                    {'error': {'code': 404, 'message': 'Warehouse not found', 'details': {}}},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        category = None
        if category_id:
            from ..models import Category
            try:
                category = Category.objects.get(id=category_id)
            except Category.DoesNotExist:
                return Response(
                    {'error': {'code': 404, 'message': 'Category not found', 'details': {}}},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        shortages = ReportService.get_shortages(warehouse=warehouse, category=category)
        
        from decimal import Decimal
        result = []
        for shortage in shortages:
            current_stock = shortage['current_stock']
            min_stock = shortage['min_stock']
            shortage_val = shortage['shortage']
            
            # Convert Decimal to float
            if isinstance(current_stock, Decimal):
                current_stock = float(current_stock)
            if isinstance(min_stock, Decimal):
                min_stock = float(min_stock)
            if isinstance(shortage_val, Decimal):
                shortage_val = float(shortage_val)
            
            result.append({
                'item_id': shortage['item'].id,
                'item_code': shortage['item'].code,
                'item_name': shortage['item'].name,
                'warehouse_id': shortage['warehouse'].id if shortage['warehouse'] else None,
                'warehouse_name': shortage['warehouse'].name if shortage['warehouse'] else None,
                'current_stock': current_stock,
                'min_stock': min_stock,
                'shortage': shortage_val
            })
        
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def monthly_flow(self, request):
        """Get monthly IN/OUT flow statistics."""
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        warehouse_id = request.query_params.get('warehouse')
        item_id = request.query_params.get('item')
        
        if not year or not month:
            return Response(
                {'error': {'code': 400, 'message': 'year and month are required', 'details': {}}},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            year = int(year)
            month = int(month)
        except ValueError:
            return Response(
                {'error': {'code': 400, 'message': 'year and month must be integers', 'details': {}}},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        warehouse = None
        if warehouse_id:
            from ..models import Warehouse
            try:
                warehouse = Warehouse.objects.get(id=warehouse_id)
            except Warehouse.DoesNotExist:
                return Response(
                    {'error': {'code': 404, 'message': 'Warehouse not found', 'details': {}}},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        item = None
        if item_id:
            from ..models import Item
            try:
                item = Item.objects.get(id=item_id)
            except Item.DoesNotExist:
                return Response(
                    {'error': {'code': 404, 'message': 'Item not found', 'details': {}}},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        flow = ReportService.get_monthly_flow(year, month, warehouse=warehouse, item=item)
        
        # Convert Decimal to float
        from decimal import Decimal
        in_val = flow['in']
        out_val = flow['out']
        net_val = flow['net']
        
        if isinstance(in_val, Decimal):
            in_val = float(in_val)
        if isinstance(out_val, Decimal):
            out_val = float(out_val)
        if isinstance(net_val, Decimal):
            net_val = float(net_val)
        
        return Response({
            'period': flow['period'],
            'warehouse_id': flow['warehouse'].id if flow['warehouse'] else None,
            'warehouse_name': flow['warehouse'].name if flow['warehouse'] else None,
            'item_id': flow['item'].id if flow['item'] else None,
            'item_code': flow['item'].code if flow['item'] else None,
            'in': in_val,
            'out': out_val,
            'net': net_val
        })
    
    @action(detail=False, methods=['get'])
    def consumption_by_dept(self, request):
        """Get consumption by department/lab from requisitions."""
        dept_lab = request.query_params.get('dept_lab')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        from django.utils.dateparse import parse_date
        from django.db.models import Sum, Q
        from django.utils import timezone
        
        requisitions = Requisition.objects.filter(
            status=Requisition.Status.FULFILLED
        ).prefetch_related('lines')
        
        if dept_lab:
            requisitions = requisitions.filter(dept_lab=dept_lab)
        
        if start_date:
            try:
                start = parse_date(start_date)
                if start:
                    from datetime import datetime as dt
                    requisitions = requisitions.filter(fulfilled_at__gte=timezone.make_aware(
                        dt.combine(start, dt.min.time())
                    ))
            except (ValueError, TypeError):
                pass
        
        if end_date:
            try:
                end = parse_date(end_date)
                if end:
                    from datetime import datetime as dt
                    requisitions = requisitions.filter(fulfilled_at__lte=timezone.make_aware(
                        dt.combine(end, dt.max.time())
                    ))
            except (ValueError, TypeError):
                pass
        
        # Aggregate consumption by department
        consumption = {}
        for req in requisitions:
            dept = req.dept_lab
            if dept not in consumption:
                consumption[dept] = {
                    'requisitions_count': 0,
                    'total_items': 0,
                    'total_qty': 0
                }
            
            consumption[dept]['requisitions_count'] += 1
            for line in req.lines.all():
                consumption[dept]['total_items'] += 1
                from decimal import Decimal
                qty_val = line.issued_qty
                if isinstance(qty_val, Decimal):
                    qty_val = float(qty_val)
                consumption[dept]['total_qty'] += qty_val
        
        return Response(consumption)
    
    @action(detail=False, methods=['get'])
    def discrepancies(self, request):
        """Get inventory count discrepancies."""
        warehouse_id = request.query_params.get('warehouse')
        count_id = request.query_params.get('count_id')
        
        counts = InventoryCount.objects.filter(
            status=InventoryCount.Status.CLOSED
        ).prefetch_related('lines__for_item')
        
        if warehouse_id:
            counts = counts.filter(for_warehouse_id=warehouse_id)
        
        if count_id:
            counts = counts.filter(id=count_id)
        
        from decimal import Decimal
        discrepancies = []
        for count in counts:
            for line in count.lines.filter(delta__ne=0):
                system_qty = line.system_qty
                counted_qty = line.counted_qty
                delta = line.delta
                
                # Convert Decimal to float
                if isinstance(system_qty, Decimal):
                    system_qty = float(system_qty)
                if isinstance(counted_qty, Decimal):
                    counted_qty = float(counted_qty)
                if isinstance(delta, Decimal):
                    delta = float(delta)
                
                discrepancies.append({
                    'count_id': count.id,
                    'count_period': count.period,
                    'warehouse_id': count.for_warehouse.id,
                    'warehouse_name': count.for_warehouse.name,
                    'item_id': line.for_item.id,
                    'item_code': line.for_item.code,
                    'item_name': line.for_item.name,
                    'system_qty': system_qty,
                    'counted_qty': counted_qty,
                    'delta': delta,
                    'closed_at': count.closed_at.isoformat() if count.closed_at else None
                })
        
        return Response(discrepancies)

