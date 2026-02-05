"""
Custom exception handlers for DRF API.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


def _convert_decimal_recursive(value):
    """Recursively convert Decimal to float for JSON serialization."""
    if isinstance(value, Decimal):
        return float(value)
    elif isinstance(value, dict):
        return {k: _convert_decimal_recursive(v) for k, v in value.items()}
    elif isinstance(value, list):
        return [_convert_decimal_recursive(item) for item in value]
    elif isinstance(value, tuple):
        return tuple(_convert_decimal_recursive(item) for item in value)
    return value


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns consistent error responses.
    """
    response = exception_handler(exc, context)
    
    if response is not None:
        # Convert any Decimal values in response.data
        converted_data = _convert_decimal_recursive(response.data)
        
        custom_response_data = {
            'error': {
                'code': response.status_code,
                'message': str(exc),
                'details': converted_data if isinstance(converted_data, dict) else {'detail': converted_data}
            }
        }
        
        # Convert Decimal values in custom_response_data as well
        custom_response_data = _convert_decimal_recursive(custom_response_data)
        
        # Log the error
        logger.error(f"API Error: {exc}", exc_info=True)
        
        response.data = custom_response_data
    else:
        # Handle unexpected errors
        logger.exception(f"Unhandled exception: {exc}")
        custom_response_data = {
            'error': {
                'code': status.HTTP_500_INTERNAL_SERVER_ERROR,
                'message': 'An unexpected error occurred',
                'details': {}
            }
        }
        response = Response(custom_response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return response

