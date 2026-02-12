from django.utils import timezone
from rest_framework import serializers
from .models import Secret
from .services.crypto import encrypt_secret, encrypt_bytes
from datetime import timedelta

class SecretCreateSerializer(serializers.Serializer):
    secret = serializers.CharField(write_only=True, required=False, allow_blank=False)
    file = serializers.FileField(write_only=True, required=False)

    password = serializers.CharField(write_only=True)
    expires_in_minutes = serializers.IntegerField(required=False, min_value=1)
    max_reads = serializers.IntegerField(required=False, min_value=1)

    def validate(self, attrs):
        expires = attrs.get("expires_in_minutes")
        reads = attrs.get("max_reads")
        if expires is None and reads is None:
            raise serializers.ValidationError("Veuillez entrer un mode d'expiration")
        if expires is not None and reads is not None:
            raise serializers.ValidationError("Un seul mode d'expiration possible")

        has_text = bool(attrs.get("secret"))
        has_file = bool(attrs.get("file"))
        if has_text == has_file:
            raise serializers.ValidationError("Vous devez fournir soit un secret, soit un fichier (un seul).")
        return attrs

    def create(self, validated_data):
        password = validated_data["password"]
        expires_in_minutes = validated_data.get("expires_in_minutes")
        max_reads = validated_data.get("max_reads")
        if expires_in_minutes is not None:
            expires_at = timezone.now() + timedelta(minutes=int(expires_in_minutes))
            remaining_reads = None
        else:
            expires_at = None
            remaining_reads = int(max_reads)
        uploaded = validated_data.get("file")
        secret_text = validated_data.get("secret")
        try:
            if uploaded is not None:
                data = uploaded.read()
                if not isinstance(data, (bytes, bytearray)):
                    raise serializers.ValidationError("Fichier invalide.")
                encrypted = encrypt_bytes(bytes(data), password)
                return Secret.objects.create(
                    ciphertext=encrypted["ciphertext"],
                    salt=encrypted["salt"],
                    nonce=encrypted["nonce"],
                    expires_at=expires_at,
                    remaining_reads=remaining_reads,
                    is_file=True,
                    filename=getattr(uploaded, "name", None),
                    content_type=getattr(uploaded, "content_type", None),
                )
            if not secret_text or not isinstance(secret_text, str) or not secret_text.strip():
                raise serializers.ValidationError("Secret texte manquant.")
            encrypted = encrypt_secret(secret_text, password)
            return Secret.objects.create(
                ciphertext=encrypted["ciphertext"],
                salt=encrypted["salt"],
                nonce=encrypted["nonce"],
                expires_at=expires_at,
                remaining_reads=remaining_reads,
                is_file=False,
                filename=None,
                content_type=None,
            )

        except serializers.ValidationError:
            raise
        except Exception as e:
            raise serializers.ValidationError(str(e))
    
class SecretRevealSerializer(serializers.Serializer):
    password = serializers.CharField(write_only = True)
    
    def validate_password(self, value):
        password= value.strip()
        if len(password) < 1:
            raise serializers.ValidationError("Mot de passe invalide")
        return password

class AdminSecretSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    class Meta:
        model = Secret
        fields = ["id","created_at","expires_at","remaining_reads","read_count","status"]
    def get_status(self,obj):
        if obj.is_expired():
            return "expired"
        return "active"