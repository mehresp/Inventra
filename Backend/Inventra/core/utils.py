"""
Utility functions for Inventra.
"""
from decimal import Decimal
import json
from rest_framework.renderers import JSONRenderer


class DecimalJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles Decimal serialization."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


class DecimalJSONRenderer(JSONRenderer):
    """
    Custom JSON renderer that handles Decimal serialization.
    """
    encoder_class = DecimalJSONEncoder
    
    def render(self, data, accepted_media_type=None, renderer_context=None):
        if renderer_context is None:
            renderer_context = {}
        
        # Convert Decimal to float recursively before rendering
        data = self._convert_decimal_recursive(data)
        
        return super().render(data, accepted_media_type, renderer_context)
    
    def _convert_decimal_recursive(self, value):
        """Recursively convert Decimal to float."""
        if isinstance(value, Decimal):
            return float(value)
        elif isinstance(value, dict):
            return {k: self._convert_decimal_recursive(v) for k, v in value.items()}
        elif isinstance(value, list):
            return [self._convert_decimal_recursive(item) for item in value]
        elif isinstance(value, tuple):
            return tuple(self._convert_decimal_recursive(item) for item in value)
        return value

