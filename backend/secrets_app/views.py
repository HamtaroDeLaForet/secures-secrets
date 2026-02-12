from django.db import transaction
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser

from .models import Secret
from .serializers import SecretCreateSerializer, SecretRevealSerializer, AdminSecretSerializer
from .services.crypto import decrypt_secret, decrypt_bytes
from .permissions import HasAdminToken

class SecretCreateView(APIView):
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    def post(self, request):
        serializer = SecretCreateSerializer(data = request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()
        return Response(
            {
                "id" : str(obj.id)
            },
            status=status.HTTP_201_CREATED
        )
        
class SecretRevealView(APIView):
    def post(self, request, secret_id):
        serializer = SecretRevealSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        password = serializer.validated_data["password"]
        obj = get_object_or_404(Secret, id=secret_id)
        if obj.is_expired():
            return Response(status=status.HTTP_404_NOT_FOUND)
        with transaction.atomic():
            obj = Secret.objects.select_for_update().get(id=secret_id)
            if obj.is_expired():
                return Response(status=status.HTTP_404_NOT_FOUND)
            try:
                if obj.is_file:
                    plaintext_bytes = decrypt_bytes(
                        obj.ciphertext, obj.salt, obj.nonce, password
                    )
                else:
                    plaintext = decrypt_secret(
                        obj.ciphertext, obj.salt, obj.nonce, password
                    )
            except Exception:
                return Response(status=status.HTTP_403_FORBIDDEN)
            obj.read_count += 1
            if obj.remaining_reads is not None:
                obj.remaining_reads -= 1
            obj.save(update_fields=["read_count", "remaining_reads"])
        if obj.is_file:
            resp = HttpResponse(
                plaintext_bytes,
                content_type=obj.content_type or "application/octet-stream"
            )
            resp["Content-Disposition"] = f'attachment; filename="{obj.filename or "secret"}"'
            return resp

        return Response({"secret": plaintext}, status=status.HTTP_200_OK)

class AdminSecretListView(APIView):
    permission_classes = [HasAdminToken]
    def get(self, request):
        queryset = Secret.objects.all().order_by("-created_at") 
        serializer=AdminSecretSerializer(queryset, many = True)
        return Response(serializer.data, status = status.HTTP_200_OK)
    
class SecretStatsView(APIView):
    authentication_classes = []  # optionnel si tu as des auth globales
    permission_classes = []      # public

    def get(self, request):
        now = timezone.now()

        active_count = (
            Secret.objects
            .filter(
                (Q(expires_at__isnull=True) | Q(expires_at__gt=now)) &
                (Q(remaining_reads__isnull=True) | Q(remaining_reads__gt=0))
            )
            .count()
        )

        res = Response({"active_secrets": active_count}, status=status.HTTP_200_OK)
        res["Cache-Control"] = "no-store"
        return res