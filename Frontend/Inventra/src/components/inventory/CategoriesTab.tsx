/**
 * Categories Tab Component
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
import { categoriesApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Skeleton } from '../ui/skeleton';
import { CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { handleApiError } from '../../api/client';
import { Plus, Edit, Trash2, PackageX, AlertCircle, Search } from 'lucide-react';
import type { Category } from '../../types';

export const CategoriesTab = () => {
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const { t } = useLanguage();

  const canManage = role === 'Admin' || role === 'Storekeeper';

  // Fetch categories
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categories', search],
    queryFn: () =>
      categoriesApi.list({
        search: search || undefined,
      }).then(res => res.data),
  });

  const categories = categoriesData?.results || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('categories.title')}</h2>
        </div>
        {canManage && (
          <Button onClick={() => {
            setEditingCategory(null);
            setShowCreateDialog(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            {t('categories.create')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('categories.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('categories.title')}</CardTitle>
          <CardDescription>
            {categories.length} {t('categories.found')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <PackageX className="h-12 w-12 mb-2 opacity-50" />
              <p className="mb-4">{t('categories.noCategories')}</p>
              {canManage && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingCategory(null);
                    setShowCreateDialog(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('categories.createFirst')}
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('categories.name')}</TableHead>
                  <TableHead>{t('categories.itemsCount')}</TableHead>
                  {canManage && <TableHead>{t('items.actions')}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category: Category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      <Badge variant="info">{category.items_count || 0}</Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingCategory(category);
                              setShowCreateDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(t('categories.deleteConfirm'))) {
                                deleteMutation.mutate(category.id);
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
        <CategoryDialog
          open={showCreateDialog}
          onClose={() => {
            setShowCreateDialog(false);
            setEditingCategory(null);
          }}
          category={editingCategory}
          onSuccess={() => {
            setShowCreateDialog(false);
            setEditingCategory(null);
            queryClient.invalidateQueries({ queryKey: ['categories'] });
          }}
        />
      )}
    </div>
  );
};

interface CategoryDialogProps {
  open: boolean;
  onClose: () => void;
  category: Category | null;
  onSuccess: () => void;
}

const CategoryDialog = ({ open, onClose, category, onSuccess }: CategoryDialogProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: category?.name || '',
  });
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (open) {
      setFormData({
        name: category?.name || '',
      });
      setSubmitError('');
    }
  }, [open, category]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<Category>) => {
      if (category) {
        return categoriesApi.update(category.id, data);
      }
      return categoriesApi.create(data);
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
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) setSubmitError(''); onClose(); }}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{category ? t('categories.editCategory') : t('categories.addNew')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && (
            <Alert variant="destructive" className="rounded-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">{t('categories.name')} *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder={t('categories.namePlaceholder')}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? t('categories.saving') : category ? t('common.update') : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

