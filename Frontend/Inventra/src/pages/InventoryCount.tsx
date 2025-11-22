/**
 * Inventory Count Page
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { inventoryCountsApi, warehousesApi } from '../api/endpoints';

export const InventoryCountPage = () => {
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
  const [period, setPeriod] = useState('');
  const queryClient = useQueryClient();

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

  const warehouses = warehousesData?.results || [];
  const counts = countsData?.results || [];

  const startMutation = useMutation({
    mutationFn: ({ warehouseId, period }: { warehouseId: number; period: string }) =>
      inventoryCountsApi.start(warehouseId, period),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-counts'] });
      setPeriod('');
      setSelectedWarehouse(null);
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: number) => inventoryCountsApi.close(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory-counts'] }),
  });

  const handleStart = () => {
    if (selectedWarehouse && period) {
      startMutation.mutate({ warehouseId: selectedWarehouse, period });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Inventory Count</h1>

      {/* Start Count Form */}
      <Card>
        <CardHeader>
          <CardTitle>Start New Count</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Warehouse</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedWarehouse || ''}
                onChange={(e) => setSelectedWarehouse(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Select Warehouse</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Period</label>
              <Input
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="e.g., 2024-Q1"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleStart} disabled={!selectedWarehouse || !period || startMutation.isPending}>
                {startMutation.isPending ? 'Starting...' : 'Start Count'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Counts List */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Counts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started At</TableHead>
                <TableHead>Discrepancies</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {counts.map((count) => (
                <TableRow key={count.id}>
                  <TableCell>{count.period}</TableCell>
                  <TableCell>{count.warehouse_name}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        count.status === 'Open'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {count.status}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(count.started_at).toLocaleDateString()}</TableCell>
                  <TableCell>{count.discrepancies_count || 0}</TableCell>
                  <TableCell>
                    {count.status === 'Open' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          if (confirm('Close this count? This will generate ADJUST movements for discrepancies.')) {
                            closeMutation.mutate(count.id);
                          }
                        }}
                        disabled={closeMutation.isPending}
                      >
                        Close Count
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

