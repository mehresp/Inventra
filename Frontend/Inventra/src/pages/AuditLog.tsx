/**
 * Audit Log Page
 */
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { auditLogsApi } from '../api/endpoints';

export const AuditLogPage = () => {
  const { data: logsData } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditLogsApi.list().then(res => res.data),
  });

  const logs = logsData?.results || [];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Audit Log</h1>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                  <TableCell>{log.actor_username}</TableCell>
                  <TableCell>{log.entity}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.ip}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

