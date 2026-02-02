/**
 * Mock API Service - Simulates API calls with delays
 */
import type { AxiosResponse } from 'axios';
import {
  mockUsers,
  mockProfiles,
  mockCategories,
  mockWarehouses,
  mockItems,
  mockStockLots,
  mockMovements,
  mockRequisitions,
  mockInventoryCounts,
  mockAuditLogs,
  mockSuppliers,
  mockPurchaseOrders,
  createPaginatedResponse,
} from './data';
import type {
  AuthResponse,
  UserProfile,
  Item,
  Category,
  Warehouse,
  StockLot,
  Movement,
  Requisition,
  InventoryCount,
  InventoryCountLine,
  AuditLog,
  Supplier,
  PurchaseOrder,
  PaginatedResponse,
} from '../types';

// Simulate network delay
const delay = (ms: number = 500) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to create axios-like response
function createResponse<T>(data: T, status: number = 200): Promise<AxiosResponse<T>> {
  return Promise.resolve({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  });
}

// In-memory storage for mutations
let itemsStore = [...mockItems];
let categoriesStore = [...mockCategories];
let warehousesStore = [...mockWarehouses];
let requisitionsStore = [...mockRequisitions];
let inventoryCountsStore = [...mockInventoryCounts];
let movementsStore = [...mockMovements];

// Auth API
export const mockAuthApi = {
  login: async (username: string, _password: string): Promise<AxiosResponse<AuthResponse>> => {
    await delay(800);
    
    // Simple mock authentication - accept any credentials
    const user = mockUsers.find((u) => u.username === username) || mockUsers[0];
    const profile = mockProfiles.find((p) => p.user === user.id) || mockProfiles[0];
    
    return createResponse<AuthResponse>({
      access: 'mock_access_token_' + Date.now(),
      refresh: 'mock_refresh_token_' + Date.now(),
      user,
      role: profile.role,
    });
  },

  register: async (data: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }): Promise<AxiosResponse<AuthResponse>> => {
    await delay(800);
    
    const newUser: typeof mockUsers[0] = {
      id: mockUsers.length + 1,
      username: data.username,
      email: data.email,
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      is_active: true,
    };
    
    return createResponse<AuthResponse>({
      access: 'mock_access_token_' + Date.now(),
      refresh: 'mock_refresh_token_' + Date.now(),
      user: newUser,
      role: 'Requester',
    });
  },

  getProfile: async (): Promise<AxiosResponse<UserProfile>> => {
    await delay(300);
    return createResponse<UserProfile>(mockProfiles[0]);
  },

  refreshToken: async (_refresh: string): Promise<AxiosResponse<{ access: string }>> => {
    await delay(300);
    return createResponse<{ access: string }>({
      access: 'mock_access_token_' + Date.now(),
    });
  },
};

