/**
 * Inventory Management Page - با shadcn/ui
 */
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { ItemsTab } from '../components/inventory/ItemsTab';
import { WarehousesTab } from '../components/inventory/WarehousesTab';
import { LotsTab } from '../components/inventory/LotsTab';
import { MovementsTab } from '../components/inventory/MovementsTab';
import { CategoriesTab } from '../components/inventory/CategoriesTab';
import { Package, Warehouse, Boxes, ArrowLeftRight, Tag } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const InventoryManagementPage = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('items');

  return (
    <div className="w-full h-full overflow-y-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">{t('inventory.title')}</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 overflow-x-auto">
          <TabsTrigger value="items" className="flex items-center gap-2 text-xs sm:text-sm">
            <Package className="h-4 w-4" />
            {t('inventory.items')}
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2 text-xs sm:text-sm">
            <Tag className="h-4 w-4" />
            <span className="hidden sm:inline">{t('inventory.categories')}</span>
            <span className="sm:hidden">{t('inventory.categoriesShort')}</span>
          </TabsTrigger>
          <TabsTrigger value="warehouses" className="flex items-center gap-2 text-xs sm:text-sm">
            <Warehouse className="h-4 w-4" />
            <span className="hidden sm:inline">{t('inventory.warehouses')}</span>
            <span className="sm:hidden">{t('inventory.warehousesShort')}</span>
          </TabsTrigger>
          <TabsTrigger value="lots" className="flex items-center gap-2 text-xs sm:text-sm">
            <Boxes className="h-4 w-4" />
            <span className="hidden sm:inline">{t('inventory.lots')}</span>
            <span className="sm:hidden">{t('inventory.lotsShort')}</span>
          </TabsTrigger>
          <TabsTrigger value="movements" className="flex items-center gap-2 text-xs sm:text-sm">
            <ArrowLeftRight className="h-4 w-4" />
            {t('inventory.movements')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-6">
          <ItemsTab />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <CategoriesTab />
        </TabsContent>

        <TabsContent value="warehouses" className="mt-6">
          <WarehousesTab />
        </TabsContent>

        <TabsContent value="lots" className="mt-6">
          <LotsTab />
        </TabsContent>

        <TabsContent value="movements" className="mt-6">
          <MovementsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
