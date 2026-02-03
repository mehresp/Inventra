/**
 * Items Tab Component
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Select } from '../ui/select';
import { Badge } from '../ui/badge';
import { itemsApi, categoriesApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import { handleApiError } from '../../api/client';
import { Plus, Search, Edit, Trash2, PackageX, AlertCircle } from 'lucide-react';
import type { Item } from '../../types';

export const ItemsTab = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const { t } = useLanguage();

  const canManage = role === 'Admin' || role === 'Storekeeper';

  // Fetch items
  const { data: itemsData, isLoading } = useQuery({
    queryKey: ['items', search, selectedCategory],
    queryFn: () =>
      itemsApi.list({
        search: search || undefined,
        category: selectedCategory,
      }).then(res => res.data),
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then(res => res.data),
  });

  const items = itemsData?.results || [];
  const categories = categoriesData?.results || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => itemsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('items.title')}</h2>
        </div>
        {canManage && (
          <Button onClick={() => {
            setEditingItem(null);
            setShowCreateDrawer(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            {t('items.create')}
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
                placeholder={t('items.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div>
              <Select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">{t('common.allCategories')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('items.title')}</CardTitle>
          <CardDescription>
            {items.length} {t('common.item')}{items.length !== 1 ? 's' : ''} {t('common.found')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <PackageX className="h-12 w-12 mb-2 opacity-50" />
              <p className="mb-4">{t('items.noItems')}</p>
              {canManage && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingItem(null);
                    setShowCreateDrawer(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('items.create')}
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('items.itemCode')}</TableHead>
                  <TableHead>{t('items.itemName')}</TableHead>
                  <TableHead>{t('items.category')}</TableHead>
                  <TableHead>{t('items.unit')}</TableHead>
                  <TableHead>{t('items.currentStock')}</TableHead>
                  <TableHead>{t('items.minStock')}</TableHead>
                  <TableHead>{t('requisitions.status')}</TableHead>
                  {canManage && <TableHead>{t('items.actions')}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item: Item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono">{item.code}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category_name}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{item.current_stock ?? 'N/A'}</TableCell>
                    <TableCell>{item.min_stock}</TableCell>
                    <TableCell>
                      {item.is_below_min ? (
                        <Badge variant="danger">{t('status.belowMin')}</Badge>
                      ) : (
                        <Badge variant="success">{t('status.ok')}</Badge>
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingItem(item);
                              setShowCreateDrawer(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(t('items.deleteConfirm'))) {
                                deleteMutation.mutate(item.id);
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

      <ItemDialog
        open={showCreateDrawer}
        onClose={() => {
          setShowCreateDrawer(false);
          setEditingItem(null);
        }}
        item={editingItem}
        categories={categories}
        onSuccess={() => {
          setShowCreateDrawer(false);
          setEditingItem(null);
          queryClient.invalidateQueries({ queryKey: ['items'] });
        }}
      />
    </div>
  );
};

interface ItemDialogProps {
  open: boolean;
  onClose: () => void;
  item: Item | null;
  categories: any[];
  onSuccess: () => void;
}

const ItemDialog = ({ open, onClose, item, categories, onSuccess }: ItemDialogProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    code: item?.code || '',
    name: item?.name || '',
    unit: item?.unit || '',
    current_stock: item?.current_stock || 0,
    min_stock: item?.min_stock || 0,
    for_category: item?.for_category || '',
    is_active: item?.is_active !== undefined ? item.is_active : true,
  });

  useEffect(() => {
    if (open) {
      setFormData({
        code: item?.code || '',
        name: item?.name || '',
        unit: item?.unit || '',
        current_stock: item?.current_stock || 0,
        min_stock: item?.min_stock || 0,
        for_category: item?.for_category || '',
        is_active: item?.is_active !== undefined ? item.is_active : true,
      });
    }
  }, [open, item]);

  const [submitError, setSubmitError] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: Partial<Item>) => {
      if (item) {
        return itemsApi.update(item.id, data);
      }
      return itemsApi.create(data);
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
    createMutation.mutate({
      ...formData,
      for_category: Number(formData.for_category),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) setSubmitError(''); onClose(); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{item ? t('items.editItem') : t('items.addNew')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && (
            <Alert variant="destructive" className="rounded-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">{t('items.itemCode')} *</label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              disabled={!!item}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('items.itemName')} *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('items.unit')} *</label>
            <Input
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('items.currentStock')}</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.current_stock}
              onChange={(e) => setFormData({ ...formData, current_stock: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('items.minStock')} *</label>
            <Input
              type="number"
              min="0"
              value={formData.min_stock}
              onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('items.category')} *</label>
            <Select
              value={formData.for_category}
              onChange={(e) => setFormData({ ...formData, for_category: e.target.value })}
              required
            >
              <option value="">{t('items.selectCategory')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? t('items.saving') : item ? t('common.update') : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

