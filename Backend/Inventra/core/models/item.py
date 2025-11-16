from django.db import models
from django.utils import timezone
from .category import Category

class Item(models.Model):
    code = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=128)
    unit = models.CharField(max_length=32)
    min_stock = models.IntegerField(default=0)
    for_category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="items")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.code} · {self.name}"
