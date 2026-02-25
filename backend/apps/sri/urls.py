from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SRISubmissionViewSet, SRIFileViewSet

router = DefaultRouter()
router.register(r'submissions', SRISubmissionViewSet, basename='sri-submission')
router.register(r'files', SRIFileViewSet, basename='sri-file')

urlpatterns = [
    path('', include(router.urls)),
]
