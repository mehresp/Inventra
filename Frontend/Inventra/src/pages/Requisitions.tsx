/**
 * Requisitions Page - Split View
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Select } from '../components/ui/select';
import { requisitionsApi, itemsApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CardDescription } from '../components/ui/card';
import { FileText, Plus, Building2, Calendar, PackageX, Package } from 'lucide-react';
import type { Requisition } from '../types';

export const RequisitionsPage = () => {
  const { role } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedRequisition, setSelectedRequisition] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFulfillModal, setShowFulfillModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingReq, setRejectingReq] = useState<Requisition | null>(null);
  const [fulfillingReq, setFulfillingReq] = useState<Requisition | null>(null);

  const canCreate = role === 'Admin' || role === 'Requester';
  const canApprove = role === 'Admin' || role === 'Storekeeper';
  const canFulfill = role === 'Admin' || role === 'Storekeeper';

  // Fetch requisitions
  const { data: requisitionsData } = useQuery({
    queryKey: ['requisitions', statusFilter],
    queryFn: () => requisitionsApi.list({ status: statusFilter || undefined }).then(res => res.data),
  });

  // Fetch selected requisition details
  const { data: selectedReqData } = useQuery({
    queryKey: ['requisitions', selectedRequisition],
    queryFn: () => requisitionsApi.get(selectedRequisition!).then(res => res.data),
    enabled: !!selectedRequisition,
  });

  const requisitions = requisitionsData?.results || [];
  const selectedReq = selectedReqData || requisitions.find((r) => r.id === selectedRequisition);

  const getStatusBadge = (status: Requisition['status']) => {
    const variants = {
      Draft: 'default' as const,
      Pending: 'warning' as const,
      Approved: 'success' as const,
      Rejected: 'danger' as const,
      Fulfilled: 'info' as const,
    };
    const statusLabels: Record<string, string> = {
      Draft: t('requisitions.draft'),
      Pending: t('requisitions.pending'),
      Approved: t('requisitions.approved'),
      Rejected: t('requisitions.rejected'),
      Fulfilled: t('requisitions.fulfilled'),
    };
    return <Badge variant={variants[status]}>{statusLabels[status] || status}</Badge>;
  };

  const approveMutation = useMutation({
    mutationFn: (id: number) => requisitionsApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      if (selectedRequisition) {
        queryClient.invalidateQueries({ queryKey: ['requisitions', selectedRequisition] });
      }
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      requisitionsApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      if (selectedRequisition) {
        queryClient.invalidateQueries({ queryKey: ['requisitions', selectedRequisition] });
      }
      setShowRejectModal(false);
      setRejectingReq(null);
    },
  });

  const fulfillMutation = useMutation({
    mutationFn: (id: number) => requisitionsApi.fulfill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requisitions'] });
      if (selectedRequisition) {
        queryClient.invalidateQueries({ queryKey: ['requisitions', selectedRequisition] });
      }
      setShowFulfillModal(false);
      setFulfillingReq(null);
    },
  });

  return (
    <div className="h-full w-full flex flex-col space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">{t('requisitions.title')}</h1>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            {t('requisitions.create')}
          </Button>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 overflow-hidden min-h-0">
        {/* Left Panel - List */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{t('requisitions.title')}</CardTitle>
                <CardDescription>
                  {requisitions.length} {t('requisitions.found')}
                </CardDescription>
              </div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-40"
              >
                <option value="">{t('requisitions.allStatus')}</option>
                <option value="Draft">{t('requisitions.draft')}</option>
                <option value="Pending">{t('requisitions.pending')}</option>
                <option value="Approved">{t('requisitions.approved')}</option>
                <option value="Rejected">{t('requisitions.rejected')}</option>
                <option value="Fulfilled">{t('requisitions.fulfilled')}</option>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            <div className="divide-y">
              {requisitions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <PackageX className="h-12 w-12 mb-2 opacity-50" />
                  <p>{t('requisitions.noRequisitions')}</p>
                </div>
              ) : (
                requisitions.map((req) => (
                  <div
                    key={req.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedRequisition === req.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedRequisition(req.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="font-semibold flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {req.req_no}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{req.requester_username}</div>
                      </div>
                      {getStatusBadge(req.status)}
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        {req.dept_lab}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {t('common.neededBy')}: {new Date(req.needed_by).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Package className="h-3 w-3" />
                        {req.items_count || 0} {t('common.items')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Details */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader>
            <CardTitle>{t('common.details')}</CardTitle>
            <CardDescription>
              {selectedReq ? `${t('requisitions.viewing')} ${selectedReq.req_no}` : t('requisitions.selectToView')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {selectedReq ? (
              <RequisitionDetails
                requisition={selectedReq}
                canApprove={canApprove}
                canFulfill={canFulfill}
                onApprove={() => approveMutation.mutate(selectedReq.id)}
                onReject={() => {
                  setRejectingReq(selectedReq);
                  setShowRejectModal(true);
                }}
                onFulfill={() => {
                  setFulfillingReq(selectedReq);
                  setShowFulfillModal(true);
                }}
                isApproving={approveMutation.isPending}
                isRejecting={rejectMutation.isPending}
                isFulfilling={fulfillMutation.isPending}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                {t('requisitions.selectToView')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {canCreate && (
        <CreateRequisitionModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ['requisitions'] });
          }}
        />
      )}

      {showFulfillModal && fulfillingReq && (
        <FulfillRequisitionModal
          open={showFulfillModal}
          onClose={() => {
            setShowFulfillModal(false);
            setFulfillingReq(null);
          }}
          requisition={fulfillingReq}
          onFulfill={() => fulfillMutation.mutate(fulfillingReq.id)}
          isFulfilling={fulfillMutation.isPending}
        />
      )}

      {showRejectModal && rejectingReq && (
        <RejectRequisitionModal
          open={showRejectModal}
          onClose={() => {
            setShowRejectModal(false);
            setRejectingReq(null);
          }}
          requisition={rejectingReq}
          onReject={(reason) => rejectMutation.mutate({ id: rejectingReq.id, reason })}
          isRejecting={rejectMutation.isPending}
        />
      )}
    </div>
  );
};

interface RequisitionDetailsProps {
  requisition: Requisition;
  canApprove: boolean;
  canFulfill: boolean;
  onApprove: () => void;
  onReject: () => void;
  onFulfill: () => void;
  isApproving: boolean;
  isRejecting: boolean;
  isFulfilling: boolean;
}

const RequisitionDetails = ({
  requisition,
  canApprove,
  canFulfill,
  onApprove,
  onReject,
  onFulfill,
  isApproving,
  isRejecting,
  isFulfilling,
}: RequisitionDetailsProps) => {
  const { t } = useLanguage();
  
  // Fetch items to get item names and codes
  const { data: itemsData } = useQuery({
    queryKey: ['items'],
    queryFn: () => itemsApi.list().then(res => res.data),
  });
  
  const items = itemsData?.results || [];
  
  const getItemInfo = (itemId: number) => {
    const item = items.find((i) => i.id === itemId);
    return item ? { name: item.name, code: item.code, unit: item.unit } : { name: '', code: '', unit: '' };
  };
  const getStatusBadge = (status: Requisition['status']) => {
    const variants = {
      Draft: 'default' as const,
      Pending: 'warning' as const,
      Approved: 'success' as const,
      Rejected: 'danger' as const,
      Fulfilled: 'info' as const,
    };
    const statusLabels: Record<string, string> = {
      Draft: t('requisitions.draft'),
      Pending: t('requisitions.pending'),
      Approved: t('requisitions.approved'),
      Rejected: t('requisitions.rejected'),
      Fulfilled: t('requisitions.fulfilled'),
    };
    return <Badge variant={variants[status]}>{statusLabels[status] || status}</Badge>;
  };

  // Timeline
  const timeline: Array<{ label: string; date: string }> = [
    { label: 'Created', date: new Date(requisition.created_at).toLocaleString() },
    ...(requisition.for_approved_by ? [{
      label: requisition.status === 'Approved' ? 'Approved' : 'Rejected',
      date: requisition.approver_username || '',
    }] : []),
    ...(requisition.fulfilled_at ? [{
      label: 'Fulfilled',
      date: new Date(requisition.fulfilled_at).toLocaleString(),
    }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-2xl font-bold">{requisition.req_no}</h2>
            <p className="text-sm text-gray-500">by {requisition.requester_username}</p>
          </div>
          {getStatusBadge(requisition.status)}
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">{t('requisitions.departmentLab')}</label>
          <p className="text-base">{requisition.dept_lab}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">{t('common.neededBy')}</label>
          <p className="text-base">{new Date(requisition.needed_by).toLocaleDateString()}</p>
        </div>
        {requisition.approver_username && (
          <div>
            <label className="text-sm font-medium text-gray-500">{t('requisitions.approvedBy')}</label>
            <p className="text-base">{requisition.approver_username}</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div>
        <h3 className="font-semibold mb-2">{t('requisitions.timeline')}</h3>
        <div className="space-y-2">
          {timeline.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="font-medium">{item.label === 'Created' ? t('requisitions.created') : item.label === 'Approved' ? t('requisitions.approved') : item.label === 'Rejected' ? t('requisitions.rejected') : item.label === 'Fulfilled' ? t('requisitions.fulfilled') : item.label}:</span>
              <span className="text-gray-600">{item.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lines */}
      <div>
        <h3 className="font-semibold mb-2">{t('requisitions.items')}</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common.item')}</TableHead>
              <TableHead>{t('requisitions.requested')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requisition.lines?.map((line) => {
              const itemInfo = getItemInfo(line.for_item);
              const itemName = line.item_name || itemInfo.name;
              const itemCode = line.item_code || itemInfo.code;
              const itemUnit = line.item_unit || itemInfo.unit;
              
              return (
                <TableRow key={line.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{itemName || `Item #${line.for_item}`}</div>
                      {itemCode && <div className="text-sm text-gray-500">{itemCode}</div>}
                    </div>
                  </TableCell>
                  <TableCell>{line.requested_qty} {itemUnit || ''}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Notes */}
      {requisition.notes && (
        <div>
          <label className="text-sm font-medium text-gray-500">{t('requisitions.notes')}</label>
          <p className="text-base bg-gray-50 p-3 rounded">{requisition.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        {canApprove && requisition.status === 'Pending' && (
          <>
            <Button onClick={onApprove} disabled={isApproving} className="flex-1">
              {isApproving ? t('requisitions.approving') : t('requisitions.approve')}
            </Button>
            <Button
              variant="destructive"
              onClick={onReject}
              disabled={isRejecting}
              className="flex-1"
            >
              {isRejecting ? t('requisitions.rejecting') : t('requisitions.reject')}
            </Button>
          </>
        )}
        {canFulfill && requisition.status === 'Approved' && (
          <Button onClick={onFulfill} disabled={isFulfilling} className="flex-1">
            {isFulfilling ? t('requisitions.fulfilling') : t('requisitions.fulfill')}
          </Button>
        )}
      </div>
    </div>
  );
};

interface CreateRequisitionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateRequisitionModal = ({ open, onClose, onSuccess }: CreateRequisitionModalProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    dept_lab: '',
    needed_by: '',
    notes: '',
    lines: [{ for_item: '', requested_qty: 0 }] as Array<{ for_item: string; requested_qty: number }>,
  });

  const { data: itemsData } = useQuery({
    queryKey: ['items'],
    queryFn: () => itemsApi.list().then(res => res.data),
  });

  const items = itemsData?.results || [];
  const { user } = useAuth();

  const createMutation = useMutation({
    mutationFn: (data: Partial<Requisition>) => requisitionsApi.create(data),
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      for_requester: user?.id,
      needed_by: formData.needed_by || new Date().toISOString(),
      lines: formData.lines
        .filter((line) => line.for_item && line.requested_qty > 0)
        .map((line, index) => ({
          id: index + 1,
          for_item: Number(line.for_item),
          requested_qty: line.requested_qty,
          approved_qty: 0,
          issued_qty: 0,
        })),
    });
  };

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { for_item: '', requested_qty: 0 }],
    });
  };

  const removeLine = (index: number) => {
    setFormData({
      ...formData,
      lines: formData.lines.filter((_, i) => i !== index),
    });
  };

  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setFormData({ ...formData, lines: newLines });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t('requisitions.create')}</DialogTitle>
        </DialogHeader>
      <form id="create-req-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('requisitions.departmentLab')} *</label>
          <Input
            value={formData.dept_lab}
            onChange={(e) => setFormData({ ...formData, dept_lab: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('common.neededBy')} *</label>
          <Input
            type="date"
            value={formData.needed_by}
            onChange={(e) => setFormData({ ...formData, needed_by: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('requisitions.notes')}</label>
          <textarea
            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">{t('requisitions.items')} *</label>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              {t('requisitions.addItem')}
            </Button>
          </div>
          <div className="space-y-2">
            {formData.lines.map((line, idx) => (
              <div key={idx} className="flex gap-2">
                <Select
                  value={line.for_item}
                  onChange={(e) => updateLine(idx, 'for_item', e.target.value)}
                  className="flex-1"
                  required
                >
                  <option value="">{t('movements.selectItem')}</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} - {item.name}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={line.requested_qty}
                  onChange={(e) => updateLine(idx, 'requested_qty', Number(e.target.value))}
                  placeholder={t('requisitions.quantity')}
                  className="w-24"
                  required
                />
                {formData.lines.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeLine(idx)}
                  >
                    ✕
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="create-req-form" disabled={createMutation.isPending}>
            {createMutation.isPending ? t('requisitions.creating') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface FulfillRequisitionModalProps {
  open: boolean;
  onClose: () => void;
  requisition: Requisition;
  onFulfill: () => void;
  isFulfilling: boolean;
}

const FulfillRequisitionModal = ({
  open,
  onClose,
  requisition,
  onFulfill,
  isFulfilling,
}: FulfillRequisitionModalProps) => {
  const { t } = useLanguage();
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('requisitions.fulfill')}</DialogTitle>
          <DialogDescription>
            {t('requisitions.confirmFulfillment')}
          </DialogDescription>
        </DialogHeader>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {t('requisitions.fulfillDescription')}
        </p>
        <div>
          <h4 className="font-medium mb-2">{t('requisitions.itemsToBeIssued')}:</h4>
          <ul className="space-y-1">
            {requisition.lines?.map((line) => (
              <li key={line.id} className="text-sm">
                {line.item_name}: {line.approved_qty} {line.item_unit}
              </li>
            ))}
          </ul>
        </div>
      </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onFulfill} disabled={isFulfilling}>
            {isFulfilling ? t('requisitions.fulfilling') : t('requisitions.confirmFulfill')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface RejectRequisitionModalProps {
  open: boolean;
  onClose: () => void;
  requisition: Requisition;
  onReject: (reason?: string) => void;
  isRejecting: boolean;
}

const RejectRequisitionModal = ({
  open,
  onClose,
  onReject,
  isRejecting,
}: RejectRequisitionModalProps) => {
  const { t } = useLanguage();
  const [reason, setReason] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReject(reason || undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('requisitions.reject')}</DialogTitle>
          <DialogDescription>
            {t('requisitions.rejectionReason')}
          </DialogDescription>
        </DialogHeader>
        <form id="reject-req-form" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('requisitions.rejectionReason')}
              </label>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('requisitions.rejectionReason')}
              />
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button 
            type="submit" 
            form="reject-req-form" 
            variant="destructive"
            disabled={isRejecting}
          >
            {isRejecting ? t('requisitions.rejecting') : t('requisitions.reject')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
