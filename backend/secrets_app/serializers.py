from django.utils import timezone
from rest_framework import serializers
from .models import Secret
from .crypto import encrypt_secret

class SecretCreateSerializer(serializers.Serializer):
    secret = serializers.CharField()
    password = serializers.CharField(write_only=True)
    expires_in_minutes = serializers.IntegerField(required=False, allow_null=True, min_value=1)
    max_reads = serializers.IntegerField(required=False, allow_null=True, min_value=1)

    def create(self, validated_data):
        expires_at = None
        if validated_data.get("expires_in_minutes"):
            expires_at = timezone.now() + timezone.timedelta(minutes=validated_data["expires_in_minutes"])

        ciphertext, salt = encrypt_secret(validated_data["secret"], validated_data["password"])

        return Secret.objects.create(
            ciphertext=ciphertext,
            salt=salt,
            expires_at=expires_at,
            remaining_reads=validated_data.get("max_reads"),
        )

class SecretRevealSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)
