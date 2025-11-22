"""
Authentication views for JWT login/register.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from ..serializers import UserSerializer, UserProfileSerializer
from ..models import Role, UserProfile

User = get_user_model()


class LoginView(APIView):
    """
    Login view that returns JWT tokens.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'error': {'code': 400, 'message': 'Username and password are required', 'details': {}}},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {'error': {'code': 401, 'message': 'Invalid credentials', 'details': {}}},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not user.check_password(password):
            return Response(
                {'error': {'code': 401, 'message': 'Invalid credentials', 'details': {}}},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not user.is_active:
            return Response(
                {'error': {'code': 403, 'message': 'User account is disabled', 'details': {}}},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        # Get user profile
        try:
            profile = user.profile
            role = profile.for_role.name
        except UserProfile.DoesNotExist:
            role = None
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
            'role': role
        }, status=status.HTTP_200_OK)


class RegisterView(APIView):
    """
    Register view for creating new users.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        role_id = request.data.get('role_id')
        
        if not username or not email or not password:
            return Response(
                {'error': {'code': 400, 'message': 'Username, email, and password are required', 'details': {}}},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if User.objects.filter(username=username).exists():
            return Response(
                {'error': {'code': 400, 'message': 'Username already exists', 'details': {}}},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': {'code': 400, 'message': 'Email already exists', 'details': {}}},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate password
        try:
            validate_password(password)
        except DjangoValidationError as e:
            return Response(
                {'error': {'code': 400, 'message': 'Invalid password', 'details': {'errors': list(e.messages)}}},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        # Create profile with default role (Requester) or specified role
        if role_id:
            try:
                role = Role.objects.get(id=role_id)
            except Role.DoesNotExist:
                role = Role.objects.get(name=Role.Name.REQUESTER)
        else:
            role = Role.objects.get(name=Role.Name.REQUESTER)
        
        UserProfile.objects.create(user=user, for_role=role)
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
            'role': role.name
        }, status=status.HTTP_201_CREATED)


class UserProfileView(APIView):
    """
    Get current user profile.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        try:
            profile = user.profile
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': {'code': 404, 'message': 'Profile not found', 'details': {}}},
                status=status.HTTP_404_NOT_FOUND
            )

