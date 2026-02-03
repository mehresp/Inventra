# Inventra — Inventory Tracking App 💎📦

A clean, modern system for **end‑to‑end inventory management**: request → procure → inbound → outbound/consumption → returns → stock counting — with **clear traceability, strict RBAC, audit logs, and ready‑to‑ship reports**. Built **Django 5 + DRF** (API is the single source of truth) · PostgreSQL · Redis · React + Vite + TypeScript + Tailwind · Docker Compose.

---

## Table of Contents ☕
- [Overview](#overview-)
- [Goals](#goals-)
- [Key Features](#key-features-)
- [Scope](#scope-)
- [RBAC Roles](#rbac-roles-)
- [Workflows](#workflows-)
- [Non‑Functional Requirements](#non-functional-requirements-)
- [Architecture](#architecture-)
- [UI & Navigation](#ui--navigation-)
- [Tables & Columns](#tables--columns-)
- [Entities & Fields](#entities--fields-)
- [Business Rules](#business-rules-)
- [Reports](#reports-)
- [Auth & Sessions](#auth--sessions-)
- [Internationalization](#internationalization-)
- [API (DRF, Contracts)](#api-drf-contracts-)
- [Repository Structure](#repository-structure-)
- [Setup & Run](#setup--run-)
- [ENV Variables](#env-variables-)
- [Testing](#testing-)
- [Security](#security-)
- [Backup & DR](#backup--dr-)
- [Permissions Matrix](#permissions-matrix-)
- [ERD (Text View)](#erd-text-view-)
- [Stock Formulae](#stock-formulae-)
- [State Machines](#state-machines-)
- [CSV/Excel Templates](#csvexcel-templates-)
- [Microcopy (EN)](#microcopy-en-)
- [Notifications](#notifications-)
- [Infra (Compose)](#infra-compose-)
- [Seed Data](#seed-data-)
- [Roadmap](#roadmap-)
- [License](#license-)

---

## Overview 🧭
- **What**: A lightweight, auditable inventory platform with shortage dashboard, request→fulfill flow, cycle counts & discrepancy handling.
- **Why**: Transparency, loss/shortage prevention, and full **auditability**.

## Goals 🎯
Streamline the end‑to‑end flow and provide **trustworthy, queryable history** for every movement.

## Key Features ✨
- Items/Warehouses/Lots, **Movements** (IN/OUT/ADJUST/TRANSFER/RETURN), **Requisitions** with approval, **Inventory Count** with discrepancies.
- **Strict RBAC** + full **Audit Trail** (before/after, IP/UA, actor).
- **Shortage alerts**, management reports, **Rate‑limit + JWT + CSRF**.

## Scope 📚
- **Core**: Items, Warehouses, Lots, Movements, Requisitions (+Lines), InventoryCount (+Lines), AuditLog, Users/Roles.
- **Optional**: Supplier, PurchaseOrder, Email/Telegram integrations for alerts.

## RBAC Roles 🔐
- **Admin**: configure, users/roles, global reports.
- **Storekeeper**: movements, fulfill requisitions, counts.
- **Requester**: create/track requisitions.
- **Auditor**: read‑only to logs & discrepancies.
> UI hides/shows actions by role. **No direct stock edit** (only via movement/adjust).

## Workflows 🔄
- **Request → Fulfillment**: Draft → Pending → Approve/Reject → Fulfilled (OUT recorded).
- **Inbound from PO**: receipt → IN (ref=PO) → stock updated → audit logged.
- **Inventory Count**: Start → Snapshot → CSV Import → Validate → Close → auto **ADJUST** + report.

## Non‑Functional Requirements ⚙️
- **Performance**: API ≤ 300ms (P95), render ≤ 2s; notifications ≤ 1s.
- **Reliability**: ≥ 98% uptime; daily DB backups (≥ 30 days).
- **Security**: TLS, short‑lived JWT + Refresh, CSRF (panel), rate‑limit, sensitive masking.
- **A11y**: WCAG AA contrast, full RTL/LTR, keyboard friendly.

## Architecture 🏗️
- **Frontend**: React + Vite + TS + Tailwind + React Router + React Query + shadcn/ui (Radix).
- **Backend**: Python 3.12+ · Django 5 · **DRF** (+ Channels if needed).
- **DB**: PostgreSQL (BTree/GIN indexes).
- **Cache/Broker**: Redis (throttling/locks/pubsub).
- **Proxy**: Nginx (reverse proxy; HTTPS in production).
- **DevOps**: Docker Compose (dev), CI/CD.

## UI & Navigation 🧩
- **Dashboard**: KPIs (shortages, pending reqs, active counts), monthly IN/OUT chart, quick links.
- **Inventory Mgmt**: tabs for Items / Warehouses / StockLots / Movements.
- **Requisitions**: requester create/list; storekeeper detail & fulfill.
- **Inventory Count**: start/import/validate/close + discrepancies list.
- **Reports**: shortages, monthly flow, consumption by dept/lab, discrepancies.
- **Logs & Settings**: audit log, users/roles, security, integrations, backups.

## Tables & Columns 📊
- **Items**: code · name · unit · category · minStock · currentStock · actions (filters: category/unit/belowMin).
- **Warehouses**: name · location · #items · lastCountDate · actions.
- **StockLots**: item · warehouse · batchNo · expiryDate · qty · status (expiring/expired).
- **Movements**: date · type · refType/refNo · item · from→to · qty(±) · actor · notes.
- **Requisitions**: reqNo · requester · dept/lab · status · items(count) · createdAt · approvedBy · fulfilledAt.
- **InventoryCount**: period · warehouse · startedAt · closedAt · discrepancies · status.
- **AuditLog**: date · actor · entity · entityId · action · diff · ip · ua.

## Entities & Fields 🧬
`Item(id, code, name, unit, min_stock, category_id, is_active, created_at, updated_at)`
`Warehouse(id, name, location, is_active, created_at)`
`StockLot(id, item_id, warehouse_id, batch_no, expiry_date, qty)`
`Movement(id, type[IN/OUT/ADJUST/RETURN/TRANSFER], ref_type[PO/REQ/INVCOUNT/OTHER], ref_no, item_id, warehouse_from_id?, warehouse_to_id?, qty, actor_id, notes, created_at)`
`Requisition(id, req_no, requester_id, dept_lab, status, needed_by, notes, created_at, approved_by_id?, fulfilled_at?)`
`RequisitionLine(id, requisition_id, item_id, requested_qty, approved_qty, issued_qty, lot_id?, notes)`
`InventoryCount(id, period, warehouse_id, started_at, closed_at, status)`
`InventoryCountLine(id, count_id, item_id, system_qty, counted_qty, delta)`
`User/Role, AuditLog, Supplier/PO (optional)`

## Business Rules 📏
- **OUT** rejected when `current_stock < qty` unless `override=true` & privileged role.
- **Min‑Stock Alert** after each OUT if stock < minStock (email/telegram).
- **Adjust** requires **reason** and Storekeeper/Admin role.
- **FEFO** (first‑expire‑first‑out) for lot picking.

## Reports 📈
Shortages (below min), monthly IN/OUT by month/warehouse/item, consumption by dept/lab (from requisitions), inventory‑count discrepancies.

## Auth & Sessions 🔑
Short‑lived **JWT + Refresh** for SPA; secure Session + **CSRF** for admin panel.

## Internationalization 🌐
FA/EN bundles; Jalali/Gregorian dates; configurable units. RTL/LTR mirrored icons and layout.

## API (DRF, Contracts) ⚡
**API is DRF‑based and the single source of truth.**

Examples:
```http
GET  /api/v1/items?search=&category=&below_min=
POST /api/v1/movements {"type":"OUT","item_id":"…","qty":5}
POST /api/v1/requisitions/{id}/approve
POST /api/v1/counts/{id}/close
GET  /api/v1/reports/shortages/?warehouse=&category=
```
- **Pagination**: cursor (`next_cursor`, `prev_cursor`)
- **Filtering**: `gte,lte,like,in`
- **Sorting**: `?sort=field,-created_at`
- **Errors**: `{error:{code,message,details}}`
- **Rate‑Limit**: sensible defaults per IP + extra on sensitive endpoints

## Repository Structure 🗂️
```
Inventra/
  Backend/       Django + DRF (core app, management commands, tests)
  Frontend/      React + Vite + TypeScript + Tailwind (Inventra app)
  Ops/           Dockerfiles (Backend, Frontend), Nginx config
  docker-compose.yaml
  README.md
```

## Setup & Run 🚀
```bash
# 1) clone
git clone https://github.com/<you>/Inventra.git
cd Inventra

# 2) env
cp .env.example .env   # or create .env with required variables

# 3) compose up
docker compose up --build -d

# 4) migrate & superuser (optional)
docker compose exec api python manage.py migrate
docker compose exec api python manage.py createsuperuser

# 5) seed demo data (roles, users with profiles, items, warehouses, lots, requisitions)
docker compose exec api python manage.py seed_data
```
**URLs:** API (Docker) `http://localhost:8080/api/v1` · Web (Docker) `http://localhost:8080` · Web (local dev) `http://localhost:5173`

## ENV Variables 🔧
```env
DJANGO_SECRET_KEY=...
DB_NAME=inventra
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/0
CORS_ALLOWED_ORIGINS=http://localhost,http://localhost:80,http://localhost:8080,http://localhost:5173,http://localhost:3000
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL=2592000
```

## Testing 🧪
```bash
docker compose exec api pytest -q
# Optional: seed demo data first
docker compose exec api python manage.py seed_data
```

## Security 🛡️
RBAC + AuditLog (before/after, actor, ip, ua) · CSRF on panel · JWT+Refresh for API · DRF throttling via Redis · security headers · upload limits/scan.

## Backup & DR 💾
Nightly encrypted DB dumps (02:00), **30‑day retention**. Runbook: stop → restore → health‑check → switch traffic.

## Permissions Matrix ✅
| Module/Action                                  | Admin | Storekeeper | Requester | Auditor |
|-----------------------------------------------|:----:|:-----------:|:---------:|:-------:|
| Items: View                                    |  ✓   |      ✓      |     ✓     |    ✓    |
| Items: Create/Edit/Delete                      |  ✓   |      ✗      |     ✗     |    ✗    |
| Warehouses: View                               |  ✓   |      ✓      |     ✓     |    ✓    |
| Warehouses: Create/Edit/Delete                 |  ✓   |      ✗      |     ✗     |    ✗    |
| StockLots: View                                |  ✓   |      ✓      |     ✗     |    ✓    |
| Movements: Create (IN/OUT/ADJUST/RETURN/TRANSFER) | ✓ |      ✓      |     ✗     |    ✗    |
| Movements: View                                |  ✓   |      ✓      |     ✗     |    ✓    |
| Requisition: Create/View own                   |  ✓   |      ✓      |     ✓     |    ✗    |
| Requisition: Approve/Reject                    |  ✓   |      ✓      |     ✗     |    ✗    |
| Requisition: Fulfill                           |  ✓   |      ✓      |     ✗     |    ✗    |
| InventoryCount: Start/Close                    |  ✓   |      ✓      |     ✗     |    ✗    |
| InventoryCount: View                           |  ✓   |      ✓      |     ✓     |    ✓    |
| Reports: View                                  |  ✓   |      ✓      |     ✓     |    ✓    |
| AuditLog: View                                 |  ✓   |      ✗      |     ✗     |    ✓    |
| Users/Roles: Manage                            |  ✓   |      ✗      |     ✗     |    ✗    |
> Sensitive actions require a **reason** and are always audit‑logged.

## ERD (Text View) 🧵
```
Item ──< StockLot
Item ──< Movement
Warehouse ──< StockLot
Warehouse ──< Movement (from_id / to_id)
Requisition ──< RequisitionLine
User ──< Movement (actor)
User ──< Requisition (requester / approved_by)
InventoryCount ──< InventoryCountLine
Role ──< User
AuditLog → {actor_id, entity, entity_id}
Supplier ──< PurchaseOrder ──< Movement (ref_type=PO)
```

## Stock Formulae 🧮
**CurrentStock(item, warehouse)** = Σ(IN + RETURN + TRANSFER_in + ADJUST_pos) − Σ(OUT + TRANSFER_out + ADJUST_neg)  
**FEFO** for lot picking during OUT. Optional optimistic/row locks to avoid races.

## State Machines 🧠
- **Requisition**: Draft → Pending → (Approved | Rejected) → Fulfilled
- **InventoryCount**: Open → Importing → Validating → Closed (adjustments generated)

## CSV/Excel Templates 📥
- **InventoryCount Import**: `item_code,warehouse,batch_no,qty`
- **Items Bulk**: `code,name,unit,category,min_stock`

## Microcopy (EN) ✍️
- **Empty**: “No records yet.”
- **Confirm OUT**: “This may drop stock below minimum. Continue?”
- **Import Error**: “Row {n}: invalid item code.”
- **Success**: “Action completed successfully.”

## Notifications 🔔
- **Shortage** (trigger right after OUT when `stock < min`): email/telegram.
- **Lot Expiry**: warn 30 days before expiry (daily at 08:00).
- **Import Failure**: send error report to the executor.

## Infra (Compose) 🐳
- **db**: PostgreSQL 16
- **redis**: Redis 7
- **api**: Django + Gunicorn (migrate + collectstatic on start)
- **frontend**: Nginx serving built React app; proxies `/api/` to api
- **celery** / **celery-beat**: background tasks

## Seed Data 🌱
Run `python manage.py seed_data` to create roles, users (with profiles), categories, items, warehouses, stock lots, movements, requisitions, suppliers. Demo logins: `admin`/`admin123`, `storekeeper`/`storekeeper123`, `requester`/`requester123`, `auditor`/`auditor123`. Re-running seed ensures existing seed users keep a profile and these passwords.

## Roadmap 🗺️
- [ ] Supplier/PO module (full)
- [ ] Telegram notifications with templates
- [ ] Pivot‑style reports + advanced PDF export
- [ ] E2E tests with Playwright

## License 📄
TBD
