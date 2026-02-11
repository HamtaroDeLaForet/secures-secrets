from django.utils import timezone
from rest_framework import serializers
from .models import Secret
from .services.crypto import encrypt_secret
from datetime import timedelta

class SecretCreateSerializer(serializers.Serializer):
    secret = serializers.CharField(write_only = True)
    password = serializers.CharField(write_only = True)
    expires_in_minutes = serializers.IntegerField(required = False, min_value = 1)
    max_reads = serializers.IntegerField(required = False, min_value = 1)
    
    def validate(self, attrs):
        expires = attrs.get("expires_in_minutes")
        reads = attrs.get("max_reads")
        if expires is None and reads is None:
            raise serializers.ValidationError("Veuillez entrer un mode d'expiration")
        elif expires is not None and reads is not None :
            raise serializers.ValidationError("Un seul mode d'expiration possible")
        return attrs 
    
    def create(self, validated_data):
        secret = validated_data["secret"]
        password = validated_data["password"]
        expires_in_minutes = validated_data.get("expires_in_minutes")
        max_reads = validated_data.get("max_reads")
        if expires_in_minutes is not None : 
            expires_at = timezone.now() + timedelta(minutes=expires_in_minutes)
            remaining_reads = None
        else:
            remaining_reads = max_reads
            expires_at = None
        encrypted_secret = encrypt_secret(secret, password)
        secret_obj = Secret.objects.create(
            ciphertext = encrypted_secret["ciphertext"],
            salt = encrypted_secret["salt"],
            nonce = encrypted_secret["nonce"],
            expires_at = expires_at,
            remaining_reads = remaining_reads
        )
        return secret_obj
        
class SecretRevealSerializer(serializers.Serializer):
    password = serializers.CharField(write_only = True)
    
    def validate_password(self, value):
        password= value.strip()
        if len(password) < 1:
            raise serializers.ValidationError("Mot de passe invalide")
        return password

class AdminSecretSerializer():
    pass