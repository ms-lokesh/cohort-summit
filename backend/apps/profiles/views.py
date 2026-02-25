import os
import uuid
import requests as http_requests
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from .models import UserProfile
from .serializers import UserProfileSerializer, UserProfileUpdateSerializer


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Get and update current user's profile"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return UserProfileSerializer
        return UserProfileUpdateSerializer
    
    def get_object(self):
        """Get or create profile for current user"""
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile
    
    def retrieve(self, request, *args, **kwargs):
        """Get user profile"""
        profile = self.get_object()
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        """Update user profile"""
        partial = kwargs.pop('partial', False)
        profile = self.get_object()
        serializer = self.get_serializer(profile, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Return full profile data
        response_serializer = UserProfileSerializer(profile)
        return Response(response_serializer.data)
    
    def partial_update(self, request, *args, **kwargs):
        """Partial update user profile"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


class AvatarUploadView(APIView):
    """Upload a profile picture to Supabase Storage and save the URL"""
    permission_classes = [IsAuthenticated]

    ALLOWED_TYPES = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}
    MAX_SIZE_BYTES = 2 * 1024 * 1024  # 2 MB

    def post(self, request):
        file = request.FILES.get('avatar')
        if not file:
            return Response({'error': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        if file.content_type not in self.ALLOWED_TYPES:
            return Response(
                {'error': 'Invalid file type. Allowed: JPEG, PNG, WEBP, GIF.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if file.size > self.MAX_SIZE_BYTES:
            return Response(
                {'error': 'File too large. Maximum size is 2 MB.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Build unique storage path: avatars/<user_id>_<uuid>.<ext>
        ext = file.name.rsplit('.', 1)[-1].lower() if '.' in file.name else 'jpg'
        filename = f"{request.user.id}_{uuid.uuid4().hex}.{ext}"

        supabase_url = getattr(settings, 'SUPABASE_URL', os.getenv('SUPABASE_URL', ''))
        service_key = getattr(settings, 'SUPABASE_SERVICE_ROLE_KEY', os.getenv('SUPABASE_SERVICE_ROLE_KEY', ''))
        bucket = getattr(settings, 'SUPABASE_STORAGE_BUCKET', os.getenv('SUPABASE_STORAGE_BUCKET', 'avatars'))

        if not supabase_url or not service_key:
            return Response(
                {'error': 'Storage service not configured. Contact an administrator.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        upload_url = f"{supabase_url}/storage/v1/object/{bucket}/{filename}"
        headers = {
            'Authorization': f'Bearer {service_key}',
            'Content-Type': file.content_type,
            'x-upsert': 'true',
        }

        file_bytes = file.read()
        resp = http_requests.post(upload_url, data=file_bytes, headers=headers)

        if resp.status_code not in (200, 201):
            return Response(
                {'error': f'Upload failed: {resp.text}'},
                status=status.HTTP_502_BAD_GATEWAY
            )

        public_url = f"{supabase_url}/storage/v1/object/public/{bucket}/{filename}"

        # Save URL to profile
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        profile.avatar_url = public_url
        profile.save(update_fields=['avatar_url'])

        return Response({'avatar_url': public_url}, status=status.HTTP_200_OK)
