"""
Tests for models.
"""
import pytest
from decimal import Decimal
from django.core.exceptions import ValidationError

from core.models import Item, Movement, Requisition, Warehouse


@pytest.mark.django_db
def test_item_str(item):
    """Test Item __str__ method."""
    assert str(item) == f"{item.code} · {item.name}"


@pytest.mark.django_db
def test_item_get_current_stock(item, warehouse):
    """Test Item get_current_stock method."""
    stock = item.get_current_stock(warehouse)
    assert stock == Decimal('0')  # No movements yet


@pytest.mark.django_db
def test_item_get_current_stock_with_movements(item, warehouse, admin_user):
    """Test Item get_current_stock with movements."""
    # Create IN movement
    Movement.objects.create(
        type=Movement.Type.IN,
        ref_type=Movement.RefType.OTHER,
        ref_no='TEST001',
        for_item=item,
        for_warehouse_to=warehouse,
        qty=Decimal('50'),
        for_actor=admin_user
    )
    
    stock = item.get_current_stock(warehouse)
    assert stock == Decimal('50')
    
    # Create OUT movement
    Movement.objects.create(
        type=Movement.Type.OUT,
        ref_type=Movement.RefType.OTHER,
        ref_no='TEST002',
        for_item=item,
        for_warehouse_from=warehouse,
        qty=Decimal('20'),
        for_actor=admin_user
    )
    
    stock = item.get_current_stock(warehouse)
    assert stock == Decimal('30')


@pytest.mark.django_db
def test_item_is_below_min_stock(item, warehouse):
    """Test Item is_below_min_stock method."""
    # No stock, should be below min
    assert item.is_below_min_stock(warehouse) is True


@pytest.mark.django_db
def test_movement_validation_transfer(warehouse, item, admin_user):
    """Test Movement validation for TRANSFER type."""
    warehouse2 = Warehouse.objects.create(name='Warehouse 2', location='Location 2')
    
    # Valid TRANSFER
    movement = Movement(
        type=Movement.Type.TRANSFER,
        ref_type=Movement.RefType.OTHER,
        ref_no='TRANSFER001',
        for_item=item,
        for_warehouse_from=warehouse,
        for_warehouse_to=warehouse2,
        qty=Decimal('10'),
        for_actor=admin_user
    )
    movement.clean()  # Should not raise
    
    # Invalid TRANSFER - missing warehouses
    movement2 = Movement(
        type=Movement.Type.TRANSFER,
        ref_type=Movement.RefType.OTHER,
        ref_no='TRANSFER002',
        for_item=item,
        qty=Decimal('10'),
        for_actor=admin_user
    )
    with pytest.raises(ValidationError):
        movement2.clean()
    
    # Invalid TRANSFER - same warehouse
    movement3 = Movement(
        type=Movement.Type.TRANSFER,
        ref_type=Movement.RefType.OTHER,
        ref_no='TRANSFER003',
        for_item=item,
        for_warehouse_from=warehouse,
        for_warehouse_to=warehouse,
        qty=Decimal('10'),
        for_actor=admin_user
    )
    with pytest.raises(ValidationError):
        movement3.clean()


@pytest.mark.django_db
def test_requisition_str(requester_user):
    """Test Requisition __str__ method."""
    requisition = Requisition.objects.create(
        req_no='REQ001',
        for_requester=requester_user,
        dept_lab=Requisition.DeptLab.CHEMISTRY,
        needed_by='2024-12-31'
    )
    assert 'REQ001' in str(requisition)
    assert requisition.dept_lab in str(requisition)

