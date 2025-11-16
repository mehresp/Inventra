from django.db import models
from django.conf import settings
from .role import Role

class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    for_role = models.ForeignKey(Role, on_delete=models.PROTECT, related_name="users")

    def __str__(self):
        return f"{self.user} · {self.for_role}"
