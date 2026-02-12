from rest_framework.permissions import BasePermission
from django.conf import settings


class HasAdminToken(BasePermission):
    def has_permission(self, request, view):
        token = request.headers.get("X-ADMIN-TOKEN")
        if not token:
            return False
        return token == settings.ADMIN_TOKEN
