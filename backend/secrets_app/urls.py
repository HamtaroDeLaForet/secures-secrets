from django.urls import path
from .views import SecretCreateView, SecretRevealView

urlpatterns = [
    path("secrets/", SecretCreateView.as_view()),
    path("secrets/<uuid:secret_id>/reveal/",SecretRevealView.as_view(),name="secret-reveal",),
]