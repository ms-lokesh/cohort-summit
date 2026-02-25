from django.db import models
from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator, MinValueValidator


class SRISubmission(models.Model):
    """Social Responsibility Initiatives submission model"""
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    ACTIVITY_TYPE_CHOICES = [
        ('environment', 'Environment'),
        ('community', 'Community Service'),
        ('education', 'Education'),
        ('health', 'Health & Welfare'),
        ('elderly', 'Elderly Care'),
        ('children', 'Children Welfare'),
        ('animals', 'Animal Welfare'),
        ('disaster', 'Disaster Relief'),
        ('other', 'Other'),
    ]
    
    # User and basic info
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sri_submissions')
    
    # Activity details
    activity_title = models.CharField(max_length=255, help_text="Activity title")
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPE_CHOICES, default='community')
    activity_date = models.DateField(auto_now_add=True, help_text="Date of activity")
    activity_hours = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=1,
        validators=[MinValueValidator(0.5)],
        help_text="Number of hours spent on activity"
    )
    people_helped = models.PositiveIntegerField(
        null=True, 
        blank=True,
        help_text="Approximate number of people impacted"
    )
    
    # Activity description and reflection
    description = models.TextField(help_text="Brief description of the activity")
    personal_reflection = models.TextField(
        blank=True,
        null=True,
        help_text="Personal reflection on the experience"
    )
    
    # Evidence
    photo_drive_link = models.URLField(
        max_length=500,
        help_text="Google Drive link to activity photos"
    )
    
    # Organization details (optional)
    organization_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Name of organization/NGO (if applicable)"
    )
    certificate_drive_link = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Certificate/proof link (if available)"
    )
    
    # Submission metadata
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Review and feedback
    reviewer_comments = models.TextField(blank=True, null=True)
    reviewed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='sri_reviews'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-activity_date', '-created_at']
        verbose_name = 'SRI Submission'
        verbose_name_plural = 'SRI Submissions'
        indexes = [
            models.Index(fields=['user', '-activity_date']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['activity_type']),
            models.Index(fields=['submitted_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.activity_title}"
    
    def get_month_year(self):
        """Get month and year of activity"""
        return self.activity_date.strftime('%B %Y')


class SRIFile(models.Model):
    """Additional files for SRI submission (photos, certificates)"""
    
    FILE_TYPE_CHOICES = [
        ('photo', 'Activity Photo'),
        ('certificate', 'Certificate'),
        ('proof', 'Proof of Participation'),
        ('other', 'Other'),
    ]
    
    submission = models.ForeignKey(SRISubmission, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(
        upload_to='sri_submissions/%Y/%m/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png'])]
    )
    file_type = models.CharField(max_length=20, choices=FILE_TYPE_CHOICES, default='photo')
    file_name = models.CharField(max_length=255)
    file_size = models.IntegerField(help_text="File size in bytes")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['uploaded_at']
        verbose_name = 'SRI File'
        verbose_name_plural = 'SRI Files'
        indexes = [
            models.Index(fields=['submission', 'uploaded_at']),
        ]
    
    def __str__(self):
        return f"{self.submission.activity_title} - {self.file_name}"
