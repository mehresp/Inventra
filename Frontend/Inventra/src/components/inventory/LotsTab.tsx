/**
 * Lots / Batches Tab Component
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Search, PackageX, AlertTriangle, Calendar } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import { Select } from '../ui/select';
import { Badge } from '../ui/badge';
import { stockLotsApi, itemsApi, warehousesApi } from '../../api/endpoints';
import { useLanguage } from '../../context/LanguageContext';

export const LotsTab = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<number | undefined>();
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | undefined>();

  // Fetch stock lots
  const { data: lotsData, isLoading } = useQuery({
    queryKey: ['stocklots', search, selectedItem, selectedWarehouse],
    queryFn: () =>
      stockLotsApi.list({
        search: search || undefined,
        for_item: selectedItem,
        for_warehouse: selectedWarehouse,
      }).then(res => res.data),
  });

  // Fetch items for filter
  const { data: itemsData } = useQuery({
    queryKey: ['items'],
    queryFn: () => itemsApi.list().then(res => res.data),
  });

  // Fetch warehouses for filter
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehousesApi.list().then(res => res.data),
  });

  const lots = lotsData?.results || [];
  const items = itemsData?.results || [];
  const warehouses = warehousesData?.results || [];

  const getExpiryStatus = (daysUntilExpiry?: number, expiryDate?: string) => {
    if (!expiryDate) return { variant: 'default' as const, label: t('status.na') };
    if (!daysUntilExpiry) return { variant: 'default' as const, label: t('status.na') };
    if (daysUntilExpiry < 0) return { variant: 'danger' as const, label: t('status.expired') };
    if (daysUntilExpiry <= 30) return { variant: 'warning' as const, label: `${t('status.expiresIn')} ${daysUntilExpiry} ${t('status.days')}` };
    return { variant: 'success' as const, label: `${t('status.expiresIn')} ${daysUntilExpiry} ${t('status.days')}` };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">{t('lots.title')}</h2>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('lots.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div>
              <Select
                value={selectedItem || ''}
                onChange={(e) => setSelectedItem(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">{t('lots.allItems')}</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} - {item.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Select
                value={selectedWarehouse || ''}
                onChange={(e) => setSelectedWarehouse(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">{t('common.allWarehouses')}</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lots Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('lots.stockLots')}</CardTitle>
          <CardDescription>
            {lots.length} {t('lots.found')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : lots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <PackageX className="h-12 w-12 mb-2 opacity-50" />
              <p>{t('lots.noLots')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('lots.batchNo')}</TableHead>
                  <TableHead>{t('common.item')}</TableHead>
                  <TableHead>{t('common.warehouse')}</TableHead>
                  <TableHead>{t('lots.quantity')}</TableHead>
                  <TableHead>{t('lots.expiryDate')}</TableHead>
                  <TableHead>{t('requisitions.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lots.map((lot) => {
                  const expiryStatus = getExpiryStatus(lot.days_until_expiry, lot.expiry_date);
                  return (
                    <TableRow key={lot.id}>
                      <TableCell className="font-mono">{lot.batch_no}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{lot.item_name}</div>
                          <div className="text-sm text-gray-500">{lot.item_code}</div>
                        </div>
                      </TableCell>
                      <TableCell>{lot.warehouse_name}</TableCell>
                      <TableCell>{lot.qty}</TableCell>
                      <TableCell>
                        {lot.expiry_date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span>{new Date(lot.expiry_date).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          t('status.na')
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={expiryStatus.variant}>
                          {expiryStatus.variant === 'danger' && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {expiryStatus.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

