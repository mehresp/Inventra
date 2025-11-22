/**
 * Requisitions Page
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { requisitionsApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

export const RequisitionsPage = () => {
  const { role } = useAuth();
  const queryClient = useQueryClient();

  const { data: requisitionsData } = useQuery({
    queryKey: ['requisitions'],
    queryFn: () => requisitionsApi.list().then(res => res.data),
  });

  const requisitions = requisitionsData?.results || [];

  const approveMutation = useMutation({
    mutationFn: (id: number) => requisitionsApi.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['requisitions'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      requisitionsApi.reject(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['requisitions'] }),
  });

  const fulfillMutation = useMutation({
    mutationFn: (id: number) => requisitionsApi.fulfill(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['requisitions'] }),
  });

  const canApprove = role === 'Admin' || role === 'Storekeeper';

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Requisitions</h1>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Req No</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Needed By</TableHead>
                {canApprove && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {requisitions.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>{req.req_no}</TableCell>
                  <TableCell>{req.requester_username}</TableCell>
                  <TableCell>{req.dept_lab}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        req.status === 'Approved'
                          ? 'bg-green-100 text-green-800'
                          : req.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : req.status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {req.status}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(req.needed_by).toLocaleDateString()}</TableCell>
                  {canApprove && req.status === 'Pending' && (
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(req.id)}
                          disabled={approveMutation.isPending}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm('Reject this requisition?')) {
                              rejectMutation.mutate({ id: req.id });
                            }
                          }}
                          disabled={rejectMutation.isPending}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  )}
                  {canApprove && req.status === 'Approved' && (
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => fulfillMutation.mutate(req.id)}
                        disabled={fulfillMutation.isPending}
                      >
                        Fulfill
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

