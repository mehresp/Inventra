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

    class Meta:
        indexes = [
            models.Index(fields=["type"]),
            models.Index(fields=["for_item"]),
            models.Index(fields=["for_warehouse_from"]),
            models.Index(fields=["for_warehouse_to"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["ref_type", "ref_no"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.type} {self.qty} {self.for_item}"

    def clean(self):
        """Validate movement based on type."""
        from django.core.exceptions import ValidationError
        
        if self.type == self.Type.TRANSFER:
            if not self.for_warehouse_from or not self.for_warehouse_to:
                raise ValidationError("TRANSFER movements require both from and to warehouses.")
            if self.for_warehouse_from == self.for_warehouse_to:
                raise ValidationError("TRANSFER source and destination warehouses must be different.")
        elif self.type in [self.Type.IN, self.Type.RETURN]:
            if not self.for_warehouse_to:
                raise ValidationError(f"{self.type} movements require a destination warehouse.")
        elif self.type == self.Type.OUT:
            if not self.for_warehouse_from:
                raise ValidationError("OUT movements require a source warehouse.")
        elif self.type == self.Type.ADJUST:
            # ADJUST requires either warehouse_from (for decrease) or warehouse_to (for increase)
            if not self.for_warehouse_from and not self.for_warehouse_to:
                raise ValidationError("ADJUST movements require either source or destination warehouse.")
            if self.for_warehouse_from and self.for_warehouse_to:
                raise ValidationError("ADJUST movements should have either source OR destination warehouse, not both.")
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
