/**
 * Reports Page
 */
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { reportsApi } from '../api/endpoints';

export const ReportsPage = () => {
  const { data: shortages } = useQuery({
    queryKey: ['shortages'],
    queryFn: () => reportsApi.shortages().then(res => res.data),
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Reports</h1>

      <Card>
        <CardHeader>
          <CardTitle>Shortages Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Code</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Min Stock</TableHead>
                <TableHead>Shortage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shortages?.map((item: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell>{item.item_code}</TableCell>
                  <TableCell>{item.item_name}</TableCell>
                  <TableCell>{item.current_stock}</TableCell>
                  <TableCell>{item.min_stock}</TableCell>
                  <TableCell className="text-red-600">{item.shortage}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

