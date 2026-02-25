from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    LinkedInPostVerification,
    LinkedInConnectionVerification,
    ConnectionScreenshot,
    VerifiedConnection,
    IIPCMonthlySubmission,
)

REQUIRED_HASHTAGS = ['#snsdesignthinking', '#snsdesignthinkers', '#designthinking']
MIN_WORD_COUNT = 300


class LinkedInPostVerificationSerializer(serializers.ModelSerializer):
    """Serializer for LinkedIn Post Verification"""
    user = serializers.StringRelatedField(read_only=True)
    reviewer = serializers.StringRelatedField(source='reviewed_by', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    post_type_display = serializers.CharField(source='get_post_type_display', read_only=True)
    word_count = serializers.SerializerMethodField()

    def get_word_count(self, obj):
        if obj.post_content:
            return len(obj.post_content.split())
        return 0
    
    class Meta:
        model = LinkedInPostVerification
        fields = [
            'id', 'user', 'post_url', 'post_type', 'post_type_display',
            'post_content', 'post_date', 'character_count',
            'hashtag_count', 'word_count', 'status', 'status_display',
            'reviewer_comments', 'reviewer', 'reviewed_at', 'submitted_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'submitted_at', 'reviewer_comments',
            'reviewer', 'reviewed_at', 'created_at', 'updated_at'
        ]


class LinkedInPostVerificationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating LinkedIn Post Verification"""
    
    class Meta:
        model = LinkedInPostVerification
        fields = [
            'post_url', 'post_type', 'post_content', 'post_date',
            'character_count', 'hashtag_count'
        ]

    def validate_post_content(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError(
                'Post content is required. Please paste the full text of your post/article.'
            )
        word_count = len(value.split())
        if word_count < MIN_WORD_COUNT:
            raise serializers.ValidationError(
                f'Content must be at least {MIN_WORD_COUNT} words. '
                f'Your content has {word_count} word{"s" if word_count != 1 else ""}.'
            )
        content_lower = value.lower()
        missing = [tag for tag in REQUIRED_HASHTAGS if tag.lower() not in content_lower]
        if missing:
            raise serializers.ValidationError(
                f'Missing required hashtag(s): {", ".join(missing)}. '
                'Your post/article must include #snsdesignthinking, #snsdesignthinkers, and #designthinking.'
            )
        return value
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        # Auto-compute character_count and hashtag_count from content
        content = validated_data.get('post_content', '')
        validated_data['character_count'] = len(content)
        content_lower = content.lower()
        validated_data['hashtag_count'] = content_lower.count('#')
        return super().create(validated_data)


class ConnectionScreenshotSerializer(serializers.ModelSerializer):
    """Serializer for Connection Screenshots"""
    
    class Meta:
        model = ConnectionScreenshot
        fields = ['id', 'screenshot_url', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class VerifiedConnectionSerializer(serializers.ModelSerializer):
    """Serializer for Verified Connections"""
    
    class Meta:
        model = VerifiedConnection
        fields = ['id', 'name', 'company', 'designation', 'profile_url', 'is_verified']
        read_only_fields = ['id']


class LinkedInConnectionVerificationSerializer(serializers.ModelSerializer):
    """Serializer for LinkedIn Connection Verification"""
    user = serializers.StringRelatedField(read_only=True)
    reviewer = serializers.StringRelatedField(source='reviewed_by', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    screenshots = ConnectionScreenshotSerializer(many=True, read_only=True)
    verified_connections = VerifiedConnectionSerializer(many=True, read_only=True)
    
    class Meta:
        model = LinkedInConnectionVerification
        fields = [
            'id', 'user', 'verification_method', 'profile_url',
            'total_connections', 'verified_connections_count',
            'screenshots', 'verified_connections', 'status', 'status_display',
            'reviewer_comments', 'reviewer', 'reviewed_at', 'submitted_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'submitted_at', 'reviewer_comments',
            'reviewer', 'reviewed_at', 'created_at', 'updated_at',
            'verified_connections_count'
        ]


class LinkedInConnectionVerificationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating LinkedIn Connection Verification"""
    screenshot_urls = serializers.ListField(
        child=serializers.URLField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    verified_connections = VerifiedConnectionSerializer(many=True, required=False)
    
    class Meta:
        model = LinkedInConnectionVerification
        fields = [
            'verification_method', 'profile_url', 'total_connections',
            'screenshot_urls', 'verified_connections'
        ]
    
    def create(self, validated_data):
        screenshot_urls = validated_data.pop('screenshot_urls', [])
        verified_connections_data = validated_data.pop('verified_connections', [])
        validated_data['user'] = self.context['request'].user
        
        # Create the main verification record
        verification = LinkedInConnectionVerification.objects.create(**validated_data)
        
        # Create screenshots
        for url in screenshot_urls:
            ConnectionScreenshot.objects.create(
                verification=verification,
                screenshot_url=url
            )
        
        # Create verified connections
        for conn_data in verified_connections_data:
            VerifiedConnection.objects.create(
                verification=verification,
                **conn_data
            )
        
        # Update verified connections count
        verification.verified_connections_count = len(verified_connections_data)
        verification.save()
        
        return verification
    
    def update(self, instance, validated_data):
        screenshot_urls = validated_data.pop('screenshot_urls', [])
        verified_connections_data = validated_data.pop('verified_connections', [])
        
        # Update main fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update screenshots (replace all)
        if screenshot_urls:
            instance.screenshots.all().delete()
            for url in screenshot_urls:
                ConnectionScreenshot.objects.create(
                    verification=instance,
                    screenshot_url=url
                )
        
        # Update verified connections (replace all)
        if verified_connections_data:
            instance.verified_connections.all().delete()
            for conn_data in verified_connections_data:
                VerifiedConnection.objects.create(
                    verification=instance,
                    **conn_data
                )
            instance.verified_connections_count = len(verified_connections_data)
            instance.save()
        
        return instance


class IIPCStatsSerializer(serializers.Serializer):
    """Serializer for IIPC statistics"""
    total_posts = serializers.IntegerField()
    total_connections = serializers.IntegerField()
    approved_posts = serializers.IntegerField()
    approved_connections = serializers.IntegerField()
    pending_posts = serializers.IntegerField()
    pending_connections = serializers.IntegerField()


class IIPCMonthlySubmissionSerializer(serializers.ModelSerializer):
    """Full serializer for IIPCMonthlySubmission"""
    user = serializers.StringRelatedField(read_only=True)
    reviewer = serializers.StringRelatedField(source='reviewed_by', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    posts_count = serializers.IntegerField(read_only=True)
    connections_count = serializers.IntegerField(read_only=True)
    month_name = serializers.SerializerMethodField()

    def get_month_name(self, obj):
        import calendar
        return calendar.month_name[obj.month]

    class Meta:
        model = IIPCMonthlySubmission
        fields = [
            'id', 'user', 'month', 'year', 'month_name',
            'post_1_url', 'post_1_type',
            'post_2_url', 'post_2_type',
            'post_3_url', 'post_3_type',
            'post_4_url', 'post_4_type',
            'connection_1_url', 'connection_2_url',
            'connection_3_url', 'connection_4_url',
            'posts_count', 'connections_count',
            'status', 'status_display',
            'reviewer_comments', 'reviewer', 'reviewed_at',
            'submitted_at', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'user', 'month', 'year',
            'submitted_at', 'reviewer_comments', 'reviewer',
            'reviewed_at', 'created_at', 'updated_at',
        ]


class IIPCMonthlySubmissionUpdateSerializer(serializers.ModelSerializer):
    """Serializer for saving draft data"""
    class Meta:
        model = IIPCMonthlySubmission
        fields = [
            'post_1_url', 'post_1_type',
            'post_2_url', 'post_2_type',
            'post_3_url', 'post_3_type',
            'post_4_url', 'post_4_type',
            'connection_1_url', 'connection_2_url',
            'connection_3_url', 'connection_4_url',
        ]
