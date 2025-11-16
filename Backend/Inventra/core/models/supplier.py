from django.db import models

class Supplier(models.Model):
    name = models.CharField(max_length=128)
    contact = models.CharField(max_length=256)

    def __str__(self):
        return self.name