// Items API
export const mockItemsApi = {
  list: async (params?: {
    search?: string;
    category?: number;
    below_min?: boolean;
    warehouse?: number;
    page?: number;
  }): Promise<AxiosResponse<PaginatedResponse<Item>>> => {
    await delay(400);
    
    let filtered = [...itemsStore];
    
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.code.toLowerCase().includes(searchLower) ||
          item.name.toLowerCase().includes(searchLower)
      );
    }
    
    if (params?.category) {
      filtered = filtered.filter((item) => item.for_category === params.category);
    }
    
    if (params?.below_min) {
      filtered = filtered.filter((item) => item.is_below_min);
    }
    
    const page = params?.page || 1;
    return createResponse(createPaginatedResponse(filtered, page));
  },

  get: async (id: number): Promise<AxiosResponse<Item>> => {
    await delay(300);
    const item = itemsStore.find((i) => i.id === id);
    if (!item) throw new Error('Item not found');
    return createResponse(item);
  },

  create: async (data: Partial<Item>): Promise<AxiosResponse<Item>> => {
    await delay(500);
    const category = categoriesStore.find((c) => c.id === data.for_category);
    const newItem: Item = {
      id: Math.max(...itemsStore.map((i) => i.id)) + 1,
      code: data.code || '',
      name: data.name || '',
      unit: data.unit || '',
      min_stock: data.min_stock || 0,
      for_category: data.for_category || 1,
      category_name: category?.name,
      is_active: data.is_active !== undefined ? data.is_active : true,
      current_stock: 0,
      is_below_min: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    itemsStore.push(newItem);
    return createResponse(newItem);
  },

  update: async (id: number, data: Partial<Item>): Promise<AxiosResponse<Item>> => {
    await delay(500);
    const index = itemsStore.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('Item not found');
    const category = categoriesStore.find((c) => c.id === data.for_category);
    itemsStore[index] = {
      ...itemsStore[index],
      ...data,
      category_name: category?.name || itemsStore[index].category_name,
      updated_at: new Date().toISOString(),
    };
    return createResponse(itemsStore[index]);
  },

  delete: async (id: number): Promise<AxiosResponse<void>> => {
    await delay(400);
    const index = itemsStore.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('Item not found');
    itemsStore.splice(index, 1);
    return createResponse(undefined as any);
  },

  getStock: async (id: number, warehouseId?: number): Promise<AxiosResponse<any>> => {
    await delay(300);
    const lots = mockStockLots.filter(
      (lot) => lot.for_item === id && (!warehouseId || lot.for_warehouse === warehouseId)
    );
    return createResponse({ lots, total: lots.reduce((sum, lot) => sum + lot.qty, 0) });
  },
};

// Categories API
export const mockCategoriesApi = {
  list: async (params?: { search?: string; page?: number }): Promise<AxiosResponse<PaginatedResponse<Category>>> => {
    await delay(300);
    let filtered = [...categoriesStore];
    
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter((cat) => cat.name.toLowerCase().includes(searchLower));
    }
    
    const page = params?.page || 1;
    return createResponse(createPaginatedResponse(filtered, page));
  },

  get: async (id: number): Promise<AxiosResponse<Category>> => {
    await delay(200);
    const category = categoriesStore.find((c) => c.id === id);
    if (!category) throw new Error('Category not found');
    return createResponse(category);
  },

  create: async (data: Partial<Category>): Promise<AxiosResponse<Category>> => {
    await delay(400);
    const newCategory: Category = {
      id: Math.max(...categoriesStore.map((c) => c.id)) + 1,
      name: data.name || '',
      items_count: 0,
    };
    categoriesStore.push(newCategory);
    return createResponse(newCategory);
  },

  update: async (id: number, data: Partial<Category>): Promise<AxiosResponse<Category>> => {
    await delay(400);
    const index = categoriesStore.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Category not found');
    categoriesStore[index] = { ...categoriesStore[index], ...data };
    return createResponse(categoriesStore[index]);
  },

  delete: async (id: number): Promise<AxiosResponse<void>> => {
    await delay(300);
    const index = categoriesStore.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Category not found');
    categoriesStore.splice(index, 1);
    return createResponse(undefined as any);
  },
};

