import uuid
from django.db import models
from django.utils import timezone

class Secret(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ciphertext = models.TextField()
    salt = models.TextField()
    nonce = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    remaining_reads = models.IntegerField(null=True, blank=True)
    read_count = models.IntegerField(default=0)

    def is_expired(self):
        if self.expires_at and timezone.now() >= self.expires_at:
            return True
        if self.remaining_reads is not None and self.remaining_reads <= 0:
            return True
        return False
