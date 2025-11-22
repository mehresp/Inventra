from django.db import models
from django.db.models import Sum, Q, F
from django.utils import timezone
from decimal import Decimal
from .category import Category
from .warehouse import Warehouse

class Item(models.Model):
    code = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=128)
    unit = models.CharField(max_length=32)
    min_stock = models.IntegerField(default=0)
    for_category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="items")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["code"]),
            models.Index(fields=["is_active"]),
            models.Index(fields=["for_category"]),
        ]

    def __str__(self):
        return f"{self.code} · {self.name}"

    def get_current_stock(self, warehouse=None):
        """
        Calculate current stock for this item in a warehouse.
        Formula: Σ(IN + RETURN + TRANSFER_in + ADJUST_pos) − Σ(OUT + TRANSFER_out + ADJUST_neg)
        """
        from .movement import Movement
        
        movements = self.movements.all()
        
        if warehouse:
            # Filter movements related to this warehouse
            movements = movements.filter(
                Q(for_warehouse_to=warehouse) | Q(for_warehouse_from=warehouse)
            )
        
        # Calculate stock increases
        increases = movements.filter(
            type__in=[Movement.Type.IN, Movement.Type.RETURN]
        ).aggregate(total=Sum('qty'))['total'] or Decimal('0')
        
        # Add TRANSFER_in (when this warehouse is the destination)
        if warehouse:
            transfers_in = movements.filter(
                type=Movement.Type.TRANSFER,
                for_warehouse_to=warehouse
            ).aggregate(total=Sum('qty'))['total'] or Decimal('0')
            increases += transfers_in
        
        # Add positive ADJUST
        adjusts_pos = movements.filter(
            type=Movement.Type.ADJUST,
            qty__gt=0
        ).aggregate(total=Sum('qty'))['total'] or Decimal('0')
        increases += adjusts_pos
        
        # Calculate stock decreases
        decreases = movements.filter(
            type=Movement.Type.OUT
        ).aggregate(total=Sum('qty'))['total'] or Decimal('0')
        
        # Add TRANSFER_out (when this warehouse is the source)
        if warehouse:
            transfers_out = movements.filter(
                type=Movement.Type.TRANSFER,
                for_warehouse_from=warehouse
            ).aggregate(total=Sum('qty'))['total'] or Decimal('0')
            decreases += transfers_out
        
        # Add negative ADJUST
        adjusts_neg = movements.filter(
            type=Movement.Type.ADJUST,
            qty__lt=0
        ).aggregate(total=Sum('qty'))['total'] or Decimal('0')
        decreases += abs(adjusts_neg)
        
        return increases - decreases

    def is_below_min_stock(self, warehouse=None):
        """Check if current stock is below minimum stock level."""
        return self.get_current_stock(warehouse) < self.min_stock
