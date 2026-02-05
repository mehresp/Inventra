"""
Django signals for audit logging and model lifecycle hooks.
"""
import json
from django.db.models.signals import pre_save, post_save, pre_delete, post_delete
from django.dispatch import receiver
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import AuditLog

User = get_user_model()

# Models to track for audit logging
TRACKED_MODELS = [
    'Item', 'Warehouse', 'StockLot', 'Movement', 'Requisition',
    'RequisitionLine', 'InventoryCount', 'InventoryCountLine',
    'Supplier', 'PurchaseOrder', 'Category', 'Role', 'UserProfile'
]


def get_client_ip(request):
    """Get client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_user_agent(request):
    """Get user agent from request."""
    return request.META.get('HTTP_USER_AGENT', '')


def serialize_model_instance(instance):
    """
    Serialize model instance to JSON-compatible dict.
    """
    from decimal import Decimal
    
    if instance is None:
        return None
    
    data = {}
    for field in instance._meta.get_fields():
        if field.is_relation:
            if field.many_to_one or field.one_to_one:
                try:
                    related_obj = getattr(instance, field.name, None)
                    if related_obj:
                        data[field.name] = str(related_obj)
                except:
                    data[field.name] = None
            # Skip many-to-many for now
        else:
            value = getattr(instance, field.name, None)
            # Convert Decimal to float
            if isinstance(value, Decimal):
                value = float(value)
            # Convert datetime to string
            elif hasattr(value, 'isoformat'):
                value = value.isoformat()
            data[field.name] = value
    return data


class AuditLogMiddleware:
    """
    Middleware to capture request context for audit logging.
    """
    def __init__(self, get_response):
        self.get_response = get_response
        self.request = None

    def __call__(self, request):
        self.request = request
        response = self.get_response(request)
        return response


# Thread-local storage for request
import threading
_request_context = threading.local()


def get_current_request():
    """Get current request from thread-local storage."""
    return getattr(_request_context, 'request', None)


def set_current_request(request):
    """Set current request in thread-local storage."""
    _request_context.request = request


@receiver(pre_save)
def pre_save_handler(sender, instance, **kwargs):
    """
    Capture model state before save for audit logging.
    """
    if sender.__name__ not in TRACKED_MODELS:
        return
    
    # Store original instance state
    if instance.pk:
        try:
            original = sender.objects.get(pk=instance.pk)
            instance._audit_original = serialize_model_instance(original)
        except sender.DoesNotExist:
            instance._audit_original = None
    else:
        instance._audit_original = None


@receiver(post_save)
def post_save_handler(sender, instance, created, **kwargs):
    """
    Log model save operations to audit log.
    """
    if sender.__name__ not in TRACKED_MODELS:
        return
    
    request = get_current_request()
    
    if not request or not request.user or not request.user.is_authenticated:
        return  # Skip audit logging if no authenticated user
    
    action = 'CREATE' if created else 'UPDATE'
    before = getattr(instance, '_audit_original', None)
    after = serialize_model_instance(instance)
    
    # Get IP and user agent from request
    ip = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    AuditLog.objects.create(
        for_actor=request.user,
        entity=sender.__name__,
        entity_id=str(instance.pk),
        action=action,
        before=before,
        after=after,
        ip=ip,
        user_agent=user_agent
    )


@receiver(pre_delete)
def pre_delete_handler(sender, instance, **kwargs):
    """
    Capture model state before delete for audit logging.
    """
    if sender.__name__ not in TRACKED_MODELS:
        return
    
    # Store instance state for deletion
    instance._audit_original = serialize_model_instance(instance)


@receiver(post_delete)
def post_delete_handler(sender, instance, **kwargs):
    """
    Log model delete operations to audit log.
    """
    if sender.__name__ not in TRACKED_MODELS:
        return
    
    request = get_current_request()
    
    if not request or not request.user or not request.user.is_authenticated:
        return  # Skip audit logging if no authenticated user
    
    before = getattr(instance, '_audit_original', None)
    
    # Get IP and user agent from request
    ip = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    AuditLog.objects.create(
        for_actor=request.user,
        entity=sender.__name__,
        entity_id=str(instance.pk),
        action='DELETE',
        before=before,
        after=None,
        ip=ip,
        user_agent=user_agent
    )

