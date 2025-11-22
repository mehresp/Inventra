"""
Custom middleware for Inventra.
"""
from core.signals import set_current_request, get_current_request


class AuditLogMiddleware:
    """
    Middleware to capture request context for audit logging.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Store request in thread-local for signals
        set_current_request(request)
        
        try:
            response = self.get_response(request)
            return response
        finally:
            # Clean up
            set_current_request(None)

