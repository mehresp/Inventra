/**
 * TypeScript types and interfaces for Inventra Frontend
 */

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  profile?: UserProfile;
}

export interface UserProfile {
  id: number;
  user: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  role_id: number;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
  role?: string;
}

export interface Item {
  id: number;
  code: string;
  name: string;
  unit: string;
  min_stock: number;
  for_category: number;
  category_name?: string;
  is_active: boolean;
  current_stock?: number;
  is_below_min?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  items_count?: number;
}

export interface Warehouse {
  id: number;
  name: string;
  location: string;
  is_active: boolean;
  items_count?: number;
  last_count_date?: string;
  created_at: string;
}

export interface StockLot {
  id: number;
  for_item: number;
  item_code?: string;
  item_name?: string;
  for_warehouse: number;
  warehouse_name?: string;
  batch_no: string;
  expiry_date?: string;
  qty: number;
  status?: string;
  days_until_expiry?: number;
}

export interface Movement {
  id: number;
  type: 'IN' | 'OUT' | 'ADJUST' | 'RETURN' | 'TRANSFER';
  ref_type: 'PO' | 'REQ' | 'INVCOUNT' | 'OTHER';
  ref_no: string;
  for_item: number;
  item_code?: string;
  item_name?: string;
  for_warehouse_from?: number;
  warehouse_from_name?: string;
  for_warehouse_to?: number;
  warehouse_to_name?: string;
  qty: number;
  for_actor: number;
  actor_username?: string;
  actor_full_name?: string;
  notes?: string;
  created_at: string;
}

export interface RequisitionLine {
  id: number;
  for_item: number;
  item_code?: string;
  item_name?: string;
  item_unit?: string;
  requested_qty: number;
  approved_qty: number;
  issued_qty: number;
  for_lot?: number;
  lot_batch_no?: string;
  notes?: string;
}

export interface Requisition {
  id: number;
  req_no: string;
  for_requester: number;
  requester_username?: string;
  dept_lab: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Fulfilled';
  needed_by: string;
  notes?: string;
  for_approved_by?: number;
  approver_username?: string;
  fulfilled_at?: string;
  items_count?: number;
  lines?: RequisitionLine[];
  created_at: string;
}

export interface InventoryCountLine {
  id: number;
  for_item: number;
  item_code?: string;
  item_name?: string;
  item_unit?: string;
  system_qty: number;
  counted_qty: number;
  delta: number;
}

export interface InventoryCount {
  id: number;
  period: string;
  for_warehouse: number;
  warehouse_name?: string;
  status: 'Open' | 'Closed';
  started_at: string;
  closed_at?: string;
  discrepancies_count?: number;
  lines?: InventoryCountLine[];
}

export interface AuditLog {
  id: number;
  for_actor?: number;
  actor_username?: string;
  actor_full_name?: string;
  entity: string;
  entity_id: string;
  action: string;
  before?: any;
  after?: any;
  ip: string;
  user_agent: string;
  created_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact: string;
  orders_count?: number;
}

export interface PurchaseOrder {
  id: number;
  po_no: string;
  supplier: number;
  supplier_name?: string;
  status: string;
  created_at: string;
}

export interface ApiError {
  error: {
    code: number;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

