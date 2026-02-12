from django.urls import path
from .views import SecretCreateView, SecretRevealView, AdminSecretListView, SecretStatsView

urlpatterns = [
    path("secrets/", SecretCreateView.as_view()),
    path("secrets/<uuid:secret_id>/reveal/",SecretRevealView.as_view(),name="secret-reveal",),
    path("admin/secrets/", AdminSecretListView.as_view()),
    path("stats",SecretStatsView.as_view()),
]