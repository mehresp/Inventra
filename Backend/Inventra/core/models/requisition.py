from django.db import models
from django.conf import settings
from django.utils import timezone
from .item import Item
from .stocklot import StockLot

class Requisition(models.Model):
    class Status(models.TextChoices):
        DRAFT = "Draft", "Draft"
        PENDING = "Pending", "Pending"
        APPROVED = "Approved", "Approved"
        REJECTED = "Rejected", "Rejected"
        FULFILLED = "Fulfilled", "Fulfilled"

    req_no = models.CharField(max_length=64, unique=True)
    for_requester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="requisitions")
    dept_lab = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    needed_by = models.DateField()
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    for_approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name="approved_requisitions", null=True, blank=True
    )
    fulfilled_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"REQ#{self.req_no} · {self.dept_lab}"


class RequisitionLine(models.Model):
    for_requisition = models.ForeignKey(Requisition, on_delete=models.CASCADE, related_name="lines")
    for_item = models.ForeignKey(Item, on_delete=models.PROTECT, related_name="requisition_lines")
    requested_qty = models.DecimalField(max_digits=14, decimal_places=3)
    approved_qty = models.DecimalField(max_digits=14, decimal_places=3, default=0)
    issued_qty = models.DecimalField(max_digits=14, decimal_places=3, default=0)
    for_lot = models.ForeignKey(StockLot, on_delete=models.PROTECT, related_name="requisition_lines", null=True, blank=True)
    notes = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.for_item} · req {self.requested_qty} / appr {self.approved_qty} / iss {self.issued_qty}"
