from django.db import models
from django.conf import settings
from django.utils import timezone
from .item import Item
from .warehouse import Warehouse

class Movement(models.Model):
    class Type(models.TextChoices):
        IN = "IN", "IN"
        OUT = "OUT", "OUT"
        ADJUST = "ADJUST", "ADJUST"
        RETURN = "RETURN", "RETURN"
        TRANSFER = "TRANSFER", "TRANSFER"

    class RefType(models.TextChoices):
        PO = "PO", "PO"
        REQ = "REQ", "REQ"
        INVCOUNT = "INVCOUNT", "INVCOUNT"
        OTHER = "OTHER", "OTHER"

    type = models.CharField(max_length=16, choices=Type.choices)
    ref_type = models.CharField(max_length=16, choices=RefType.choices)
    ref_no = models.CharField(max_length=64)
    for_item = models.ForeignKey(Item, on_delete=models.PROTECT, related_name="movements")
    for_warehouse_from = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name="movements_from", null=True, blank=True)
    for_warehouse_to = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name="movements_to", null=True, blank=True)
    qty = models.DecimalField(max_digits=14, decimal_places=3)
    for_actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.type} {self.qty} {self.for_item}"
