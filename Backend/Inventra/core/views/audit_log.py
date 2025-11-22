"""
ViewSet for AuditLog model.
"""
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as django_filters

from ..models import AuditLog
from ..serializers import AuditLogSerializer
from ..permissions import CanViewAuditLog


class AuditLogFilter(django_filters.FilterSet):
    """Filter for AuditLog ViewSet."""
    entity = django_filters.CharFilter(field_name='entity')
    action = django_filters.CharFilter(field_name='action')
    actor = django_filters.NumberFilter(field_name='for_actor')
    
    class Meta:
        model = AuditLog
        fields = ['entity', 'action', 'actor']


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for AuditLog read-only operations.
    """
    queryset = AuditLog.objects.select_related('for_actor').all()
    serializer_class = AuditLogSerializer
    permission_classes = [CanViewAuditLog]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = AuditLogFilter
    search_fields = ['entity', 'action', 'for_actor__username']
    ordering_fields = ['created_at', 'entity', 'action']
    ordering = ['-created_at']

