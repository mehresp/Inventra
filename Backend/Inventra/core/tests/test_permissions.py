"""
Tests for permission classes.
"""
import pytest
from rest_framework.test import APIRequestFactory

from core.permissions import (
    IsAdmin, IsStorekeeper, CanManageItems, CanManageMovements,
    CanViewMovements, CanManageRequisitions
)
from core.models import Item


@pytest.mark.django_db
def test_is_admin_permission(admin_user, storekeeper_user):
    """Test IsAdmin permission class."""
    factory = APIRequestFactory()
    request = factory.get('/')
    request.user = admin_user
    
    permission = IsAdmin()
    assert permission.has_permission(request, None) is True
    
    request.user = storekeeper_user
    assert permission.has_permission(request, None) is False


@pytest.mark.django_db
def test_is_storekeeper_permission(admin_user, storekeeper_user, requester_user):
    """Test IsStorekeeper permission class."""
    factory = APIRequestFactory()
    permission = IsStorekeeper()
    
    request = factory.get('/')
    request.user = admin_user
    assert permission.has_permission(request, None) is True
    
    request.user = storekeeper_user
    assert permission.has_permission(request, None) is True
    
    request.user = requester_user
    assert permission.has_permission(request, None) is False


@pytest.mark.django_db
def test_can_manage_items_permission(admin_user, storekeeper_user):
    """Test CanManageItems permission class."""
    factory = APIRequestFactory()
    permission = CanManageItems()
    
    request = factory.get('/')
    request.user = admin_user
    assert permission.has_permission(request, None) is True
    
    request.user = storekeeper_user
    assert permission.has_permission(request, None) is False


@pytest.mark.django_db
def test_can_manage_movements_permission(admin_user, storekeeper_user, requester_user):
    """Test CanManageMovements permission class."""
    factory = APIRequestFactory()
    permission = CanManageMovements()
    
    request = factory.get('/')
    request.user = admin_user
    assert permission.has_permission(request, None) is True
    
    request.user = storekeeper_user
    assert permission.has_permission(request, None) is True
    
    request.user = requester_user
    assert permission.has_permission(request, None) is False


@pytest.mark.django_db
def test_can_view_movements_permission(admin_user, storekeeper_user, requester_user):
    """Test CanViewMovements permission class."""
    factory = APIRequestFactory()
    permission = CanViewMovements()
    
    request = factory.get('/')
    request.user = admin_user
    assert permission.has_permission(request, None) is True
    
    request.user = storekeeper_user
    assert permission.has_permission(request, None) is True
    
    request.user = requester_user
    assert permission.has_permission(request, None) is False

