/**
 * API endpoints definitions
 */
import apiClient from './client';
import type {
  AuthResponse,
  UserProfile,
  Item,
  Category,
  Warehouse,
  StockLot,
  Movement,
  Requisition,
  RequisitionLine,
  InventoryCount,
  AuditLog,
  Supplier,
  PurchaseOrder,
  PaginatedResponse,
} from '../types';

// Check if we should use mock data
// Only use mock data if explicitly set to 'true' via environment variable
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

// Import mock APIs
import {
  mockAuthApi,
  mockItemsApi,
  mockCategoriesApi,
  mockWarehousesApi,
  mockStockLotsApi,
  mockMovementsApi,
  mockRequisitionsApi,
  mockInventoryCountsApi,
  mockAuditLogsApi,
  mockReportsApi,
  mockSuppliersApi,
  mockPurchaseOrdersApi,
} from '../mock/api';

// Auth endpoints
export const authApi = USE_MOCK_DATA
  ? mockAuthApi
  : {
      login: (username: string, password: string) =>
        apiClient.post<AuthResponse>('/auth/login/', { username, password }),

      register: (data: {
        username: string;
        email: string;
        password: string;
        first_name?: string;
        last_name?: string;
        role_id?: number;
      }) => apiClient.post<AuthResponse>('/auth/register/', data),

      getProfile: () => apiClient.get<UserProfile>('/auth/profile/'),

      refreshToken: (refresh: string) =>
        apiClient.post<{ access: string }>('/auth/token/refresh/', { refresh }),
    };

// Items endpoints
export const itemsApi = USE_MOCK_DATA
  ? mockItemsApi
  : {
      list: (params?: {
        search?: string;
        category?: number;
        below_min?: boolean;
        warehouse?: number;
        page?: number;
      }) => apiClient.get<PaginatedResponse<Item>>('/items/', { params }),

      get: (id: number) => apiClient.get<Item>(`/items/${id}/`),

      create: (data: Partial<Item>) => apiClient.post<Item>('/items/', data),

      update: (id: number, data: Partial<Item>) =>
        apiClient.patch<Item>(`/items/${id}/`, data),

      delete: (id: number) => apiClient.delete(`/items/${id}/`),

      getStock: (id: number, warehouseId?: number) =>
        apiClient.get(`/items/${id}/stock/`, {
          params: { warehouse: warehouseId },
        }),
    };

// Categories endpoints
export const categoriesApi = USE_MOCK_DATA
  ? mockCategoriesApi
  : {
      list: (params?: { search?: string; page?: number }) =>
        apiClient.get<PaginatedResponse<Category>>('/categories/', { params }),

      get: (id: number) => apiClient.get<Category>(`/categories/${id}/`),

      create: (data: Partial<Category>) =>
        apiClient.post<Category>('/categories/', data),

      update: (id: number, data: Partial<Category>) =>
        apiClient.patch<Category>(`/categories/${id}/`, data),

      delete: (id: number) => apiClient.delete(`/categories/${id}/`),
    };

// Warehouses endpoints
export const warehousesApi = USE_MOCK_DATA
  ? mockWarehousesApi
  : {
      list: (params?: { search?: string; is_active?: boolean; page?: number }) =>
        apiClient.get<PaginatedResponse<Warehouse>>('/warehouses/', { params }),

      get: (id: number) => apiClient.get<Warehouse>(`/warehouses/${id}/`),

      create: (data: Partial<Warehouse>) =>
        apiClient.post<Warehouse>('/warehouses/', data),

      update: (id: number, data: Partial<Warehouse>) =>
        apiClient.patch<Warehouse>(`/warehouses/${id}/`, data),

      delete: (id: number) => apiClient.delete(`/warehouses/${id}/`),
    };

// Stock Lots endpoints
export const stockLotsApi = USE_MOCK_DATA
  ? mockStockLotsApi
  : {
      list: (params?: {
        for_item?: number;
        for_warehouse?: number;
        search?: string;
        page?: number;
      }) => apiClient.get<PaginatedResponse<StockLot>>('/stocklots/', { params }),

      get: (id: number) => apiClient.get<StockLot>(`/stocklots/${id}/`),

      create: (data: Partial<StockLot>) =>
        apiClient.post<StockLot>('/stocklots/', data),

      update: (id: number, data: Partial<StockLot>) =>
        apiClient.patch<StockLot>(`/stocklots/${id}/`, data),

      delete: (id: number) => apiClient.delete(`/stocklots/${id}/`),
    };

// Movements endpoints
export const movementsApi = USE_MOCK_DATA
  ? mockMovementsApi
  : {
      list: (params?: {
        type?: string;
        item?: number;
        warehouse_from?: number;
        warehouse_to?: number;
        search?: string;
        page?: number;
      }) => apiClient.get<PaginatedResponse<Movement>>('/movements/', { params }),

      get: (id: number) => apiClient.get<Movement>(`/movements/${id}/`),

      create: (data: Partial<Movement> & { override?: boolean }) =>
        apiClient.post<Movement>('/movements/', data),
    };

