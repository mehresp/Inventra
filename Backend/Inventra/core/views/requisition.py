"""
ViewSet for Requisition model.
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as django_filters

from ..models import Requisition
from ..serializers import RequisitionSerializer
from ..permissions import CanManageRequisitions, CanApproveRequisitions
from ..services import RequisitionService


class RequisitionFilter(django_filters.FilterSet):
    """Filter for Requisition ViewSet."""
    status = django_filters.ChoiceFilter(choices=Requisition.Status.choices)
    requester = django_filters.NumberFilter(field_name='for_requester')
    dept_lab = django_filters.ChoiceFilter(choices=Requisition.DeptLab.choices)
    
    class Meta:
        model = Requisition
        fields = ['status', 'requester', 'dept_lab']


class RequisitionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Requisition CRUD operations with custom actions.
    """
    queryset = Requisition.objects.select_related(
        'for_requester', 'for_approved_by'
    ).prefetch_related('lines__for_item', 'lines__for_lot').all()
    serializer_class = RequisitionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = RequisitionFilter
    search_fields = ['req_no', 'dept_lab']
    ordering_fields = ['created_at', 'status', 'needed_by']
    ordering = ['-created_at']
    
    def get_permissions(self):
        if self.action in ['approve', 'reject', 'fulfill']:
            return [CanApproveRequisitions()]
        return [CanManageRequisitions()]
    
    def get_queryset(self):
        """Filter queryset based on user role."""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Non-admin/storekeeper users can only see their own requisitions
        try:
            profile = user.profile
            if profile.for_role.name not in ['Admin', 'Storekeeper']:
                queryset = queryset.filter(for_requester=user)
        except:
            queryset = queryset.filter(for_requester=user)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a requisition."""
        requisition = self.get_object()
        approved_lines = request.data.get('approved_lines', {})
        
        try:
            requisition = RequisitionService.approve_requisition(
                requisition=requisition,
                approver=request.user,
                approved_lines=approved_lines
            )
            serializer = self.get_serializer(requisition)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': {'code': 400, 'message': str(e), 'details': {}}},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a requisition."""
        requisition = self.get_object()
        reason = request.data.get('reason')
        
        try:
            requisition = RequisitionService.reject_requisition(
                requisition=requisition,
                approver=request.user,
                reason=reason
            )
            serializer = self.get_serializer(requisition)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': {'code': 400, 'message': str(e), 'details': {}}},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def fulfill(self, request, pk=None):
        """Fulfill a requisition."""
        requisition = self.get_object()
        
        try:
            requisition = RequisitionService.fulfill_requisition(
                requisition=requisition,
                fulfiller=request.user
            )
            serializer = self.get_serializer(requisition)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': {'code': 400, 'message': str(e), 'details': {}}},
                status=status.HTTP_400_BAD_REQUEST
            )

