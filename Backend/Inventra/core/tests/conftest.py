"""
Pytest configuration and fixtures.
"""
import pytest
from django.contrib.auth import get_user_model
from decimal import Decimal

from core.models import (
    Role, UserProfile, Category, Item, Warehouse, StockLot,
    Movement, Requisition, RequisitionLine, InventoryCount
)

User = get_user_model()


@pytest.fixture
def admin_role():
    return Role.objects.create(name=Role.Name.ADMIN)


@pytest.fixture
def storekeeper_role():
    return Role.objects.create(name=Role.Name.STOREKEEPER)


@pytest.fixture
def requester_role():
    return Role.objects.create(name=Role.Name.REQUESTER)


@pytest.fixture
def admin_user(admin_role):
    user = User.objects.create_user(
        username='admin_test',
        email='admin@test.com',
        password='testpass123'
    )
    UserProfile.objects.create(user=user, for_role=admin_role)
    return user


@pytest.fixture
def storekeeper_user(storekeeper_role):
    user = User.objects.create_user(
        username='storekeeper_test',
        email='storekeeper@test.com',
        password='testpass123'
    )
    UserProfile.objects.create(user=user, for_role=storekeeper_role)
    return user


@pytest.fixture
def requester_user(requester_role):
    user = User.objects.create_user(
        username='requester_test',
        email='requester@test.com',
        password='testpass123'
    )
    UserProfile.objects.create(user=user, for_role=requester_role)
    return user


@pytest.fixture
def category():
    return Category.objects.create(name='Test Category')


@pytest.fixture
def item(category):
    return Item.objects.create(
        code='TEST001',
        name='Test Item',
        unit='unit',
        min_stock=10,
        for_category=category
    )


@pytest.fixture
def warehouse():
    return Warehouse.objects.create(
        name='Test Warehouse',
        location='Test Location'
    )


@pytest.fixture
def stock_lot(item, warehouse):
    return StockLot.objects.create(
        for_item=item,
        for_warehouse=warehouse,
        batch_no='BATCH001',
        qty=Decimal('100')
    )