// Warehouses API
export const mockWarehousesApi = {
  list: async (params?: {
    search?: string;
    is_active?: boolean;
    page?: number;
  }): Promise<AxiosResponse<PaginatedResponse<Warehouse>>> => {
    await delay(300);
    let filtered = [...warehousesStore];
    
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter(
        (wh) =>
          wh.name.toLowerCase().includes(searchLower) ||
          wh.location.toLowerCase().includes(searchLower)
      );
    }
    
    if (params?.is_active !== undefined) {
      filtered = filtered.filter((wh) => wh.is_active === params.is_active);
    }
    
    const page = params?.page || 1;
    return createResponse(createPaginatedResponse(filtered, page));
  },

  get: async (id: number): Promise<AxiosResponse<Warehouse>> => {
    await delay(200);
    const warehouse = warehousesStore.find((w) => w.id === id);
    if (!warehouse) throw new Error('Warehouse not found');
    return createResponse(warehouse);
  },

  create: async (data: Partial<Warehouse>): Promise<AxiosResponse<Warehouse>> => {
    await delay(400);
    const newWarehouse: Warehouse = {
      id: Math.max(...warehousesStore.map((w) => w.id)) + 1,
      name: data.name || '',
      location: data.location || '',
      is_active: data.is_active !== undefined ? data.is_active : true,
      items_count: 0,
      created_at: new Date().toISOString(),
    };
    warehousesStore.push(newWarehouse);
    return createResponse(newWarehouse);
  },

  update: async (id: number, data: Partial<Warehouse>): Promise<AxiosResponse<Warehouse>> => {
    await delay(400);
    const index = warehousesStore.findIndex((w) => w.id === id);
    if (index === -1) throw new Error('Warehouse not found');
    warehousesStore[index] = { ...warehousesStore[index], ...data };
    return createResponse(warehousesStore[index]);
  },

  delete: async (id: number): Promise<AxiosResponse<void>> => {
    await delay(300);
    const index = warehousesStore.findIndex((w) => w.id === id);
    if (index === -1) throw new Error('Warehouse not found');
    warehousesStore.splice(index, 1);
    return createResponse(undefined as any);
  },
};

// Stock Lots API
export const mockStockLotsApi = {
  list: async (params?: {
    for_item?: number;
    for_warehouse?: number;
    search?: string;
    page?: number;
  }): Promise<AxiosResponse<PaginatedResponse<StockLot>>> => {
    await delay(300);
    let filtered = [...mockStockLots];
    
    if (params?.for_item) {
      filtered = filtered.filter((lot) => lot.for_item === params.for_item);
    }
    
    if (params?.for_warehouse) {
      filtered = filtered.filter((lot) => lot.for_warehouse === params.for_warehouse);
    }
    
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter(
        (lot) =>
          lot.batch_no.toLowerCase().includes(searchLower) ||
          lot.item_name?.toLowerCase().includes(searchLower)
      );
    }
    
    const page = params?.page || 1;
    return createResponse(createPaginatedResponse(filtered, page));
  },

  get: async (id: number): Promise<AxiosResponse<StockLot>> => {
    await delay(200);
    const lot = mockStockLots.find((l) => l.id === id);
    if (!lot) throw new Error('Stock lot not found');
    return createResponse(lot);
  },

  create: async (data: Partial<StockLot>): Promise<AxiosResponse<StockLot>> => {
    await delay(400);
    const item = itemsStore.find((i) => i.id === data.for_item);
    const warehouse = warehousesStore.find((w) => w.id === data.for_warehouse);
    const newLot: StockLot = {
      id: Math.max(...mockStockLots.map((l) => l.id)) + 1,
      for_item: data.for_item || 0,
      item_code: item?.code,
      item_name: item?.name,
      for_warehouse: data.for_warehouse || 0,
      warehouse_name: warehouse?.name,
      batch_no: data.batch_no || '',
      expiry_date: data.expiry_date,
      qty: data.qty || 0,
      status: 'Active',
    };
    mockStockLots.push(newLot);
    return createResponse(newLot);
  },

  update: async (id: number, data: Partial<StockLot>): Promise<AxiosResponse<StockLot>> => {
    await delay(400);
    const index = mockStockLots.findIndex((l) => l.id === id);
    if (index === -1) throw new Error('Stock lot not found');
    mockStockLots[index] = { ...mockStockLots[index], ...data };
    return createResponse(mockStockLots[index]);
  },

  delete: async (id: number): Promise<AxiosResponse<void>> => {
    await delay(300);
    const index = mockStockLots.findIndex((l) => l.id === id);
    if (index === -1) throw new Error('Stock lot not found');
    mockStockLots.splice(index, 1);
    return createResponse(undefined as any);
  },
};

