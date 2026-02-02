/**
 * Inventory Count Page - با Wizard
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Calculator, Plus, Upload, CheckCircle, XCircle, ArrowLeft, AlertTriangle, PackageX } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Wizard, WizardStep } from '../components/ui/wizard';
import { inventoryCountsApi, warehousesApi, itemsApi } from '../api/endpoints';
import { useLanguage } from '../context/LanguageContext';
import type { InventoryCount } from '../types';

type WizardStepType = 'list' | 'start' | 'import' | 'validate' | 'close';

export const InventoryCountPage = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [wizardStep, setWizardStep] = useState<WizardStepType>('list');
  const [selectedCount, setSelectedCount] = useState<InventoryCount | null>(null);
  const [startData, setStartData] = useState({ warehouseId: '', period: '' });
  const [importData, setImportData] = useState<Array<{ item_code: string; counted_qty: number }>>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Fetch warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehousesApi.list().then(res => res.data),
  });

  // Fetch inventory counts
  const { data: countsData } = useQuery({
    queryKey: ['inventory-counts'],
    queryFn: () => inventoryCountsApi.list().then(res => res.data),
  });

  // Fetch items for import
  const { data: itemsData } = useQuery({
    queryKey: ['items'],
    queryFn: () => itemsApi.list().then(res => res.data),
  });

  // Fetch count details when selected
  const { data: countDetails } = useQuery({
    queryKey: ['inventory-counts', selectedCount?.id],
    queryFn: () => inventoryCountsApi.get(selectedCount!.id).then(res => res.data),
    enabled: !!selectedCount && wizardStep !== 'list',
  });

  const warehouses = warehousesData?.results || [];
  const counts = countsData?.results || [];
  const items = itemsData?.results || [];
  const count = countDetails || selectedCount;

  const startMutation = useMutation({
    mutationFn: ({ warehouseId, period }: { warehouseId: number; period: string }) =>
      inventoryCountsApi.start(warehouseId, period),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-counts'] });
      setSelectedCount(data.data);
      setWizardStep('import');
    },
  });

  const importMutation = useMutation({
    mutationFn: (countData: Array<{ item_id?: number; item_code?: string; counted_qty: number }>) =>
      inventoryCountsApi.importData(selectedCount!.id, countData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-counts', selectedCount?.id] });
      setWizardStep('validate');
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: number) => inventoryCountsApi.close(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-counts'] });
      setWizardStep('list');
      setSelectedCount(null);
    },
  });

  const handleStart = () => {
    if (startData.warehouseId && startData.period) {
      startMutation.mutate({
        warehouseId: Number(startData.warehouseId),
        period: startData.period,
      });
    }
  };

  const handleImport = () => {
    // Validate import data
    const errors: string[] = [];
    const validData: Array<{ item_id?: number; item_code?: string; counted_qty: number }> = [];

    importData.forEach((row, idx) => {
      if (!row.item_code) {
        errors.push(`${t('inventoryCount.row')} ${idx + 1}: ${t('inventoryCount.itemCodeRequired')}`);
        return;
      }
      if (row.counted_qty < 0) {
        errors.push(`${t('inventoryCount.row')} ${idx + 1}: ${t('inventoryCount.quantityCannotBeNegative')}`);
        return;
      }
      const item = items.find((i) => i.code === row.item_code);
      if (!item) {
        errors.push(`${t('inventoryCount.row')} ${idx + 1}: ${t('inventoryCount.itemNotFound').replace('{code}', row.item_code)}`);
        return;
      }
      validData.push({
        item_id: item.id,
        item_code: row.item_code,
        counted_qty: row.counted_qty,
      });
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    importMutation.mutate(validData);
  };

  const handleClose = () => {
    if (selectedCount && confirm(t('inventoryCount.closeConfirm'))) {
      closeMutation.mutate(selectedCount.id);
    }
  };

  const addImportRow = () => {
    setImportData([...importData, { item_code: '', counted_qty: 0 }]);
  };

  const removeImportRow = (index: number) => {
    setImportData(importData.filter((_, i) => i !== index));
  };

  const updateImportRow = (index: number, field: string, value: any) => {
    const newData = [...importData];
    newData[index] = { ...newData[index], [field]: value };
    setImportData(newData);
  };


  if (wizardStep === 'list') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">{t('inventoryCount.title')}</h1>
          </div>
          <Button onClick={() => setWizardStep('start')}>
            <Plus className="mr-2 h-4 w-4" />
            {t('inventoryCount.startNew')}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('inventoryCount.counts')}</CardTitle>
            <CardDescription>
              {counts.length} {t('inventoryCount.countFound')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {counts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <PackageX className="h-12 w-12 mb-2 opacity-50" />
                <p className="mb-4">{t('inventoryCount.noCounts')}</p>
                <Button variant="outline" onClick={() => setWizardStep('start')}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('inventoryCount.startFirst')}
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('inventoryCount.period')}</TableHead>
                    <TableHead>{t('inventoryCount.warehouse')}</TableHead>
                    <TableHead>{t('inventoryCount.status')}</TableHead>
                    <TableHead>{t('inventoryCount.startedAt')}</TableHead>
                    <TableHead>{t('inventoryCount.discrepancies')}</TableHead>
                    <TableHead>{t('inventoryCount.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {counts.map((count) => (
                    <TableRow key={count.id}>
                      <TableCell>{count.period}</TableCell>
                      <TableCell>{count.warehouse_name}</TableCell>
                      <TableCell>
                        {count.status === 'Open' ? (
                          <Badge variant="warning">{t('inventoryCount.open')}</Badge>
                        ) : (
                          <Badge variant="success">{t('inventoryCount.closed')}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{new Date(count.started_at).toLocaleDateString()}</TableCell>
                      <TableCell>{count.discrepancies_count || 0}</TableCell>
                      <TableCell>
                        {count.status === 'Open' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedCount(count);
                              setWizardStep('import');
                            }}
                          >
                            {t('inventoryCount.continue')}
                          </Button>
                        )}
                        {count.status === 'Closed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCount(count);
                              setWizardStep('validate');
                            }}
                          >
                            {t('inventoryCount.view')}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const steps = [
    { label: t('inventoryCount.start'), description: t('inventoryCount.selectWarehousePeriod') },
    { label: t('inventoryCount.importData'), description: t('inventoryCount.uploadCountData') },
    { label: t('inventoryCount.validate'), description: t('inventoryCount.reviewDiscrepancies') },
    { label: t('inventoryCount.close'), description: t('inventoryCount.generateAdjustments') },
  ];

  let currentStepNumber = 1;
  if (wizardStep === 'start') currentStepNumber = 1;
  else if (wizardStep === 'import') currentStepNumber = 2;
  else if (wizardStep === 'validate') currentStepNumber = 3;
  else if (wizardStep === 'close') currentStepNumber = 4;

  return (
    <div className="w-full h-full overflow-y-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">{t('inventoryCount.title')}</h1>
        </div>
        <Button variant="outline" onClick={() => {
          setWizardStep('list');
          setSelectedCount(null);
          setStartData({ warehouseId: '', period: '' });
          setImportData([]);
          setValidationErrors([]);
        }}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('inventoryCount.backToList')}
        </Button>
      </div>

      <Wizard currentStep={currentStepNumber} steps={steps}>
        {/* Step 1: Start */}
        <WizardStep step={1} currentStep={currentStepNumber}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                {t('inventoryCount.startNew')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('inventoryCount.selectWarehouse')} *</label>
                <Select
                  value={startData.warehouseId}
                  onChange={(e) => setStartData({ ...startData, warehouseId: e.target.value })}
                  required
                >
                  <option value="">{t('inventoryCount.selectWarehouse')}</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('inventoryCount.period')} *</label>
                <Input
                  value={startData.period}
                  onChange={(e) => setStartData({ ...startData, period: e.target.value })}
                  placeholder={t('inventoryCount.periodPlaceholder')}
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleStart}
                  disabled={!startData.warehouseId || !startData.period || startMutation.isPending}
                  className="flex-1"
                >
                  {startMutation.isPending ? t('inventoryCount.starting') : t('inventoryCount.startCount')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </WizardStep>

        {/* Step 2: Import */}
        <WizardStep step={2} currentStep={currentStepNumber}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                {t('inventoryCount.importCountData')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {validationErrors.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <h4 className="font-medium text-destructive">{t('inventoryCount.validationErrors')}</h4>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-destructive/80">
                    {validationErrors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium">{t('inventoryCount.countData')}</label>
                  <Button variant="outline" size="sm" onClick={addImportRow}>
                    {t('inventoryCount.addRow')}
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('inventoryCount.itemCode')}</TableHead>
                      <TableHead>{t('inventoryCount.countedQty')}</TableHead>
                      <TableHead>{t('items.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-gray-500 py-4">
                          {t('inventoryCount.noDataEntered')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      importData.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Input
                              value={row.item_code}
                              onChange={(e) => updateImportRow(idx, 'item_code', e.target.value)}
                              placeholder={t('inventoryCount.itemCodePlaceholder')}
                              list={`items-list-${idx}`}
                            />
                            <datalist id={`items-list-${idx}`}>
                              {items.map((item) => (
                                <option key={item.id} value={item.code} />
                              ))}
                            </datalist>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.counted_qty}
                              onChange={(e) => updateImportRow(idx, 'counted_qty', Number(e.target.value))}
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeImportRow(idx)}
                            >
                              {t('inventoryCount.remove')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setWizardStep('start')}
                  className="flex-1"
                >
                  {t('inventoryCount.back')}
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importData.length === 0 || importMutation.isPending}
                  className="flex-1"
                >
                  {importMutation.isPending ? t('inventoryCount.submitting') : t('inventoryCount.submitData')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </WizardStep>

        {/* Step 3: Validate */}
        <WizardStep step={3} currentStep={currentStepNumber}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {t('inventoryCount.validateDiscrepancies')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {count && count.lines && count.lines.length > 0 ? (
                <>
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-primary" />
                      <p className="text-sm">
                        {t('inventoryCount.foundDiscrepancies').replace('{count}', String(count.discrepancies_count || 0))}
                      </p>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('inventoryCount.itemCode')}</TableHead>
                        <TableHead>{t('items.itemName')}</TableHead>
                        <TableHead>{t('inventoryCount.systemQty')}</TableHead>
                        <TableHead>{t('inventoryCount.countedQty')}</TableHead>
                        <TableHead>{t('inventoryCount.delta')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {count.lines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell className="font-mono">{line.item_code}</TableCell>
                          <TableCell>{line.item_name}</TableCell>
                          <TableCell>{line.system_qty} {line.item_unit}</TableCell>
                          <TableCell>{line.counted_qty} {line.item_unit}</TableCell>
                          <TableCell>
                            {line.delta !== 0 ? (
                              <Badge variant={line.delta > 0 ? 'success' : 'danger'}>
                                {line.delta > 0 ? '+' : ''}{line.delta} {line.item_unit}
                              </Badge>
                            ) : (
                              <Badge variant="success">{t('inventoryCount.noChange')}</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {t('inventoryCount.noDiscrepancies')}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setWizardStep('import')}
                  className="flex-1"
                >
                  {t('inventoryCount.back')}
                </Button>
                {count && count.status === 'Open' && (
                  <Button
                    onClick={() => setWizardStep('close')}
                    className="flex-1"
                  >
                    {t('inventoryCount.proceedToClose')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </WizardStep>

        {/* Step 4: Close */}
        <WizardStep step={4} currentStep={currentStepNumber}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                {t('inventoryCount.closeCount')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                  <p className="text-sm">
                    <strong>{t('common.warning')}:</strong> {t('inventoryCount.warningClose')}
                  </p>
                </div>
              </div>

              {count && (
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t('inventoryCount.period')}</label>
                    <p className="text-base">{count.period}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t('inventoryCount.warehouse')}</label>
                    <p className="text-base">{count.warehouse_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">{t('inventoryCount.discrepancies')}</label>
                    <p className="text-base">{count.discrepancies_count || 0} {t('common.items')}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setWizardStep('validate')}
                  className="flex-1"
                >
                  {t('inventoryCount.back')}
                </Button>
                <Button
                  onClick={handleClose}
                  disabled={closeMutation.isPending}
                  variant="destructive"
                  className="flex-1"
                >
                  {closeMutation.isPending ? t('inventoryCount.closing') : t('inventoryCount.closeCount')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </WizardStep>
      </Wizard>
    </div>
  );
};
