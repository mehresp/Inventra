/**
 * Warehouses Page
 */
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { warehousesApi } from '../api/endpoints';

export const WarehousesPage = () => {
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehousesApi.list().then(res => res.data),
  });

  const warehouses = warehousesData?.results || [];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Warehouses</h1>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Items Count</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouses.map((wh) => (
                <TableRow key={wh.id}>
                  <TableCell>{wh.name}</TableCell>
                  <TableCell>{wh.location}</TableCell>
                  <TableCell>{wh.items_count || 0}</TableCell>
                  <TableCell>{wh.is_active ? 'Active' : 'Inactive'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

