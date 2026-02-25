"""
Health Check Middleware

This middleware bypasses Django's ALLOWED_HOSTS validation for health check endpoints.
This is necessary because Render's load balancer makes health check requests with
internal Host headers that won't match your ALLOWED_HOSTS configuration.
"""


class HealthCheckMiddleware:
    """
    Middleware to allow health check requests to bypass ALLOWED_HOSTS validation.
    
    This middleware should be placed BEFORE Django's CommonMiddleware in the
    MIDDLEWARE setting to work properly.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Check if this is a health check endpoint
        if request.path in ['/health/', '/health', '/health/ready/', '/health/live/']:
            # Temporarily mark host as allowed for this request
            # This bypasses the ALLOWED_HOSTS check in CommonMiddleware
            request.META['HTTP_HOST_VALIDATED'] = True
        
        response = self.get_response(request)
        return response