// Movements API
export const mockMovementsApi = {
  list: async (params?: {
    type?: string;
    item?: number;
    warehouse_from?: number;
    warehouse_to?: number;
    search?: string;
    page?: number;
  }): Promise<AxiosResponse<PaginatedResponse<Movement>>> => {
    await delay(300);
    let filtered = [...movementsStore];
    
    if (params?.type) {
      filtered = filtered.filter((mov) => mov.type === params.type);
    }
    
    if (params?.item) {
      filtered = filtered.filter((mov) => mov.for_item === params.item);
    }
    
    if (params?.warehouse_from) {
      filtered = filtered.filter((mov) => mov.for_warehouse_from === params.warehouse_from);
    }
    
    if (params?.warehouse_to) {
      filtered = filtered.filter((mov) => mov.for_warehouse_to === params.warehouse_to);
    }
    
    const page = params?.page || 1;
    return createResponse(createPaginatedResponse(filtered, page));
  },

  get: async (id: number): Promise<AxiosResponse<Movement>> => {
    await delay(200);
    const movement = movementsStore.find((m) => m.id === id);
    if (!movement) throw new Error('Movement not found');
    return createResponse(movement);
  },

  create: async (data: Partial<Movement> & { override?: boolean }): Promise<AxiosResponse<Movement>> => {
    await delay(500);
    const item = itemsStore.find((i) => i.id === data.for_item);
    const warehouseFrom = warehousesStore.find((w) => w.id === data.for_warehouse_from);
    const warehouseTo = warehousesStore.find((w) => w.id === data.for_warehouse_to);
    const newMovement: Movement = {
      id: Math.max(...movementsStore.map((m) => m.id)) + 1,
      type: data.type || 'IN',
      ref_type: data.ref_type || 'OTHER',
      ref_no: data.ref_no || `MOV-${Date.now()}`,
      for_item: data.for_item || 0,
      item_code: item?.code,
      item_name: item?.name,
      for_warehouse_from: data.for_warehouse_from,
      warehouse_from_name: warehouseFrom?.name,
      for_warehouse_to: data.for_warehouse_to,
      warehouse_to_name: warehouseTo?.name,
      qty: data.qty || 0,
      for_actor: data.for_actor || 1,
      notes: data.notes,
      created_at: new Date().toISOString(),
    };
    movementsStore.push(newMovement);
    return createResponse(newMovement);
  },
};

