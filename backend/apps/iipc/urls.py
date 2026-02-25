from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LinkedInPostVerificationViewSet,
    LinkedInConnectionVerificationViewSet,
    IIPCMonthlySubmissionViewSet,
)

router = DefaultRouter()
router.register(r'posts', LinkedInPostVerificationViewSet, basename='linkedin-post')
router.register(r'connections', LinkedInConnectionVerificationViewSet, basename='linkedin-connection')
router.register(r'monthly', IIPCMonthlySubmissionViewSet, basename='iipc-monthly')

urlpatterns = [
    path('', include(router.urls)),
]
