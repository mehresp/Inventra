/**
 * Dashboard Page
 */
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { requisitionsApi, inventoryCountsApi, reportsApi } from '../api/endpoints';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const DashboardPage = () => {
  // Fetch shortages
  const { data: shortages } = useQuery({
    queryKey: ['shortages'],
    queryFn: () => reportsApi.shortages().then(res => res.data),
  });

  // Fetch pending requisitions
  const { data: requisitions } = useQuery({
    queryKey: ['requisitions', 'pending'],
    queryFn: () => requisitionsApi.list({ status: 'Pending' }).then(res => res.data),
  });

  // Fetch active counts
  const { data: counts } = useQuery({
    queryKey: ['inventory-counts', 'open'],
    queryFn: () => inventoryCountsApi.list({ status: 'Open' }).then(res => res.data),
  });

  // Fetch monthly flow data
  const currentDate = new Date();
  const { data: monthlyFlow } = useQuery({
    queryKey: ['monthly-flow', currentDate.getFullYear(), currentDate.getMonth() + 1],
    queryFn: () =>
      reportsApi.monthlyFlow({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
      }).then(res => res.data),
  });

  const shortagesCount = shortages?.length || 0;
  const pendingRequisitionsCount = requisitions?.results?.length || 0;
  const activeCountsCount = counts?.results?.length || 0;

  const chartData = monthlyFlow
    ? [
        { name: 'IN', value: typeof monthlyFlow.in === 'number' ? monthlyFlow.in : parseFloat(monthlyFlow.in || 0) },
        { name: 'OUT', value: typeof monthlyFlow.out === 'number' ? monthlyFlow.out : parseFloat(monthlyFlow.out || 0) },
        { name: 'NET', value: typeof monthlyFlow.net === 'number' ? monthlyFlow.net : parseFloat(monthlyFlow.net || 0) },
      ]
    : [];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Shortages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{shortagesCount}</div>
            <p className="text-sm text-gray-500 mt-1">Items below minimum stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Requisitions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{pendingRequisitionsCount}</div>
            <p className="text-sm text-gray-500 mt-1">Waiting for approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Counts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{activeCountsCount}</div>
            <p className="text-sm text-gray-500 mt-1">Open inventory counts</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Flow Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly IN/OUT Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