// Requisitions API
export const mockRequisitionsApi = {
  list: async (params?: {
    status?: string;
    requester?: number;
    dept_lab?: string;
    search?: string;
    page?: number;
  }): Promise<AxiosResponse<PaginatedResponse<Requisition>>> => {
    await delay(400);
    let filtered = [...requisitionsStore];
    
    if (params?.status) {
      filtered = filtered.filter((req) => req.status === params.status);
    }
    
    if (params?.requester) {
      filtered = filtered.filter((req) => req.for_requester === params.requester);
    }
    
    if (params?.dept_lab) {
      filtered = filtered.filter((req) => req.dept_lab === params.dept_lab);
    }
    
    const page = params?.page || 1;
    return createResponse(createPaginatedResponse(filtered, page));
  },

  get: async (id: number): Promise<AxiosResponse<Requisition>> => {
    await delay(300);
    const requisition = requisitionsStore.find((r) => r.id === id);
    if (!requisition) throw new Error('Requisition not found');
    return createResponse(requisition);
  },

  create: async (data: Partial<Requisition> & { lines?: Partial<any>[] }): Promise<AxiosResponse<Requisition>> => {
    await delay(500);
    const newRequisition: Requisition = {
      id: Math.max(...requisitionsStore.map((r) => r.id)) + 1,
      req_no: `REQ-2024-${String(requisitionsStore.length + 1).padStart(3, '0')}`,
      for_requester: data.for_requester || 3,
      requester_username: 'requester',
      dept_lab: data.dept_lab || '',
      status: 'Pending',
      needed_by: data.needed_by || new Date().toISOString(),
      notes: data.notes,
      items_count: data.lines?.length || 0,
      lines: data.lines as any,
      created_at: new Date().toISOString(),
    };
    requisitionsStore.push(newRequisition);
    return createResponse(newRequisition);
  },

  update: async (id: number, data: Partial<Requisition>): Promise<AxiosResponse<Requisition>> => {
    await delay(400);
    const index = requisitionsStore.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Requisition not found');
    requisitionsStore[index] = { ...requisitionsStore[index], ...data };
    return createResponse(requisitionsStore[index]);
  },

  approve: async (id: number, approvedLines?: Record<number, number>): Promise<AxiosResponse<Requisition>> => {
    await delay(500);
    const index = requisitionsStore.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Requisition not found');
    requisitionsStore[index].status = 'Approved';
    requisitionsStore[index].for_approved_by = 1;
    requisitionsStore[index].approver_username = 'admin';
    if (requisitionsStore[index].lines && approvedLines) {
      requisitionsStore[index].lines = requisitionsStore[index].lines!.map((line) => ({
        ...line,
        approved_qty: approvedLines[line.id] || line.requested_qty,
      }));
    }
    return createResponse(requisitionsStore[index]);
  },

  reject: async (id: number, reason?: string): Promise<AxiosResponse<Requisition>> => {
    await delay(400);
    const index = requisitionsStore.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Requisition not found');
    requisitionsStore[index].status = 'Rejected';
    requisitionsStore[index].notes = reason || requisitionsStore[index].notes;
    return createResponse(requisitionsStore[index]);
  },

  fulfill: async (id: number): Promise<AxiosResponse<Requisition>> => {
    await delay(500);
    const index = requisitionsStore.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Requisition not found');
    requisitionsStore[index].status = 'Fulfilled';
    requisitionsStore[index].fulfilled_at = new Date().toISOString();
    if (requisitionsStore[index].lines) {
      requisitionsStore[index].lines = requisitionsStore[index].lines!.map((line) => ({
        ...line,
        issued_qty: line.approved_qty,
      }));
    }
    return createResponse(requisitionsStore[index]);
  },
};

// Inventory Counts API
export const mockInventoryCountsApi = {
  list: async (params?: {
    status?: string;
    warehouse?: number;
    search?: string;
    page?: number;
  }): Promise<AxiosResponse<PaginatedResponse<InventoryCount>>> => {
    await delay(300);
    let filtered = [...inventoryCountsStore];
    
    if (params?.status) {
      filtered = filtered.filter((count) => count.status === params.status);
    }
    
    if (params?.warehouse) {
      filtered = filtered.filter((count) => count.for_warehouse === params.warehouse);
    }
    
    const page = params?.page || 1;
    return createResponse(createPaginatedResponse(filtered, page));
  },

  get: async (id: number): Promise<AxiosResponse<InventoryCount>> => {
    await delay(300);
    const count = inventoryCountsStore.find((c) => c.id === id);
    if (!count) throw new Error('Inventory count not found');
    return createResponse(count);
  },

  start: async (warehouseId: number, period: string): Promise<AxiosResponse<InventoryCount>> => {
    await delay(500);
    const warehouse = warehousesStore.find((w) => w.id === warehouseId);
    const newCount: InventoryCount = {
      id: Math.max(...inventoryCountsStore.map((c) => c.id)) + 1,
      period,
      for_warehouse: warehouseId,
      warehouse_name: warehouse?.name,
      status: 'Open',
      started_at: new Date().toISOString(),
      discrepancies_count: 0,
      lines: [],
    };
    inventoryCountsStore.push(newCount);
    return createResponse(newCount);
  },

  importData: async (
    id: number,
    countData: Array<{ item_id?: number; item_code?: string; counted_qty: number }>
  ): Promise<AxiosResponse<InventoryCount>> => {
    await delay(600);
    const index = inventoryCountsStore.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Inventory count not found');
    
    const lines: InventoryCountLine[] = countData.map((data, idx) => {
      const item = itemsStore.find((i) => i.id === data.item_id || i.code === data.item_code);
      return {
        id: idx + 1,
        for_item: item?.id || 0,
        item_code: item?.code,
        item_name: item?.name,
        item_unit: item?.unit,
        system_qty: item?.current_stock || 0,
        counted_qty: data.counted_qty,
        delta: data.counted_qty - (item?.current_stock || 0),
      };
    });
    
    inventoryCountsStore[index].lines = lines;
    inventoryCountsStore[index].discrepancies_count = lines.filter((l) => l.delta !== 0).length;
    return createResponse(inventoryCountsStore[index]);
  },

  close: async (id: number): Promise<AxiosResponse<InventoryCount>> => {
    await delay(500);
    const index = inventoryCountsStore.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Inventory count not found');
    inventoryCountsStore[index].status = 'Closed';
    inventoryCountsStore[index].closed_at = new Date().toISOString();
    return createResponse(inventoryCountsStore[index]);
  },
};

