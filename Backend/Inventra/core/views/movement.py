"""
ViewSet for Movement model.
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as django_filters

from ..models import Movement
from ..serializers import MovementSerializer
from ..permissions import CanManageMovements, CanViewMovements
from ..services import MovementService


class MovementFilter(django_filters.FilterSet):
    """Filter for Movement ViewSet."""
    type = django_filters.ChoiceFilter(choices=Movement.Type.choices)
    item = django_filters.NumberFilter(field_name='for_item')
    warehouse_from = django_filters.NumberFilter(field_name='for_warehouse_from')
    warehouse_to = django_filters.NumberFilter(field_name='for_warehouse_to')
    
    class Meta:
        model = Movement
        fields = ['type', 'ref_type', 'item', 'warehouse_from', 'warehouse_to']


class MovementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Movement CRUD operations.
    """
    queryset = Movement.objects.select_related(
        'for_item', 'for_warehouse_from', 'for_warehouse_to', 'for_actor'
    ).all()
    serializer_class = MovementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = MovementFilter
    search_fields = ['ref_no', 'for_item__code', 'for_item__name']
    ordering_fields = ['created_at', 'type', 'qty']
    ordering = ['-created_at']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [CanManageMovements()]
        return [CanViewMovements()]
    
    def perform_create(self, serializer):
        """Create movement using service for validation."""
        data = serializer.validated_data
        override = self.request.data.get('override', False)
        
        movement = MovementService.create_movement(
            item=data['for_item'],
            movement_type=data['type'],
            ref_type=data['ref_type'],
            ref_no=data['ref_no'],
            qty=data['qty'],
            actor=self.request.user,
            warehouse_from=data.get('for_warehouse_from'),
            warehouse_to=data.get('for_warehouse_to'),
            notes=data.get('notes'),
            override=override
        )
        
        serializer.instance = movement
    
    def create(self, request, *args, **kwargs):
        """Override create to handle service errors and ensure proper serialization."""
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            # Use serializer.data to ensure Decimal fields are properly converted
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            return Response(
                {'error': {'code': 400, 'message': str(e), 'details': {}}},
                status=status.HTTP_400_BAD_REQUEST
            )

