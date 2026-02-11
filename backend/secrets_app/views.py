from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Secret
from .serializers import SecretCreateSerializer, SecretRevealSerializer
from .services.crypto import decrypt_secret

class SecretCreateView(APIView):
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
        serializer = SecretRevealSerializer(data = request.data)
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
                plaintext = decrypt_secret(
                    obj.ciphertext,
                    obj.salt,
                    obj.nonce,
                    password,
                )
            except Exception:
                return Response(status=status.HTTP_403_FORBIDDEN)
            obj.read_count += 1 
            if obj.remaining_reads is not None:
                obj.remaining_reads -= 1
            obj.save(update_fields=["read_count", "remaining_reads"])
        return Response({"secret" : plaintext}, status=status.HTTP_200_OK)