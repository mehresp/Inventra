# Mock Data Setup

این پروژه از Mock Data برای توسعه فرانت‌اند استفاده می‌کند.

## فعال‌سازی Mock Data

Mock Data به صورت پیش‌فرض در حالت Development فعال است. برای غیرفعال کردن آن، متغیر محیطی زیر را تنظیم کنید:

```bash
VITE_USE_MOCK_DATA=false
```

یا در فایل `.env`:

```
VITE_USE_MOCK_DATA=false
```

## استفاده

هنگامی که Mock Data فعال است، تمام درخواست‌های API به Mock API Service هدایت می‌شوند که داده‌های از پیش تعریف شده را برمی‌گرداند.

### داده‌های Mock موجود:

- **Users**: 3 کاربر (admin, storekeeper, requester)
- **Categories**: 5 دسته‌بندی
- **Warehouses**: 3 انبار
- **Items**: 8 آیتم
- **Stock Lots**: 4 لات
- **Movements**: 4 حرکت
- **Requisitions**: 3 درخواست
- **Inventory Counts**: 2 شمارش
- **Audit Logs**: 4 لاگ
- **Suppliers**: 3 تامین‌کننده
- **Purchase Orders**: 2 سفارش خرید

### لاگین

برای لاگین می‌توانید از هر username و password استفاده کنید. Mock API همه درخواست‌ها را می‌پذیرد و کاربر پیش‌فرض را برمی‌گرداند.

### تغییرات

تغییرات ایجاد شده در Mock Data در طول session حفظ می‌شوند، اما با refresh صفحه به حالت اولیه برمی‌گردند.

## فایل‌های مرتبط

- `src/mock/data.ts`: داده‌های Mock
- `src/mock/api.ts`: سرویس Mock API
- `src/api/endpoints.ts`: تعریف endpointها با پشتیبانی از Mock Data







