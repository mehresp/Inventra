"""
Business logic services for Inventra.
"""
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from decimal import Decimal
from datetime import datetime, timedelta
import logging

from .models import (
    Item, Warehouse, StockLot, Movement, Requisition, RequisitionLine,
    InventoryCount, InventoryCountLine, Role, UserProfile
)

logger = logging.getLogger(__name__)


class StockService:
    """
    Service for stock calculations and validations.
    """
    
    @staticmethod
    def get_current_stock(item, warehouse=None):
        """
        Get current stock for an item in a warehouse.
        """
        return item.get_current_stock(warehouse)
    
    @staticmethod
    def validate_stock_available(item, warehouse, qty, allow_override=False):
        """
        Validate if sufficient stock is available for OUT movement.
        
        Args:
            item: Item instance
            warehouse: Warehouse instance
            qty: Quantity to check
            allow_override: If True, allow even if below minimum stock
            
        Returns:
            tuple: (is_valid, message)
        """
        current_stock = StockService.get_current_stock(item, warehouse)
        
        if current_stock < qty:
            return False, f"Insufficient stock. Available: {current_stock}, Requested: {qty}"
        
        if not allow_override and item.is_below_min_stock(warehouse):
            return False, f"Stock below minimum ({item.min_stock}). Current: {current_stock}"
        
        return True, "Stock available"


class FEFOService:
    """
    Service for First-Expire-First-Out (FEFO) lot picking logic.
    """
    
    @staticmethod
    def get_lots_for_out(item, warehouse, qty):
        """
        Get lots to use for OUT movement based on FEFO (First Expire First Out).
        
        Returns list of tuples: [(lot, qty_to_use), ...]
        """
        # Get all lots with available quantity, ordered by expiry date (earliest first)
        lots = StockLot.objects.filter(
            for_item=item,
            for_warehouse=warehouse,
            qty__gt=0
        ).order_by('expiry_date', 'batch_no')
        
        if not lots.exists():
            raise ValidationError(f"No lots available for {item} in {warehouse}")
        
        result = []
        remaining_qty = qty
        
        for lot in lots:
            if remaining_qty <= 0:
                break
            
            qty_to_use = min(lot.qty, remaining_qty)
            result.append((lot, qty_to_use))
            remaining_qty -= qty_to_use
        
        if remaining_qty > 0:
            raise ValidationError(f"Insufficient stock in lots. Remaining: {remaining_qty}")
        
        return result


