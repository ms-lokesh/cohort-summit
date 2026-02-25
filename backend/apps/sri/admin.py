from django.contrib import admin
from .models import SRISubmission, SRIFile


@admin.register(SRISubmission)
class SRISubmissionAdmin(admin.ModelAdmin):
    """Admin interface for SRI submissions"""
    
    list_display = [
        'id', 'user', 'activity_title', 'activity_type', 'activity_date',
        'activity_hours', 'status', 'submitted_at', 'reviewed_by'
    ]
    list_filter = ['status', 'activity_type', 'activity_date', 'submitted_at']
    search_fields = ['user__username', 'activity_title', 'description', 'organization_name']
    readonly_fields = ['created_at', 'updated_at', 'submitted_at', 'reviewed_at']
    date_hierarchy = 'activity_date'
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Activity Details', {
            'fields': (
                'activity_title', 'activity_type', 'activity_date', 'activity_hours',
                'people_helped', 'description', 'personal_reflection'
            )
        }),
        ('Evidence & Documentation', {
            'fields': (
                'photo_drive_link', 'organization_name', 'certificate_drive_link'
            )
        }),
        ('Status & Review', {
            'fields': (
                'status', 'reviewer_comments', 'reviewed_by', 'reviewed_at'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'submitted_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('user', 'reviewed_by')


@admin.register(SRIFile)
class SRIFileAdmin(admin.ModelAdmin):
    """Admin interface for SRI files"""
    
    list_display = ['id', 'submission', 'file_type', 'file_name', 'file_size', 'uploaded_at']
    list_filter = ['file_type', 'uploaded_at']
    search_fields = ['submission__activity_title', 'file_name']
    readonly_fields = ['uploaded_at']
    date_hierarchy = 'uploaded_at'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('submission', 'submission__user')
