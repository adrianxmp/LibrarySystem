from rest_framework import permissions

class IsLibrarian(permissions.BasePermission):
    """
    Custom permission to only allow librarians to access certain views.
    """
    
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'librarian')

class IsMember(permissions.BasePermission):
    """
    Custom permission to only allow members to access certain views.
    """
    
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'member')

class IsLibrarianOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow librarians to edit objects.
    Read permissions are allowed to any authenticated user.
    """
    
    def has_permission(self, request, view):
        # Read permissions are allowed to any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
            
        # Write permissions are only allowed to librarians
        return bool(request.user and request.user.is_authenticated and request.user.role == 'librarian')

class IsOwnerOrLibrarian(permissions.BasePermission):
    """
    Custom permission to allow members to access their own objects or librarians to access all.
    """
    
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
    
    def has_object_permission(self, request, view, obj):
        # Librarians can access all objects
        if request.user.role == 'librarian':
            return True
        
        # Members can only access their own objects
        if request.user.role == 'member' and hasattr(obj, 'member'):
            return obj.member == request.user.member
        
        return False