// Audit Logs API
export const mockAuditLogsApi = {
  list: async (params?: {
    entity?: string;
    action?: string;
    actor?: number;
    page?: number;
  }): Promise<AxiosResponse<PaginatedResponse<AuditLog>>> => {
    await delay(300);
    let filtered = [...mockAuditLogs];
    
    if (params?.entity) {
      filtered = filtered.filter((log) => log.entity === params.entity);
    }
    
    if (params?.action) {
      filtered = filtered.filter((log) => log.action === params.action);
    }
    
    if (params?.actor) {
      filtered = filtered.filter((log) => log.for_actor === params.actor);
    }
    
    const page = params?.page || 1;
    return createResponse(createPaginatedResponse(filtered, page));
  },
};

// Reports API
export const mockReportsApi = {
  shortages: async (params?: { warehouse?: number; category?: number }): Promise<AxiosResponse<any[]>> => {
    await delay(400);
    let filtered = itemsStore.filter((item) => item.is_below_min);
    
    if (params?.category) {
      filtered = filtered.filter((item) => item.for_category === params.category);
    }
    
    const shortages = filtered.map((item) => ({
      item_code: item.code,
      item_name: item.name,
      current_stock: item.current_stock || 0,
      min_stock: item.min_stock,
      shortage: item.min_stock - (item.current_stock || 0),
    }));
    
    return createResponse(shortages);
  },

  monthlyFlow: async (params: {
    year: number;
    month: number;
    warehouse?: number;
    item?: number;
  }): Promise<AxiosResponse<any>> => {
    await delay(400);
    // Mock monthly flow data
    return createResponse({
      in: 150,
      out: 120,
      net: 30,
      warehouse: params.warehouse,
      item: params.item,
    });
  },

  consumptionByDept: async (_params?: {
    dept_lab?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<AxiosResponse<any>> => {
    await delay(400);
    return createResponse([
      { dept_lab: 'Chemistry Lab', total_consumption: 450 },
      { dept_lab: 'Biology Lab', total_consumption: 320 },
      { dept_lab: 'Physics Lab', total_consumption: 280 },
    ]);
  },

  discrepancies: async (params?: { warehouse?: number; count_id?: number }): Promise<AxiosResponse<any[]>> => {
    await delay(400);
    const count = inventoryCountsStore.find((c) => c.id === params?.count_id);
    if (count && count.lines) {
      return createResponse(
        count.lines.filter((l) => l.delta !== 0).map((line) => ({
          item_code: line.item_code,
          item_name: line.item_name,
          system_qty: line.system_qty,
          counted_qty: line.counted_qty,
          delta: line.delta,
        }))
      );
    }
    return createResponse([]);
  },
};

// Suppliers API
export const mockSuppliersApi = {
  list: async (params?: { search?: string; page?: number }): Promise<AxiosResponse<PaginatedResponse<Supplier>>> => {
    await delay(300);
    let filtered = [...mockSuppliers];
    
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter(
        (supplier) =>
          supplier.name.toLowerCase().includes(searchLower) ||
          supplier.contact.toLowerCase().includes(searchLower)
      );
    }
    
    const page = params?.page || 1;
    return createResponse(createPaginatedResponse(filtered, page));
  },

  get: async (id: number): Promise<AxiosResponse<Supplier>> => {
    await delay(200);
    const supplier = mockSuppliers.find((s) => s.id === id);
    if (!supplier) throw new Error('Supplier not found');
    return createResponse(supplier);
  },

  create: async (data: Partial<Supplier>): Promise<AxiosResponse<Supplier>> => {
    await delay(400);
    const newSupplier: Supplier = {
      id: Math.max(...mockSuppliers.map((s) => s.id)) + 1,
      name: data.name || '',
      contact: data.contact || '',
      orders_count: 0,
    };
    mockSuppliers.push(newSupplier);
    return createResponse(newSupplier);
  },

  update: async (id: number, data: Partial<Supplier>): Promise<AxiosResponse<Supplier>> => {
    await delay(400);
    const index = mockSuppliers.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Supplier not found');
    mockSuppliers[index] = { ...mockSuppliers[index], ...data };
    return createResponse(mockSuppliers[index]);
  },

  delete: async (id: number): Promise<AxiosResponse<void>> => {
    await delay(300);
    const index = mockSuppliers.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Supplier not found');
    mockSuppliers.splice(index, 1);
    return createResponse(undefined as any);
  },
};

// Purchase Orders API
export const mockPurchaseOrdersApi = {
  list: async (params?: {
    status?: string;
    supplier?: number;
    search?: string;
    page?: number;
  }): Promise<AxiosResponse<PaginatedResponse<PurchaseOrder>>> => {
    await delay(300);
    let filtered = [...mockPurchaseOrders];
    
    if (params?.status) {
      filtered = filtered.filter((po) => po.status === params.status);
    }
    
    if (params?.supplier) {
      filtered = filtered.filter((po) => po.supplier === params.supplier);
    }
    
    const page = params?.page || 1;
    return createResponse(createPaginatedResponse(filtered, page));
  },

  get: async (id: number): Promise<AxiosResponse<PurchaseOrder>> => {
    await delay(200);
    const po = mockPurchaseOrders.find((p) => p.id === id);
    if (!po) throw new Error('Purchase order not found');
    return createResponse(po);
  },

  create: async (data: Partial<PurchaseOrder>): Promise<AxiosResponse<PurchaseOrder>> => {
    await delay(500);
    const supplier = mockSuppliers.find((s) => s.id === data.supplier);
    const newPO: PurchaseOrder = {
      id: Math.max(...mockPurchaseOrders.map((p) => p.id)) + 1,
      po_no: `PO-2024-${String(mockPurchaseOrders.length + 1).padStart(3, '0')}`,
      supplier: data.supplier || 0,
      supplier_name: supplier?.name,
      status: 'Pending',
      created_at: new Date().toISOString(),
    };
    mockPurchaseOrders.push(newPO);
    return createResponse(newPO);
  },

  update: async (id: number, data: Partial<PurchaseOrder>): Promise<AxiosResponse<PurchaseOrder>> => {
    await delay(400);
    const index = mockPurchaseOrders.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Purchase order not found');
    mockPurchaseOrders[index] = { ...mockPurchaseOrders[index], ...data };
    return createResponse(mockPurchaseOrders[index]);
  },
};