class MovementService:
    """
    Service for movement creation and validation.
    """
    
    @staticmethod
    @transaction.atomic
    def create_movement(
        item, movement_type, ref_type, ref_no, qty, actor,
        warehouse_from=None, warehouse_to=None, notes=None, override=False
    ):
        """
        Create a movement with stock validation.
        
        Args:
            item: Item instance
            movement_type: Movement.Type
            ref_type: Movement.RefType
            ref_no: Reference number
            qty: Quantity
            actor: User instance
            warehouse_from: Warehouse instance (for OUT, TRANSFER)
            warehouse_to: Warehouse instance (for IN, RETURN, TRANSFER)
            notes: Optional notes
            override: If True, allow OUT even if below minimum stock
            
        Returns:
            Movement instance
        """
        # Validate movement type requirements
        if movement_type == Movement.Type.OUT:
            if not warehouse_from:
                raise ValidationError("OUT movement requires warehouse_from")
            # Validate stock availability
            is_valid, message = StockService.validate_stock_available(
                item, warehouse_from, qty, allow_override=override
            )
            if not is_valid:
                raise ValidationError(message)
        
        elif movement_type == Movement.Type.IN:
            if not warehouse_to:
                raise ValidationError("IN movement requires warehouse_to")
        
        elif movement_type == Movement.Type.ADJUST:
            # ADJUST requires either warehouse_from (decrease) or warehouse_to (increase)
            if not warehouse_from and not warehouse_to:
                raise ValidationError("ADJUST movement requires either warehouse_from or warehouse_to")
            if warehouse_from and warehouse_to:
                raise ValidationError("ADJUST movement should have either warehouse_from OR warehouse_to, not both")
        
        elif movement_type == Movement.Type.TRANSFER:
            if not warehouse_from or not warehouse_to:
                raise ValidationError("TRANSFER requires both warehouse_from and warehouse_to")
            if warehouse_from == warehouse_to:
                raise ValidationError("TRANSFER source and destination must be different")
            # Validate stock availability in source warehouse
            is_valid, message = StockService.validate_stock_available(
                item, warehouse_from, qty, allow_override=override
            )
            if not is_valid:
                raise ValidationError(message)
        
        # Create movement
        movement = Movement.objects.create(
            type=movement_type,
            ref_type=ref_type,
            ref_no=ref_no,
            for_item=item,
            for_warehouse_from=warehouse_from,
            for_warehouse_to=warehouse_to,
            qty=qty,
            for_actor=actor,
            notes=notes
        )
        
        # Update stock lots for OUT movements
        if movement_type == Movement.Type.OUT and warehouse_from:
            MovementService.update_lots_for_out(item, warehouse_from, qty)
        
        # Check for shortage alerts
        if movement_type == Movement.Type.OUT:
            current_stock = StockService.get_current_stock(item, warehouse_from)
            if item.is_below_min_stock(warehouse_from):
                # Trigger shortage alert (would be handled by Celery task)
                logger.warning(
                    f"Shortage alert: {item} in {warehouse_from} "
                    f"is below minimum ({item.min_stock}). Current: {current_stock}"
                )
        
        return movement
    
    @staticmethod
    @transaction.atomic
    def update_lots_for_out(item, warehouse, qty):
        """
        Update lot quantities for OUT movement using FEFO.
        """
        lots_to_use = FEFOService.get_lots_for_out(item, warehouse, qty)
        
        for lot, qty_to_use in lots_to_use:
            lot.qty -= qty_to_use
            if lot.qty < 0:
                lot.qty = Decimal('0')
            lot.save()


class RequisitionService:
    """
    Service for requisition workflow management.
    """
    
    @staticmethod
    @transaction.atomic
    def approve_requisition(requisition, approver, approved_lines=None):
        """
        Approve a requisition with optional line-level approval quantities.
        
        Args:
            requisition: Requisition instance
            approver: User instance
            approved_lines: Dict mapping line_id to approved_qty
        """
        if requisition.status != Requisition.Status.PENDING:
            raise ValidationError(f"Cannot approve requisition in status: {requisition.status}")
        
        # Update line approved quantities if provided
        if approved_lines:
            for line_id, approved_qty in approved_lines.items():
                try:
                    line = RequisitionLine.objects.get(
                        id=line_id,
                        for_requisition=requisition
                    )
                    if approved_qty > line.requested_qty:
                        raise ValidationError(
                            f"Approved quantity cannot exceed requested for line {line_id}"
                        )
                    line.approved_qty = approved_qty
                    line.save()
                except RequisitionLine.DoesNotExist:
                    raise ValidationError(f"Requisition line {line_id} not found")
        
        requisition.status = Requisition.Status.APPROVED
        requisition.for_approved_by = approver
        requisition.save()
        
        return requisition
    
    @staticmethod
    @transaction.atomic
    def reject_requisition(requisition, approver, reason=None):
        """
        Reject a requisition.
        """
        if requisition.status != Requisition.Status.PENDING:
            raise ValidationError(f"Cannot reject requisition in status: {requisition.status}")
        
        requisition.status = Requisition.Status.REJECTED
        requisition.for_approved_by = approver
        if reason:
            requisition.notes = f"{requisition.notes or ''}\nRejection reason: {reason}".strip()
        requisition.save()
        
        return requisition
    
    @staticmethod
    @transaction.atomic
    def fulfill_requisition(requisition, fulfiller):
        """
        Fulfill a requisition by creating OUT movements for approved lines.
        """
        if requisition.status != Requisition.Status.APPROVED:
            raise ValidationError(f"Cannot fulfill requisition in status: {requisition.status}")
        
        lines = requisition.lines.filter(approved_qty__gt=0)
        
        if not lines.exists():
            raise ValidationError("No approved lines to fulfill")
        
        for line in lines:
            if line.issued_qty >= line.approved_qty:
                continue  # Already fulfilled
            
            qty_to_issue = line.approved_qty - line.issued_qty
            
            # Get warehouse from lot if specified, otherwise get first available warehouse
            if line.for_lot:
                warehouse = line.for_lot.for_warehouse
            else:
                # Get first warehouse with stock for this item
                lots = StockLot.objects.filter(
                    for_item=line.for_item,
                    qty__gt=0
                ).select_related('for_warehouse').first()
                if not lots:
                    raise ValidationError(f"No stock available for {line.for_item}")
                warehouse = lots.for_warehouse
            
            # Create OUT movement
            MovementService.create_movement(
                item=line.for_item,
                movement_type=Movement.Type.OUT,
                ref_type=Movement.RefType.REQ,
                ref_no=requisition.req_no,
                qty=qty_to_issue,
                actor=fulfiller,
                warehouse_from=warehouse,
                notes=f"Fulfillment of {requisition.req_no}"
            )
            
            line.issued_qty += qty_to_issue
            line.save()
        
        # Check if all lines are fulfilled
        all_fulfilled = all(
            line.issued_qty >= line.approved_qty
            for line in lines
        )
        
        if all_fulfilled:
            requisition.status = Requisition.Status.FULFILLED
            requisition.fulfilled_at = timezone.now()
            requisition.save()
        
        return requisition


