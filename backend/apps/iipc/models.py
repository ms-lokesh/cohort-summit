from django.db import models
from django.contrib.auth.models import User
from django.core.validators import URLValidator, MinValueValidator, MaxValueValidator


class LinkedInPostVerification(models.Model):
    """LinkedIn Post Verification Submission"""
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    POST_TYPE_CHOICES = [
        ('post', 'Post'),
        ('article', 'Article'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='linkedin_posts')
    post_url = models.URLField(max_length=500, validators=[URLValidator()], 
                               help_text="LinkedIn post/article URL")
    post_type = models.CharField(
        max_length=10, choices=POST_TYPE_CHOICES, default='post',
        help_text="Type of LinkedIn content (post or article)"
    )
    
    # Content pasted by student for verification
    post_content = models.TextField(
        blank=True, null=True,
        help_text="Full text of the post/article pasted by the student for word count and hashtag verification"
    )

    # Post metrics (extracted or manually entered)
    post_date = models.DateField(help_text="Date when post was published")
    character_count = models.IntegerField(validators=[MinValueValidator(0)],
                                         help_text="Number of characters in post")
    hashtag_count = models.IntegerField(validators=[MinValueValidator(0)],
                                       help_text="Number of hashtags used")
    
    # Review fields
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    reviewer_comments = models.TextField(blank=True, null=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='reviewed_linkedin_posts')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'LinkedIn Post Verification'
        verbose_name_plural = 'LinkedIn Post Verifications'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['post_date']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - Post on {self.post_date}"


class LinkedInConnectionVerification(models.Model):
    """LinkedIn Connections Verification Submission"""
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    VERIFICATION_METHOD_CHOICES = [
        ('screenshot', 'Screenshot Upload'),
        ('profile', 'Profile Link'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='linkedin_connections')
    verification_method = models.CharField(max_length=20, choices=VERIFICATION_METHOD_CHOICES,
                                          default='screenshot')
    
    # Profile link method
    profile_url = models.URLField(max_length=500, blank=True, null=True,
                                 validators=[URLValidator()],
                                 help_text="LinkedIn profile URL")
    
    # Connection metrics
    total_connections = models.IntegerField(validators=[MinValueValidator(0)],
                                           help_text="Total number of connections")
    verified_connections_count = models.IntegerField(default=0, 
                                                    validators=[MinValueValidator(0)],
                                                    help_text="Number of verified connections")
    
    # Review fields
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    reviewer_comments = models.TextField(blank=True, null=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='reviewed_linkedin_connections')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'LinkedIn Connection Verification'
        verbose_name_plural = 'LinkedIn Connection Verifications'
        indexes = [
            models.Index(fields=['user', 'status']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.total_connections} connections"


class ConnectionScreenshot(models.Model):
    """Screenshots uploaded for LinkedIn connection verification"""
    
    verification = models.ForeignKey(LinkedInConnectionVerification, 
                                    on_delete=models.CASCADE, 
                                    related_name='screenshots')
    screenshot_url = models.URLField(max_length=500, help_text="Google Drive link to screenshot")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['uploaded_at']
        verbose_name = 'Connection Screenshot'
        verbose_name_plural = 'Connection Screenshots'
    
    def __str__(self):
        return f"Screenshot for {self.verification.user.username}"


class VerifiedConnection(models.Model):
    """Individual verified LinkedIn connections"""
    
    verification = models.ForeignKey(LinkedInConnectionVerification,
                                    on_delete=models.CASCADE,
                                    related_name='verified_connections')
    name = models.CharField(max_length=200, help_text="Connection's name")
    company = models.CharField(max_length=200, blank=True, help_text="Current company")
    designation = models.CharField(max_length=200, blank=True, help_text="Job title")
    profile_url = models.URLField(max_length=500, blank=True, 
                                  help_text="LinkedIn profile URL")
    is_verified = models.BooleanField(default=False, 
                                     help_text="Whether connection is verified")
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Verified Connection'
        verbose_name_plural = 'Verified Connections'
    
    def __str__(self):
        return f"{self.name} - {self.company}"


class IIPCMonthlySubmission(models.Model):
    """One monthly IIPC submission per student — 4 post/article links + 4 connection links."""

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    POST_TYPE_CHOICES = [
        ('post', 'Post'),
        ('article', 'Article'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE,
                             related_name='iipc_monthly_submissions')
    month = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(12)],
        help_text="Month (1-12)"
    )
    year = models.IntegerField(
        validators=[MinValueValidator(2024)],
        help_text="Year (e.g. 2026)"
    )

    # 4 Posts / Articles
    post_1_url  = models.URLField(max_length=500, blank=True, null=True)
    post_1_type = models.CharField(max_length=10, choices=POST_TYPE_CHOICES, default='post')
    post_2_url  = models.URLField(max_length=500, blank=True, null=True)
    post_2_type = models.CharField(max_length=10, choices=POST_TYPE_CHOICES, default='post')
    post_3_url  = models.URLField(max_length=500, blank=True, null=True)
    post_3_type = models.CharField(max_length=10, choices=POST_TYPE_CHOICES, default='post')
    post_4_url  = models.URLField(max_length=500, blank=True, null=True)
    post_4_type = models.CharField(max_length=10, choices=POST_TYPE_CHOICES, default='post')

    # 4 LinkedIn Connection profile URLs
    connection_1_url = models.URLField(max_length=500, blank=True, null=True)
    connection_2_url = models.URLField(max_length=500, blank=True, null=True)
    connection_3_url = models.URLField(max_length=500, blank=True, null=True)
    connection_4_url = models.URLField(max_length=500, blank=True, null=True)

    # Review
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    reviewer_comments = models.TextField(blank=True, null=True)
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='reviewed_iipc_submissions'
    )
    reviewed_at  = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [('user', 'month', 'year')]
        ordering = ['-year', '-month']
        verbose_name = 'IIPC Monthly Submission'
        verbose_name_plural = 'IIPC Monthly Submissions'

    def __str__(self):
        import calendar
        return f"{self.user.username} — {calendar.month_name[self.month]} {self.year}"

    @property
    def posts_count(self):
        return sum(1 for u in [self.post_1_url, self.post_2_url,
                               self.post_3_url, self.post_4_url] if u)

    @property
    def connections_count(self):
        return sum(1 for u in [self.connection_1_url, self.connection_2_url,
                               self.connection_3_url, self.connection_4_url] if u)
