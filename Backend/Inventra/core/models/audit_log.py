import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

class AuditLog(models.Model):
    for_actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="audit_logs")
    entity = models.CharField(max_length=64)
    entity_id = models.UUIDField(default=uuid.uuid4)
    action = models.CharField(max_length=32)
    before = models.JSONField(null=True, blank=True)
    after = models.JSONField(null=True, blank=True)
    ip = models.CharField(max_length=64)
    user_agent = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"[{self.created_at:%Y-%m-%d %H:%M}] {self.action} {self.entity}:{self.entity_id}"
