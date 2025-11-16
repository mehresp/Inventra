from django.db import models
from django.utils import timezone
from .supplier import Supplier

class PurchaseOrder(models.Model):
    class Status(models.TextChoices):
        DRAFT = "Draft", "Draft"
        PENDING = "Pending", "Pending"
        APPROVED = "Approved", "Approved"
        RECEIVED = "Received", "Received"
        CLOSED = "Closed", "Closed"

    po_no = models.CharField(max_length=64, unique=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name="purchase_orders")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"PO#{self.po_no} · {self.supplier} · {self.status}"
