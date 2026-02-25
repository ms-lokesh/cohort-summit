from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import SRISubmission, SRIFile


User = get_user_model()


class SRIFileSerializer(serializers.ModelSerializer):
    """Serializer for SRI file attachments"""
    
    class Meta:
        model = SRIFile
        fields = ['id', 'file', 'file_type', 'file_name', 'file_size', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class SRISubmissionSerializer(serializers.ModelSerializer):
    """Serializer for SRI submissions"""
    
    files = SRIFileSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_full_name = serializers.SerializerMethodField()
    month_year = serializers.CharField(source='get_month_year', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = SRISubmission
        fields = [
            'id', 'user', 'user_name', 'user_full_name',
            'activity_title', 'activity_type', 'activity_date', 'activity_hours',
            'people_helped', 'description', 'personal_reflection',
            'photo_drive_link', 'organization_name', 'certificate_drive_link',
            'status', 'reviewer_comments', 'reviewed_by', 'reviewed_by_name', 'reviewed_at',
            'created_at', 'updated_at', 'submitted_at', 'month_year', 'files'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'reviewed_by', 'reviewed_at']
    
    def get_user_full_name(self, obj):
        """Get user's full name"""
        if obj.user.first_name and obj.user.last_name:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return obj.user.username
    
    def create(self, validated_data):
        # Set user from request context
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class SRISubmissionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing SRI submissions"""
    
    user_name = serializers.CharField(source='user.username', read_only=True)
    month_year = serializers.CharField(source='get_month_year', read_only=True)
    
    class Meta:
        model = SRISubmission
        fields = [
            'id', 'user', 'user_name', 'activity_title', 'activity_type',
            'activity_date', 'activity_hours', 'status', 'month_year',
            'created_at', 'submitted_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'submitted_at']


class SRISubmissionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating SRI submissions"""
    
    class Meta:
        model = SRISubmission
        fields = [
            'activity_title', 'activity_type', 'activity_date', 'activity_hours',
            'people_helped', 'description', 'personal_reflection',
            'photo_drive_link', 'organization_name', 'certificate_drive_link',
            'status'
        ]
    
    def validate_activity_hours(self, value):
        """Validate activity hours"""
        if value < 0.5:
            raise serializers.ValidationError("Activity must be at least 0.5 hours")
        if value > 24:
            raise serializers.ValidationError("Activity hours cannot exceed 24 hours in a day")
        return value


class SRIStatsSerializer(serializers.Serializer):
    """Serializer for SRI statistics"""
    
    total_submissions = serializers.IntegerField()
    approved = serializers.IntegerField()
    pending = serializers.IntegerField()
    rejected = serializers.IntegerField()
    total_hours = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_people_helped = serializers.IntegerField()
    monthly_activities = serializers.IntegerField()
    monthly_hours = serializers.DecimalField(max_digits=10, decimal_places=2)