class InventoryCountService:
    """
    Service for inventory count workflow management.
    """
    
    @staticmethod
    @transaction.atomic
    def start_count(warehouse, period):
        """
        Start an inventory count and create snapshot of system quantities.
        """
        if InventoryCount.objects.filter(
            for_warehouse=warehouse,
            status=InventoryCount.Status.OPEN
        ).exists():
            raise ValidationError("An open inventory count already exists for this warehouse")
        
        count = InventoryCount.objects.create(
            period=period,
            for_warehouse=warehouse,
            status=InventoryCount.Status.OPEN
        )
        
        # Create snapshot of current system quantities
        items = Item.objects.filter(is_active=True)
        for item in items:
            system_qty = StockService.get_current_stock(item, warehouse)
            InventoryCountLine.objects.create(
                for_count=count,
                for_item=item,
                system_qty=system_qty,
                counted_qty=system_qty,  # Initialize with system qty
                delta=Decimal('0')
            )
        
        return count
    
    @staticmethod
    @transaction.atomic
    def import_count_data(count, count_data):
        """
        Import counted quantities from CSV or manual entry.
        
        Args:
            count: InventoryCount instance
            count_data: List of dicts with 'item_id' or 'item_code' and 'counted_qty'
        """
        if count.status != InventoryCount.Status.OPEN:
            raise ValidationError("Can only import data for open counts")
        
        for data in count_data:
            item = None
            if 'item_id' in data and data['item_id']:
                try:
                    item = Item.objects.get(id=data['item_id'])
                except (Item.DoesNotExist, ValueError):
                    logger.warning(f"Item not found: {data['item_id']}")
                    continue
            elif 'item_code' in data and data['item_code']:
                try:
                    item = Item.objects.get(code=data['item_code'])
                except Item.DoesNotExist:
                    logger.warning(f"Item not found: {data['item_code']}")
                    continue
            
            if not item:
                logger.warning(f"Skipping count data entry without item_id or item_code: {data}")
                continue
            
            counted_qty = Decimal(str(data['counted_qty']))
            
            # Get or create count line
            line, created = InventoryCountLine.objects.get_or_create(
                for_count=count,
                for_item=item,
                defaults={
                    'system_qty': StockService.get_current_stock(item, count.for_warehouse),
                    'counted_qty': counted_qty
                }
            )
            
            if not created:
                line.counted_qty = counted_qty
            
            # Calculate delta
            line.delta = line.counted_qty - line.system_qty
            line.save()
        
        return count
    
    @staticmethod
    @transaction.atomic
    def close_count(count, user):
        """
        Close inventory count and generate ADJUST movements for discrepancies.
        """
        if count.status != InventoryCount.Status.OPEN:
            raise ValidationError("Can only close open counts")
        
        lines_with_discrepancies = count.lines.filter(delta__ne=0)
        
        # Create ADJUST movements for discrepancies
        for line in lines_with_discrepancies:
            # For positive delta, we need to add stock (warehouse_to)
            # For negative delta, we need to subtract stock (warehouse_from)
            if line.delta > 0:
                MovementService.create_movement(
                    item=line.for_item,
                    movement_type=Movement.Type.ADJUST,
                    ref_type=Movement.RefType.INVCOUNT,
                    ref_no=count.period,
                    qty=line.delta,
                    actor=user,
                    warehouse_to=count.for_warehouse,
                    notes=f"Inventory count adjustment: {count.period}",
                    override=True
                )
            else:
                MovementService.create_movement(
                    item=line.for_item,
                    movement_type=Movement.Type.ADJUST,
                    ref_type=Movement.RefType.INVCOUNT,
                    ref_no=count.period,
                    qty=abs(line.delta),  # ADJUST with negative qty doesn't make sense, use positive qty with warehouse_from
                    actor=user,
                    warehouse_from=count.for_warehouse,
                    notes=f"Inventory count adjustment: {count.period}",
                    override=True
                )
        
        count.status = InventoryCount.Status.CLOSED
        count.closed_at = timezone.now()
        count.save()
        
        return count


