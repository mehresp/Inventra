"""
URL configuration for Inventra project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from core.views import (
    LoginView, RegisterView, UserProfileView,
    CategoryViewSet, ItemViewSet, WarehouseViewSet, StockLotViewSet,
    MovementViewSet, RequisitionViewSet, InventoryCountViewSet,
    SupplierViewSet, PurchaseOrderViewSet, AuditLogViewSet, ReportsViewSet
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'items', ItemViewSet, basename='item')
router.register(r'warehouses', WarehouseViewSet, basename='warehouse')
router.register(r'stocklots', StockLotViewSet, basename='stocklot')
router.register(r'movements', MovementViewSet, basename='movement')
router.register(r'requisitions', RequisitionViewSet, basename='requisition')
router.register(r'inventory-counts', InventoryCountViewSet, basename='inventory-count')
router.register(r'suppliers', SupplierViewSet, basename='supplier')
router.register(r'purchase-orders', PurchaseOrderViewSet, basename='purchase-order')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'reports', ReportsViewSet, basename='report')

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API v1
    path('api/v1/', include(router.urls)),
    
    # Authentication
    path('api/v1/auth/login/', LoginView.as_view(), name='login'),
    path('api/v1/auth/register/', RegisterView.as_view(), name='register'),
    path('api/v1/auth/profile/', UserProfileView.as_view(), name='profile'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
