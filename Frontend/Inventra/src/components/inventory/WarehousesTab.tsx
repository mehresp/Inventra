/**
 * Warehouses Tab Component
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { warehousesApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Skeleton } from '../ui/skeleton';
import { CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Plus, Edit, Trash2, PackageX } from 'lucide-react';
import type { Warehouse } from '../../types';

export const WarehousesTab = () => {
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const { t } = useLanguage();

  const canManage = role === 'Admin';

  const { data: warehousesData, isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehousesApi.list().then(res => res.data),
  });

  const warehouses = warehousesData?.results || [];

  const deleteMutation = useMutation({
    mutationFn: (id: number) => warehousesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('warehouses.title')}</h2>
        </div>
        {canManage && (
          <Button onClick={() => {
            setEditingWarehouse(null);
            setShowCreateDrawer(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            {t('warehouses.create')}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('warehouses.list')}</CardTitle>
          <CardDescription>
            {warehouses.length} {t('warehouses.found')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : warehouses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <PackageX className="h-12 w-12 mb-2 opacity-50" />
              <p className="mb-4">{t('warehouses.noWarehouses')}</p>
              {canManage && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingWarehouse(null);
                    setShowCreateDrawer(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('warehouses.createFirst')}
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('warehouses.name')}</TableHead>
                  <TableHead>{t('warehouses.location')}</TableHead>
                  <TableHead>{t('warehouses.itemsCount')}</TableHead>
                  <TableHead>{t('requisitions.status')}</TableHead>
                  {canManage && <TableHead>{t('items.actions')}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.map((wh) => (
                  <TableRow key={wh.id}>
                    <TableCell className="font-medium">{wh.name}</TableCell>
                    <TableCell>{wh.location}</TableCell>
                    <TableCell>{wh.items_count || 0}</TableCell>
                    <TableCell>
                      {wh.is_active ? (
                        <Badge variant="success">{t('status.active')}</Badge>
                      ) : (
                        <Badge variant="default">{t('status.inactive')}</Badge>
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingWarehouse(wh);
                              setShowCreateDrawer(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(t('warehouses.deleteConfirm'))) {
                                deleteMutation.mutate(wh.id);
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {canManage && (
        <WarehouseDialog
          open={showCreateDrawer}
          onClose={() => {
            setShowCreateDrawer(false);
            setEditingWarehouse(null);
          }}
          warehouse={editingWarehouse}
          onSuccess={() => {
            setShowCreateDrawer(false);
            setEditingWarehouse(null);
            queryClient.invalidateQueries({ queryKey: ['warehouses'] });
          }}
        />
      )}
    </div>
  );
};

interface WarehouseDialogProps {
  open: boolean;
  onClose: () => void;
  warehouse: Warehouse | null;
  onSuccess: () => void;
}

const WarehouseDialog = ({ open, onClose, warehouse, onSuccess }: WarehouseDialogProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: warehouse?.name || '',
    location: warehouse?.location || '',
    is_active: warehouse?.is_active !== undefined ? warehouse.is_active : true,
  });

  useEffect(() => {
    if (open) {
      setFormData({
        name: warehouse?.name || '',
        location: warehouse?.location || '',
        is_active: warehouse?.is_active !== undefined ? warehouse.is_active : true,
      });
    }
  }, [open, warehouse]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<Warehouse>) => {
      if (warehouse) {
        return warehousesApi.update(warehouse.id, data);
      }
      return warehousesApi.create(data);
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{warehouse ? t('warehouses.edit') : t('warehouses.addNew')}</DialogTitle>
        </DialogHeader>
        <form id="warehouse-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('warehouses.name')} *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('warehouses.location')} *</label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium">
              {t('status.active')}
            </label>
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="warehouse-form" disabled={createMutation.isPending}>
            {createMutation.isPending ? t('warehouses.saving') : warehouse ? t('common.update') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

