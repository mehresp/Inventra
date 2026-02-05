/**
 * Lots / Batches Tab Component
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Search, PackageX, AlertTriangle, Calendar, Plus, Edit, Trash2 } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import { Select } from '../ui/select';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { stockLotsApi, itemsApi, warehousesApi } from '../../api/endpoints';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { handleApiError } from '../../api/client';
import type { StockLot } from '../../types';

export const LotsTab = () => {
  const { t } = useLanguage();
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<number | undefined>();
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | undefined>();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingLot, setEditingLot] = useState<StockLot | null>(null);

  const canManage = role === 'Admin' || role === 'Storekeeper';

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

  const deleteMutation = useMutation({
    mutationFn: (id: number) => stockLotsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocklots'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('lots.title')}</h2>
        </div>
        {canManage && (
          <Button onClick={() => {
            setEditingLot(null);
            setShowCreateDialog(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            {t('lots.create')}
          </Button>
        )}
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
                  {canManage && <TableHead>{t('items.actions')}</TableHead>}
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
                      {canManage && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingLot(lot);
                                setShowCreateDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(t('lots.deleteConfirm'))) {
                                  deleteMutation.mutate(lot.id);
                                }
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {canManage && (
        <StockLotDialog
          open={showCreateDialog}
          onClose={() => {
            setShowCreateDialog(false);
            setEditingLot(null);
          }}
          lot={editingLot}
          onSuccess={() => {
            setShowCreateDialog(false);
            setEditingLot(null);
            queryClient.invalidateQueries({ queryKey: ['stocklots'] });
          }}
        />
      )}
    </div>
  );
};

interface StockLotDialogProps {
  open: boolean;
  onClose: () => void;
  lot: StockLot | null;
  onSuccess: () => void;
}

const StockLotDialog = ({ open, onClose, lot, onSuccess }: StockLotDialogProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    for_item: lot?.for_item || '',
    for_warehouse: lot?.for_warehouse || '',
    batch_no: lot?.batch_no || '',
    expiry_date: lot?.expiry_date ? lot.expiry_date.split('T')[0] : '',
    qty: lot?.qty || '',
  });
  const [submitError, setSubmitError] = useState('');

  const { data: itemsData } = useQuery({
    queryKey: ['items'],
    queryFn: () => itemsApi.list().then(res => res.data),
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehousesApi.list().then(res => res.data),
  });

  const items = itemsData?.results || [];
  const warehouses = warehousesData?.results || [];

  useEffect(() => {
    if (open) {
      setFormData({
        for_item: lot?.for_item || '',
        for_warehouse: lot?.for_warehouse || '',
        batch_no: lot?.batch_no || '',
        expiry_date: lot?.expiry_date ? lot.expiry_date.split('T')[0] : '',
        qty: lot?.qty || '',
      });
      setSubmitError('');
    }
  }, [open, lot]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<StockLot>) => {
      if (lot) {
        return stockLotsApi.update(lot.id, data);
      }
      return stockLotsApi.create(data);
    },
    onSuccess: () => {
      setSubmitError('');
      onClose();
      onSuccess();
    },
    onError: (err: Error) => {
      setSubmitError(handleApiError(err));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!formData.for_item || !formData.for_warehouse || !formData.batch_no || !formData.qty) {
      setSubmitError(t('lots.fillRequiredFields'));
      return;
    }

    createMutation.mutate({
      for_item: Number(formData.for_item),
      for_warehouse: Number(formData.for_warehouse),
      batch_no: formData.batch_no,
      expiry_date: formData.expiry_date || undefined,
      qty: Number(formData.qty),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) setSubmitError(''); onClose(); }}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{lot ? t('lots.editLot') : t('lots.addNew')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && (
            <Alert variant="destructive" className="rounded-md">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">{t('common.item')} *</label>
            <Select
              value={formData.for_item}
              onChange={(e) => setFormData({ ...formData, for_item: e.target.value })}
              required
            >
              <option value="">{t('lots.selectItem')}</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('common.warehouse')} *</label>
            <Select
              value={formData.for_warehouse}
              onChange={(e) => setFormData({ ...formData, for_warehouse: e.target.value })}
              required
            >
              <option value="">{t('lots.selectWarehouse')}</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('lots.batchNo')} *</label>
            <Input
              value={formData.batch_no}
              onChange={(e) => setFormData({ ...formData, batch_no: e.target.value })}
              required
              placeholder={t('lots.batchNoPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('lots.quantity')} *</label>
            <Input
              type="number"
              step="0.001"
              value={formData.qty}
              onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
              required
              placeholder="0.000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('lots.expiryDate')}</label>
            <Input
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? t('lots.saving') : lot ? t('common.update') : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

