/**
 * Movements Page
 */
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { movementsApi } from '../api/endpoints';

export const MovementsPage = () => {
  const { data: movementsData } = useQuery({
    queryKey: ['movements'],
    queryFn: () => movementsApi.list().then(res => res.data),
  });

  const movements = movementsData?.results || [];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Movements</h1>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((mov) => (
                <TableRow key={mov.id}>
                  <TableCell>{new Date(mov.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{mov.type}</TableCell>
                  <TableCell>{mov.item_name}</TableCell>
                  <TableCell>{mov.warehouse_from_name || '-'}</TableCell>
                  <TableCell>{mov.warehouse_to_name || '-'}</TableCell>
                  <TableCell>{mov.qty}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

