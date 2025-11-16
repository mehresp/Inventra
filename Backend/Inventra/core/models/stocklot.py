from django.db import models
from .item import Item
from .warehouse import Warehouse

class StockLot(models.Model):
    for_item = models.ForeignKey(Item, on_delete=models.PROTECT, related_name="lots")
    for_warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name="lots")
    batch_no = models.CharField(max_length=64)
    expiry_date = models.DateField(null=True, blank=True)
    qty = models.DecimalField(max_digits=14, decimal_places=3, default=0)

    def __str__(self):
        return f"Lot {self.batch_no} · {self.for_item}"
