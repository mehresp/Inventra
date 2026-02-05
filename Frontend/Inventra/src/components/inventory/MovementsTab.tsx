/**
 * Movements Tab Component
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import { Select } from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { movementsApi, itemsApi, warehousesApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Skeleton } from '../ui/skeleton';
import { CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { handleApiError } from '../../api/client';
import { Plus, Search, ArrowLeftRight, PackageX, AlertCircle } from 'lucide-react';
import type { Movement } from '../../types';

export const MovementsTab = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const { t } = useLanguage();

  const canCreate = role === 'Admin' || role === 'Storekeeper';

  // Fetch movements
  const { data: movementsData, isLoading } = useQuery({
    queryKey: ['movements', search, typeFilter],
    queryFn: () =>
      movementsApi.list({
        search: search || undefined,
        type: typeFilter || undefined,
      }).then(res => res.data),
  });

  const movements = movementsData?.results || [];

  const movementTypes: Movement['type'][] = ['IN', 'OUT', 'ADJUST', 'RETURN', 'TRANSFER'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('movements.title')}</h2>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('movements.new')}
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
                placeholder={t('movements.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">{t('movements.allTypes')}</option>
                {movementTypes.map((type) => (
                  <option key={type} value={type}>
                    {t(`movements.type${type}`)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('movements.history')}</CardTitle>
          <CardDescription>
            {movements.length} {t('movements.found')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <PackageX className="h-12 w-12 mb-2 opacity-50" />
              <p>{t('movements.noMovements')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('movements.date')}</TableHead>
                  <TableHead>{t('movements.type')}</TableHead>
                  <TableHead>{t('movements.refNo')}</TableHead>
                  <TableHead>{t('common.item')}</TableHead>
                  <TableHead>{t('movements.from')}</TableHead>
                  <TableHead>{t('movements.to')}</TableHead>
                  <TableHead>{t('movements.quantity')}</TableHead>
                  <TableHead>{t('movements.actor')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell>{new Date(mov.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          mov.type === 'IN' ? 'success' : 
                          mov.type === 'OUT' ? 'danger' : 
                          'default'
                        }
                        className="flex items-center gap-1 w-fit"
                      >
                        <ArrowLeftRight className="h-3 w-3" />
                        {t(`movements.type${mov.type}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{mov.ref_no}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{mov.item_name}</div>
                        <div className="text-sm text-gray-500">{mov.item_code}</div>
                      </div>
                    </TableCell>
                    <TableCell>{mov.warehouse_from_name || t('common.none')}</TableCell>
                    <TableCell>{mov.warehouse_to_name || t('common.none')}</TableCell>
                    <TableCell>{mov.qty}</TableCell>
                    <TableCell>{mov.actor_username || mov.actor_full_name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {canCreate && (
        <NewMovementModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ['movements'] });
          }}
        />
      )}
    </div>
  );
};

interface NewMovementModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const NewMovementModal = ({ open, onClose, onSuccess }: NewMovementModalProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    type: 'IN' as Movement['type'],
    ref_type: 'OTHER' as Movement['ref_type'],
    ref_no: '',
    for_item: '',
    for_warehouse_from: '',
    for_warehouse_to: '',
    qty: 0,
    notes: '',
  });

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
  const { user } = useAuth();

  const [submitError, setSubmitError] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: Partial<Movement>) => movementsApi.create(data),
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
    
    if (formData.type === 'OUT' && !formData.for_warehouse_from) {
      setSubmitError(t('movements.sourceRequired'));
      return;
    }

    if (formData.type === 'TRANSFER' && (!formData.for_warehouse_from || !formData.for_warehouse_to)) {
      setSubmitError(t('movements.bothRequired'));
      return;
    }

    if (formData.type === 'RETURN' && (!formData.for_warehouse_from || !formData.for_warehouse_to)) {
      setSubmitError(t('movements.bothRequired'));
      return;
    }

    if (formData.type === 'IN' && !formData.for_warehouse_to) {
      setSubmitError(t('movements.destRequired'));
      return;
    }

    if (formData.type === 'ADJUST' && !formData.for_warehouse_from) {
      setSubmitError(t('movements.sourceRequired'));
      return;
    }

    createMutation.mutate({
      ...formData,
      for_item: Number(formData.for_item),
      for_warehouse_from: formData.for_warehouse_from ? Number(formData.for_warehouse_from) : undefined,
      for_warehouse_to: formData.for_warehouse_to ? Number(formData.for_warehouse_to) : undefined,
      for_actor: user?.id,
      ref_no: formData.ref_no || `MOV-${Date.now()}`,
      qty: Number(formData.qty), // Ensure qty is a number, not Decimal
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) setSubmitError(''); onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t('movements.recordNew')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && (
            <Alert variant="destructive" className="rounded-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
        <div>
          <label className="block text-sm font-medium mb-1">{t('movements.type')} *</label>
          <Select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as Movement['type'] })}
            required
          >
            <option value="IN">{t('movements.typeIN')}</option>
            <option value="OUT">{t('movements.typeOUT')}</option>
            <option value="ADJUST">{t('movements.typeADJUST')}</option>
            <option value="RETURN">{t('movements.typeRETURN')}</option>
            <option value="TRANSFER">{t('movements.typeTRANSFER')}</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t('common.item')} *</label>
          <Select
            value={formData.for_item}
            onChange={(e) => setFormData({ ...formData, for_item: e.target.value })}
            required
          >
            <option value="">{t('movements.selectItem')}</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.code} - {item.name}
              </option>
            ))}
          </Select>
        </div>

        {formData.type === 'IN' && (
          <div>
            <label className="block text-sm font-medium mb-1">{t('movements.toWarehouse')} *</label>
            <Select
              value={formData.for_warehouse_to}
              onChange={(e) => setFormData({ ...formData, for_warehouse_to: e.target.value })}
              required
            >
              <option value="">{t('movements.selectWarehouse')}</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        {formData.type === 'OUT' && (
          <div>
            <label className="block text-sm font-medium mb-1">{t('movements.fromWarehouse')} *</label>
            <Select
              value={formData.for_warehouse_from}
              onChange={(e) => setFormData({ ...formData, for_warehouse_from: e.target.value })}
              required
            >
              <option value="">{t('movements.selectWarehouse')}</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        {formData.type === 'TRANSFER' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">{t('movements.fromWarehouse')} *</label>
              <Select
                value={formData.for_warehouse_from}
                onChange={(e) => setFormData({ ...formData, for_warehouse_from: e.target.value })}
                required
              >
                <option value="">{t('movements.selectWarehouse')}</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('movements.toWarehouse')} *</label>
              <Select
                value={formData.for_warehouse_to}
                onChange={(e) => setFormData({ ...formData, for_warehouse_to: e.target.value })}
                required
              >
                <option value="">{t('movements.selectWarehouse')}</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))}
              </Select>
            </div>
          </>
        )}

        {formData.type === 'ADJUST' && (
          <div>
            <label className="block text-sm font-medium mb-1">{t('movements.fromWarehouse')} *</label>
            <Select
              value={formData.for_warehouse_from}
              onChange={(e) => setFormData({ ...formData, for_warehouse_from: e.target.value })}
              required
            >
              <option value="">{t('movements.selectWarehouse')}</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        {formData.type === 'RETURN' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">{t('movements.fromWarehouse')} *</label>
              <Select
                value={formData.for_warehouse_from}
                onChange={(e) => setFormData({ ...formData, for_warehouse_from: e.target.value })}
                required
              >
                <option value="">{t('movements.selectWarehouse')}</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('movements.toWarehouse')} *</label>
              <Select
                value={formData.for_warehouse_to}
                onChange={(e) => setFormData({ ...formData, for_warehouse_to: e.target.value })}
                required
              >
                <option value="">{t('movements.selectWarehouse')}</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))}
              </Select>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">{t('movements.quantity')} *</label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={formData.qty}
            onChange={(e) => setFormData({ ...formData, qty: Number(e.target.value) })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t('movements.referenceNo')}</label>
          <Input
            value={formData.ref_no}
            onChange={(e) => setFormData({ ...formData, ref_no: e.target.value })}
            placeholder={t('movements.autoGenerated')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t('movements.notes')}</label>
          <textarea
            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
            <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? t('movements.creating') : t('common.create')}
          </Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

