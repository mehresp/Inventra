"""
RBAC permission classes for Inventra API.
"""
from rest_framework import permissions
from .models import UserProfile, Role


class IsAdmin(permissions.BasePermission):
    """
    Permission class to check if user has Admin role.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            profile = request.user.profile
            return profile.for_role.name == Role.Name.ADMIN
        except UserProfile.DoesNotExist:
            return False


class IsStorekeeper(permissions.BasePermission):
    """
    Permission class to check if user has Storekeeper role.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            profile = request.user.profile
            return profile.for_role.name in [Role.Name.ADMIN, Role.Name.STOREKEEPER]
        except UserProfile.DoesNotExist:
            return False


class IsRequester(permissions.BasePermission):
    """
    Permission class to check if user has Requester role.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            profile = request.user.profile
            return profile.for_role.name in [
                Role.Name.ADMIN,
                Role.Name.STOREKEEPER,
                Role.Name.REQUESTER
            ]
        except UserProfile.DoesNotExist:
            return False


class IsAuditor(permissions.BasePermission):
    """
    Permission class to check if user has Auditor role.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            profile = request.user.profile
            return profile.for_role.name in [Role.Name.ADMIN, Role.Name.AUDITOR]
        except UserProfile.DoesNotExist:
            return False


class IsAdminOrStorekeeper(permissions.BasePermission):
    """
    Permission class to check if user has Admin or Storekeeper role.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            profile = request.user.profile
            return profile.for_role.name in [Role.Name.ADMIN, Role.Name.STOREKEEPER]
        except UserProfile.DoesNotExist:
            return False


class CanViewItems(permissions.BasePermission):
    """
    Permission class to check if user can view items.
    All authenticated users can view items.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class CanManageItems(permissions.BasePermission):
    """
    Permission class to check if user can create/edit/delete items.
    Only Admin can manage items.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            profile = request.user.profile
            return profile.for_role.name == Role.Name.ADMIN
        except UserProfile.DoesNotExist:
            return False


class CanManageMovements(permissions.BasePermission):
    """
    Permission class to check if user can create movements.
    Admin and Storekeeper can create movements.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            profile = request.user.profile
            return profile.for_role.name in [Role.Name.ADMIN, Role.Name.STOREKEEPER]
        except UserProfile.DoesNotExist:
            return False


class CanViewMovements(permissions.BasePermission):
    """
    Permission class to check if user can view movements.
    Admin, Storekeeper, and Auditor can view movements.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            profile = request.user.profile
            return profile.for_role.name in [
                Role.Name.ADMIN,
                Role.Name.STOREKEEPER,
                Role.Name.AUDITOR
            ]
        except UserProfile.DoesNotExist:
            return False


class CanManageRequisitions(permissions.BasePermission):
    """
    Permission class to check if user can create/view own requisitions.
    Admin, Storekeeper, and Requester can manage requisitions.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            profile = request.user.profile
            return profile.for_role.name in [
                Role.Name.ADMIN,
                Role.Name.STOREKEEPER,
                Role.Name.REQUESTER
            ]
        except UserProfile.DoesNotExist:
            return False

    def has_object_permission(self, request, view, obj):
        # Users can only modify their own requisitions unless they are Admin or Storekeeper
        if request.method in permissions.SAFE_METHODS:
            return True
        
        try:
            profile = request.user.profile
            if profile.for_role.name == Role.Name.ADMIN:
                return True
            if profile.for_role.name == Role.Name.STOREKEEPER:
                return True
            return obj.for_requester == request.user
        except UserProfile.DoesNotExist:
            return False


class CanApproveRequisitions(permissions.BasePermission):
    """
    Permission class to check if user can approve/reject requisitions.
    Admin and Storekeeper can approve requisitions.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            profile = request.user.profile
            return profile.for_role.name in [Role.Name.ADMIN, Role.Name.STOREKEEPER]
        except UserProfile.DoesNotExist:
            return False


class CanManageInventoryCount(permissions.BasePermission):
    """
    Permission class to check if user can start/close inventory counts.
    Admin and Storekeeper can manage inventory counts.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            profile = request.user.profile
            return profile.for_role.name in [Role.Name.ADMIN, Role.Name.STOREKEEPER]
        except UserProfile.DoesNotExist:
            return False


class CanViewAuditLog(permissions.BasePermission):
    """
    Permission class to check if user can view audit logs.
    Admin and Auditor can view audit logs.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            profile = request.user.profile
            return profile.for_role.name in [Role.Name.ADMIN, Role.Name.AUDITOR]
        except UserProfile.DoesNotExist:
            return False


class CanManageUsers(permissions.BasePermission):
    """
    Permission class to check if user can manage users/roles.
    Only Admin can manage users.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            profile = request.user.profile
            return profile.for_role.name == Role.Name.ADMIN
        except UserProfile.DoesNotExist:
            return False

