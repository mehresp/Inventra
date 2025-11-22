"""
Tests for business logic services.
"""
import pytest
from decimal import Decimal
from django.core.exceptions import ValidationError

from core.services import StockService, MovementService
from core.models import Movement, Item, Warehouse


@pytest.mark.django_db
def test_stock_service_get_current_stock(item, warehouse):
    """Test StockService get_current_stock."""
    stock = StockService.get_current_stock(item, warehouse)
    assert stock == Decimal('0')


@pytest.mark.django_db
def test_stock_service_validate_stock_available(item, warehouse, admin_user):
    """Test StockService validate_stock_available."""
    # No stock available
    is_valid, message = StockService.validate_stock_available(item, warehouse, Decimal('10'))
    assert is_valid is False
    assert 'Insufficient' in message or 'below' in message.lower()
    
    # Add stock
    MovementService.create_movement(
        item=item,
        movement_type=Movement.Type.IN,
        ref_type=Movement.RefType.OTHER,
        ref_no='IN001',
        qty=Decimal('50'),
        actor=admin_user,
        warehouse_to=warehouse
    )
    
    # Now should have stock
    is_valid, message = StockService.validate_stock_available(item, warehouse, Decimal('10'))
    assert is_valid is True
    
    # Try to get more than available
    is_valid, message = StockService.validate_stock_available(item, warehouse, Decimal('100'))
    assert is_valid is False


@pytest.mark.django_db
def test_movement_service_create_in(item, warehouse, admin_user):
    """Test MovementService create_movement for IN type."""
    movement = MovementService.create_movement(
        item=item,
        movement_type=Movement.Type.IN,
        ref_type=Movement.RefType.OTHER,
        ref_no='IN001',
        qty=Decimal('100'),
        actor=admin_user,
        warehouse_to=warehouse
    )
    
    assert movement.type == Movement.Type.IN
    assert movement.qty == Decimal('100')
    assert movement.for_warehouse_to == warehouse
    
    # Verify stock increased
    stock = StockService.get_current_stock(item, warehouse)
    assert stock == Decimal('100')


@pytest.mark.django_db
def test_movement_service_create_out(item, warehouse, admin_user):
    """Test MovementService create_movement for OUT type."""
    # First add stock
    MovementService.create_movement(
        item=item,
        movement_type=Movement.Type.IN,
        ref_type=Movement.RefType.OTHER,
        ref_no='IN001',
        qty=Decimal('100'),
        actor=admin_user,
        warehouse_to=warehouse
    )
    
    # Then create OUT
    movement = MovementService.create_movement(
        item=item,
        movement_type=Movement.Type.OUT,
        ref_type=Movement.RefType.OTHER,
        ref_no='OUT001',
        qty=Decimal('30'),
        actor=admin_user,
        warehouse_from=warehouse
    )
    
    assert movement.type == Movement.Type.OUT
    assert movement.qty == Decimal('30')
    
    # Verify stock decreased
    stock = StockService.get_current_stock(item, warehouse)
    assert stock == Decimal('70')


@pytest.mark.django_db
def test_movement_service_create_out_insufficient_stock(item, warehouse, admin_user):
    """Test MovementService create_movement for OUT with insufficient stock."""
    with pytest.raises(ValidationError) as exc_info:
        MovementService.create_movement(
            item=item,
            movement_type=Movement.Type.OUT,
            ref_type=Movement.RefType.OTHER,
            ref_no='OUT001',
            qty=Decimal('100'),
            actor=admin_user,
            warehouse_from=warehouse
        )
    
    assert 'Insufficient' in str(exc_info.value) or 'stock' in str(exc_info.value).lower()

