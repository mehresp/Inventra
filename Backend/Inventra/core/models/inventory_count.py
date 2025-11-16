from django.db import models
from django.utils import timezone
from .warehouse import Warehouse
from .item import Item

class InventoryCount(models.Model):
    class Status(models.TextChoices):
        OPEN = "Open", "Open"
        CLOSED = "Closed", "Closed"

    period = models.CharField(max_length=64)
    for_warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name="inventory_counts")
    started_at = models.DateTimeField(default=timezone.now)
    closed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.OPEN)

    def __str__(self):
        return f"InvCount {self.period} @ {self.for_warehouse} · {self.status}"


class InventoryCountLine(models.Model):
    for_count = models.ForeignKey(InventoryCount, on_delete=models.CASCADE, related_name="lines")
    for_item = models.ForeignKey(Item, on_delete=models.PROTECT, related_name="inventory_count_lines")
    system_qty = models.DecimalField(max_digits=14, decimal_places=3, default=0)
    counted_qty = models.DecimalField(max_digits=14, decimal_places=3, default=0)
    delta = models.DecimalField(max_digits=14, decimal_places=3, default=0)

    def __str__(self):
        return f"{self.for_item} · {self.counted_qty} (Δ {self.delta})"