// Requisitions endpoints
export const requisitionsApi = USE_MOCK_DATA
  ? mockRequisitionsApi
  : {
      list: (params?: {
        status?: string;
        requester?: number;
        dept_lab?: string;
        search?: string;
        page?: number;
      }) =>
        apiClient.get<PaginatedResponse<Requisition>>('/requisitions/', { params }),

      get: (id: number) => apiClient.get<Requisition>(`/requisitions/${id}/`),

      create: (data: Partial<Requisition> & { lines?: Partial<RequisitionLine>[] }) =>
        apiClient.post<Requisition>('/requisitions/', data),

      update: (id: number, data: Partial<Requisition>) =>
        apiClient.patch<Requisition>(`/requisitions/${id}/`, data),

      approve: (id: number, approvedLines?: Record<number, number>) =>
        apiClient.post<Requisition>(`/requisitions/${id}/approve/`, {
          approved_lines: approvedLines || {},
        }),

      reject: (id: number, reason?: string) =>
        apiClient.post<Requisition>(`/requisitions/${id}/reject/`, { reason }),

      fulfill: (id: number) =>
        apiClient.post<Requisition>(`/requisitions/${id}/fulfill/`),
    };

// Inventory Count endpoints
export const inventoryCountsApi = USE_MOCK_DATA
  ? mockInventoryCountsApi
  : {
      list: (params?: {
        status?: string;
        warehouse?: number;
        search?: string;
        page?: number;
      }) =>
        apiClient.get<PaginatedResponse<InventoryCount>>('/inventory-counts/', {
          params,
        }),

      get: (id: number) =>
        apiClient.get<InventoryCount>(`/inventory-counts/${id}/`),

      start: (warehouseId: number, period: string) =>
        apiClient.post<InventoryCount>('/inventory-counts/start/', {
          warehouse_id: warehouseId,
          period,
        }),

      importData: (id: number, countData: Array<{
        item_id?: number;
        item_code?: string;
        counted_qty: number;
      }>) =>
        apiClient.post<InventoryCount>(
          `/inventory-counts/${id}/import_data/`,
          { count_data: countData }
        ),

      close: (id: number) =>
        apiClient.post<InventoryCount>(`/inventory-counts/${id}/close/`),
    };

// Audit Logs endpoints
export const auditLogsApi = USE_MOCK_DATA
  ? mockAuditLogsApi
  : {
      list: (params?: {
        entity?: string;
        action?: string;
        actor?: number;
        page?: number;
      }) =>
        apiClient.get<PaginatedResponse<AuditLog>>('/audit-logs/', { params }),
    };

// Reports endpoints
export const reportsApi = USE_MOCK_DATA
  ? mockReportsApi
  : {
      shortages: (params?: { warehouse?: number; category?: number }) =>
        apiClient.get('/reports/shortages/', { params }),

      monthlyFlow: (params: {
        year: number;
        month: number;
        warehouse?: number;
        item?: number;
      }) => apiClient.get('/reports/monthly_flow/', { params }),

      consumptionByDept: (params?: {
        dept_lab?: string;
        start_date?: string;
        end_date?: string;
      }) => apiClient.get('/reports/consumption_by_dept/', { params }),

      discrepancies: (params?: { warehouse?: number; count_id?: number }) =>
        apiClient.get('/reports/discrepancies/', { params }),
    };

// Suppliers endpoints
export const suppliersApi = USE_MOCK_DATA
  ? mockSuppliersApi
  : {
      list: (params?: { search?: string; page?: number }) =>
        apiClient.get<PaginatedResponse<Supplier>>('/suppliers/', { params }),

      get: (id: number) => apiClient.get<Supplier>(`/suppliers/${id}/`),

      create: (data: Partial<Supplier>) =>
        apiClient.post<Supplier>('/suppliers/', data),

      update: (id: number, data: Partial<Supplier>) =>
        apiClient.patch<Supplier>(`/suppliers/${id}/`, data),

      delete: (id: number) => apiClient.delete(`/suppliers/${id}/`),
    };

// Purchase Orders endpoints
export const purchaseOrdersApi = USE_MOCK_DATA
  ? mockPurchaseOrdersApi
  : {
      list: (params?: {
        status?: string;
        supplier?: number;
        search?: string;
        page?: number;
      }) =>
        apiClient.get<PaginatedResponse<PurchaseOrder>>('/purchase-orders/', {
          params,
        }),

      get: (id: number) =>
        apiClient.get<PurchaseOrder>(`/purchase-orders/${id}/`),

      create: (data: Partial<PurchaseOrder>) =>
        apiClient.post<PurchaseOrder>('/purchase-orders/', data),

      update: (id: number, data: Partial<PurchaseOrder>) =>
        apiClient.patch<PurchaseOrder>(`/purchase-orders/${id}/`, data),
    };