class ReportService:
    """
    Service for generating reports.
    """
    
    @staticmethod
    def get_shortages(warehouse=None, category=None):
        """
        Get items with stock below minimum.
        """
        items = Item.objects.filter(is_active=True)
        
        if category:
            items = items.filter(for_category=category)
        
        shortages = []
        for item in items:
            stock = StockService.get_current_stock(item, warehouse)
            if stock < item.min_stock:
                shortages.append({
                    'item': item,
                    'current_stock': stock,
                    'min_stock': item.min_stock,
                    'shortage': item.min_stock - stock,
                    'warehouse': warehouse
                })
        
        return shortages
    
    @staticmethod
    def get_monthly_flow(year, month, warehouse=None, item=None):
        """
        Get monthly IN/OUT flow statistics.
        """
        from django.db.models import Sum, Q
        
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        
        movements = Movement.objects.filter(
            created_at__gte=start_date,
            created_at__lt=end_date
        )
        
        if warehouse:
            movements = movements.filter(
                Q(for_warehouse_from=warehouse) | Q(for_warehouse_to=warehouse)
            )
        
        if item:
            movements = movements.filter(for_item=item)
        
        # Calculate IN
        in_qty = movements.filter(
            type__in=[Movement.Type.IN, Movement.Type.RETURN]
        ).aggregate(total=Sum('qty'))['total'] or Decimal('0')
        
        # Add TRANSFER_in
        if warehouse:
            transfer_in = movements.filter(
                type=Movement.Type.TRANSFER,
                for_warehouse_to=warehouse
            ).aggregate(total=Sum('qty'))['total'] or Decimal('0')
            in_qty += transfer_in
        
        # Calculate OUT
        out_qty = movements.filter(type=Movement.Type.OUT).aggregate(
            total=Sum('qty')
        )['total'] or Decimal('0')
        
        # Add TRANSFER_out
        if warehouse:
            transfer_out = movements.filter(
                type=Movement.Type.TRANSFER,
                for_warehouse_from=warehouse
            ).aggregate(total=Sum('qty'))['total'] or Decimal('0')
            out_qty += transfer_out
        
        return {
            'in': in_qty,
            'out': out_qty,
            'net': in_qty - out_qty,
            'period': f"{year}-{month:02d}",
            'warehouse': warehouse,
            'item': item
        }

