from django.db import models
from django.utils import timezone

class Warehouse(models.Model):
    name = models.CharField(max_length=128)
    location = models.CharField(max_length=256)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        indexes = [models.Index(fields=["name"]), models.Index(fields=["is_active"])]
        unique_together = [("name", "location")]

    def __str__(self):
        return f"{self.name} ({self.location})"
