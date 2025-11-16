from django.db import models

class Role(models.Model):
    class Name(models.TextChoices):
        ADMIN = "Admin", "Admin"
        STOREKEEPER = "Storekeeper", "Storekeeper"
        REQUESTER = "Requester", "Requester"
        AUDITOR = "Auditor", "Auditor"

    name = models.CharField(max_length=32, choices=Name.choices, unique=True)

    def __str__(self):
        return self.name
