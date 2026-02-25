from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from .models import SRISubmission, SRIFile
from .serializers import (
    SRISubmissionSerializer,
    SRISubmissionListSerializer,
    SRISubmissionCreateSerializer,
    SRIStatsSerializer,
    SRIFileSerializer
)


class SRISubmissionViewSet(viewsets.ModelViewSet):
    """ViewSet for SRI submissions"""
    
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get submissions based on user role"""
        user = self.request.user
        
        # Admins and mentors can see all submissions
        if user.is_superuser or user.groups.filter(name__in=['Mentor', 'Admin']).exists():
            return SRISubmission.objects.all().select_related('user', 'reviewed_by').prefetch_related('files')
        
        # Students can only see their own submissions
        return SRISubmission.objects.filter(user=user).select_related('reviewed_by').prefetch_related('files')
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return SRISubmissionListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return SRISubmissionCreateSerializer
        return SRISubmissionSerializer
    
    def perform_create(self, serializer):
        """Auto-assign user when creating submission"""
        serializer.save(user=self.request.user)
    
    def perform_update(self, serializer):
        """Handle status transitions"""
        instance = self.get_object()
        
        # If status is being changed to 'submitted', set submitted_at timestamp
        if 'status' in serializer.validated_data:
            new_status = serializer.validated_data['status']
            
            if new_status == 'submitted' and instance.status == 'draft':
                serializer.save(submitted_at=timezone.now())
            else:
                serializer.save()
        else:
            serializer.save()
    
    @action(detail=True, methods=['post'], url_path='submit')
    def submit_submission(self, request, pk=None):
        """Submit a draft for review"""
        submission = self.get_object()
        
        # Can only submit your own draft
        if submission.user != request.user:
            return Response(
                {'error': 'You can only submit your own submissions'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if submission.status != 'draft':
            return Response(
                {'error': 'Only draft submissions can be submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        submission.status = 'submitted'
        submission.submitted_at = timezone.now()
        submission.save()
        
        serializer = self.get_serializer(submission)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='review')
    def review_submission(self, request, pk=None):
        """Review a submission (approve/reject)"""
        user = request.user
        
        # Only mentors and admins can review
        if not (user.is_superuser or user.groups.filter(name__in=['Mentor', 'Admin']).exists()):
            return Response(
                {'error': 'Only mentors can review submissions'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        submission = self.get_object()
        
        # Get review decision from request
        decision = request.data.get('decision')  # 'approve' or 'reject'
        comments = request.data.get('comments', '')
        
        if decision not in ['approve', 'reject']:
            return Response(
                {'error': 'Decision must be "approve" or "reject"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update submission
        submission.status = 'approved' if decision == 'approve' else 'rejected'
        submission.reviewer_comments = comments
        submission.reviewed_by = user
        submission.reviewed_at = timezone.now()
        submission.save()
        
        serializer = self.get_serializer(submission)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='my-submissions')
    def my_submissions(self, request):
        """Get current user's submissions"""
        submissions = SRISubmission.objects.filter(user=request.user).select_related('reviewed_by')
        serializer = self.get_serializer(submissions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='pending-review')
    def pending_review(self, request):
        """Get submissions pending review (mentors only)"""
        user = request.user
        
        # Only mentors and admins can see pending reviews
        if not (user.is_superuser or user.groups.filter(name__in=['Mentor', 'Admin']).exists()):
            return Response(
                {'error': 'Only mentors can view pending reviews'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        submissions = SRISubmission.objects.filter(
            status='submitted'
        ).select_related('user', 'reviewed_by')
        
        serializer = SRISubmissionListSerializer(submissions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """Get user's SRI statistics"""
        user = request.user
        now = timezone.now()
        current_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Get all user submissions
        all_submissions = SRISubmission.objects.filter(user=user)
        
        # Calculate aggregates
        stats_data = all_submissions.aggregate(
            total_hours=Sum('activity_hours'),
            total_people_helped=Sum('people_helped'),
            total_submissions=Count('id'),
            approved=Count('id', filter=Q(status='approved')),
            pending=Count('id', filter=Q(status__in=['submitted', 'under_review'])),
            rejected=Count('id', filter=Q(status='rejected')),
        )
        
        # Handle None values
        stats_data['total_hours'] = stats_data['total_hours'] or 0
        stats_data['total_people_helped'] = stats_data['total_people_helped'] or 0
        
        # Current month stats
        monthly_stats = all_submissions.filter(
            activity_date__gte=current_month
        ).aggregate(
            monthly_hours=Sum('activity_hours'),
            monthly_activities=Count('id', filter=Q(status='approved'))
        )
        
        stats_data['monthly_hours'] = monthly_stats['monthly_hours'] or 0
        stats_data['monthly_activities'] = monthly_stats['monthly_activities'] or 0
        
        serializer = SRIStatsSerializer(stats_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='monthly-quota')
    def monthly_quota(self, request):
        """Get monthly quota status"""
        user = request.user
        now = timezone.now()
        current_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Define monthly quota (can be made configurable)
        MONTHLY_QUOTA = 4
        
        # Count approved activities in current month
        completed_activities = SRISubmission.objects.filter(
            user=user,
            activity_date__gte=current_month,
            status='approved'
        ).count()
        
        return Response({
            'quota': MONTHLY_QUOTA,
            'completed': completed_activities,
            'remaining': max(0, MONTHLY_QUOTA - completed_activities),
            'percentage': min(100, (completed_activities / MONTHLY_QUOTA) * 100) if MONTHLY_QUOTA > 0 else 0
        })


class SRIFileViewSet(viewsets.ModelViewSet):
    """ViewSet for SRI file attachments"""
    
    permission_classes = [IsAuthenticated]
    serializer_class = SRIFileSerializer
    queryset = SRIFile.objects.all()
    
    def get_queryset(self):
        """Only show files for user's own submissions"""
        user = self.request.user
        
        # Admins and mentors can see all files
        if user.is_superuser or user.groups.filter(name__in=['Mentor', 'Admin']).exists():
            return SRIFile.objects.all().select_related('submission')
        
        # Students can only see their own files
        return SRIFile.objects.filter(submission__user=user).select_related('submission')
