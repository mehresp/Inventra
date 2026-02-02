/**
 * Dashboard Page - با shadcn/ui و ECharts
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { Progress } from '../components/ui/progress';
import { FilterBar } from '../components/shared/FilterBar';
import { requisitionsApi, inventoryCountsApi, reportsApi, warehousesApi, itemsApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import ReactECharts from 'echarts-for-react';
import {
  AlertTriangle,
  Clock,
  Calculator,
  TrendingDown,
  ArrowRight,
  FileText,
  Package,
  PackageX,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '../lib/utils';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { t, isRTL } = useLanguage();
  const { theme } = useTheme();
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  // Fetch warehouses for filter
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehousesApi.list().then(res => res.data),
  });

  // Fetch shortages
  const { data: shortages, isLoading: shortagesLoading } = useQuery({
    queryKey: ['shortages', selectedWarehouse],
    queryFn: () => reportsApi.shortages({ warehouse: selectedWarehouse }).then(res => res.data),
  });

  // Fetch pending requisitions
  const { data: requisitions, isLoading: requisitionsLoading } = useQuery({
    queryKey: ['requisitions', 'pending'],
    queryFn: () => requisitionsApi.list({ status: 'Pending' }).then(res => res.data),
  });

  // Fetch active counts
  const { data: counts, isLoading: countsLoading } = useQuery({
    queryKey: ['inventory-counts', 'open'],
    queryFn: () => inventoryCountsApi.list({ status: 'Open' }).then(res => res.data),
  });

  // Fetch monthly flow data
  const currentDate = new Date();
  const { data: monthlyFlow, isLoading: flowLoading } = useQuery({
    queryKey: ['monthly-flow', currentDate.getFullYear(), currentDate.getMonth() + 1, selectedWarehouse],
    queryFn: () =>
      reportsApi.monthlyFlow({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        warehouse: selectedWarehouse,
      }).then(res => res.data),
  });

  // Fetch low stock items
  const { data: lowStockItems, isLoading: lowStockLoading } = useQuery({
    queryKey: ['items', 'below_min'],
    queryFn: () => itemsApi.list({ below_min: true }).then(res => res.data),
  });

  // Fetch total items count
  const { data: allItemsData } = useQuery({
    queryKey: ['items', 'all'],
    queryFn: () => itemsApi.list().then(res => res.data),
  });

  const warehouses = warehousesData?.results || [];
  const shortagesCount = shortages?.length || 0;
  const pendingRequisitionsCount = requisitions?.results?.length || 0;
  const activeCountsCount = counts?.results?.length || 0;
  const lowStockList = lowStockItems?.results || [];
  const totalItemsCount = allItemsData?.count || allItemsData?.results?.length || 0;

  // ECharts option for Monthly Flow - Bar Chart
  const monthlyFlowOption = monthlyFlow
    ? {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
          },
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderColor: 'transparent',
          textStyle: {
            color: '#fff',
            fontSize: 12,
          },
          formatter: (params: any) => {
            let result = `<div style="font-weight: 600; margin-bottom: 8px;">${params[0].name}</div>`;
            params.forEach((param: any) => {
              result += `<div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${param.color};"></span>
                <span>${param.seriesName}: <strong>${param.value}</strong></span>
              </div>`;
            });
            return result;
          },
        },
        legend: {
          data: [t('chart.in'), t('chart.out'), t('chart.net')],
          top: 10,
          ...(isRTL ? {
            right: 0,
            left: 'auto',
            textStyle: {
              fontSize: 12,
              color: theme === 'dark' ? '#ffffff' : 'hsl(var(--muted-foreground))',
            },
          } : {
            textStyle: {
              fontSize: 12,
              color: theme === 'dark' ? '#ffffff' : 'hsl(var(--muted-foreground))',
            },
          }),
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '15%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: [t('dashboard.thisMonth')],
          axisLabel: {
            fontSize: 12,
            fontWeight: 500,
            color: theme === 'dark' ? '#ffffff' : 'hsl(var(--foreground))',
          },
          axisLine: {
            lineStyle: {
              color: 'hsl(var(--border))',
            },
          },
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            fontSize: 12,
            color: theme === 'dark' ? '#ffffff' : 'hsl(var(--muted-foreground))',
          },
          axisLine: {
            lineStyle: {
              color: 'hsl(var(--border))',
            },
          },
          splitLine: {
            lineStyle: {
              color: 'hsl(var(--border))',
              type: 'dashed',
            },
          },
        },
        series: [
          {
            name: t('chart.in'),
            type: 'bar',
            data: [typeof monthlyFlow.in === 'number' ? monthlyFlow.in : parseFloat(monthlyFlow.in || 0)],
            itemStyle: {
              color: '#10b981',
              borderRadius: [6, 6, 0, 0],
            },
            label: {
              show: true,
              position: 'top',
              fontSize: 12,
              fontWeight: 600,
              color: theme === 'dark' ? '#ffffff' : 'hsl(var(--foreground))',
              ...(isRTL ? {
                rich: {
                  value: {
                    direction: 'ltr',
                    textAlign: 'center',
                    width: 50,
                  },
                },
                formatter: '{value|{@value}}',
              } : {}),
            },
            barWidth: '25%',
          },
          {
            name: t('chart.out'),
            type: 'bar',
            data: [typeof monthlyFlow.out === 'number' ? monthlyFlow.out : parseFloat(monthlyFlow.out || 0)],
            itemStyle: {
              color: '#ef4444',
              borderRadius: [6, 6, 0, 0],
            },
            label: {
              show: true,
              position: 'top',
              fontSize: 12,
              fontWeight: 600,
              color: theme === 'dark' ? '#ffffff' : 'hsl(var(--foreground))',
              ...(isRTL ? {
                rich: {
                  value: {
                    direction: 'ltr',
                    textAlign: 'center',
                    width: 50,
                  },
                },
                formatter: '{value|{@value}}',
              } : {}),
            },
            barWidth: '25%',
          },
          {
            name: t('chart.net'),
            type: 'bar',
            data: [typeof monthlyFlow.net === 'number' ? monthlyFlow.net : parseFloat(monthlyFlow.net || 0)],
            itemStyle: {
              color: '#3b82f6',
              borderRadius: [6, 6, 0, 0],
            },
            label: {
              show: true,
              position: 'top',
              fontSize: 12,
              fontWeight: 600,
              color: theme === 'dark' ? '#ffffff' : 'hsl(var(--foreground))',
              ...(isRTL ? {
                rich: {
                  value: {
                    direction: 'ltr',
                    textAlign: 'center',
                    width: 50,
                  },
                },
                formatter: '{value|{@value}}',
              } : {}),
            },
            barWidth: '25%',
          },
        ],
      }
    : null;

  // ECharts option for Trends - Line Chart
  const trendsOption = monthlyFlow
    ? {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderColor: 'transparent',
          textStyle: {
            color: '#fff',
          },
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '10%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: [`${t('chart.week')} 1`, `${t('chart.week')} 2`, `${t('chart.week')} 3`, `${t('chart.week')} 4`],
          axisLabel: {
            fontSize: 11,
            color: theme === 'dark' ? '#ffffff' : 'hsl(var(--muted-foreground))',
          },
          axisLine: {
            lineStyle: {
              color: 'hsl(var(--border))',
            },
          },
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            fontSize: 11,
            color: theme === 'dark' ? '#ffffff' : 'hsl(var(--muted-foreground))',
          },
          axisLine: {
            lineStyle: {
              color: 'hsl(var(--border))',
            },
          },
          splitLine: {
            lineStyle: {
              color: 'hsl(var(--border))',
              type: 'dashed',
            },
          },
        },
        series: [
          {
            name: t('chart.stockLevel'),
            type: 'line',
            smooth: true,
            data: [120, 132, 101, 134],
            itemStyle: {
              color: '#3b82f6',
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: 'rgba(59, 130, 246, 0.3)',
                  },
                  {
                    offset: 1,
                    color: 'rgba(59, 130, 246, 0.05)',
                  },
                ],
              },
            },
            lineStyle: {
              width: 3,
            },
          },
        ],
      }
    : null;

  const canCreateRequisition = role === 'Admin' || role === 'Requester';

  const kpiCards = [
    {
      title: t('dashboard.shortages'),
      value: shortagesCount,
      description: t('dashboard.lowStock'),
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950',
      borderColor: 'border-red-200 dark:border-red-800',
      trend: '+12%',
      trendUp: false,
      href: '/reports',
    },
    {
      title: t('dashboard.pendingRequisitions'),
      value: pendingRequisitionsCount,
      description: t('requisitions.pending'),
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      trend: '-5%',
      trendUp: true,
      href: '/requisitions',
    },
    {
      title: t('dashboard.activeCounts'),
      value: activeCountsCount,
      description: t('dashboard.activeCounts'),
      icon: Calculator,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      borderColor: 'border-blue-200 dark:border-blue-800',
      trend: '+3',
      trendUp: true,
      href: '/inventory-count',
    },
    {
      title: t('dashboard.totalItems'),
      value: totalItemsCount,
      description: t('inventory.items'),
      icon: Package,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950',
      borderColor: 'border-green-200 dark:border-green-800',
      trend: '+8%',
      trendUp: true,
      href: '/inventory',
    },
  ];

  return (
    <div className="w-full h-full overflow-y-auto space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        </div>
        <div className="flex gap-2">
          {canCreateRequisition && (
            <Button onClick={() => navigate('/requisitions')}>
              <FileText className="mr-2 h-4 w-4" />
              {t('dashboard.newRequisition')}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        warehouses={warehouses}
        selectedWarehouse={selectedWarehouse}
        onWarehouseChange={setSelectedWarehouse}
        dateRange={dateRange}
        onDateRangeChange={(start, end) => setDateRange({ start, end })}
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const isLoading = 
            card.title === t('dashboard.shortages') ? shortagesLoading :
            card.title === t('dashboard.pendingRequisitions') ? requisitionsLoading :
            card.title === t('dashboard.activeCounts') ? countsLoading :
            card.title === t('dashboard.totalItems') ? false :
            lowStockLoading;

          return (
            <Card
              key={card.title}
              className={cn(
                'relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer border-2',
                card.borderColor
              )}
              onClick={() => navigate(card.href)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={cn('rounded-lg p-2', card.bgColor)}>
                  <Icon className={cn('h-5 w-5', card.color)} />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20 mb-2" />
                ) : (
                  <>
                    <div className={cn('text-3xl font-bold mb-1', card.color)}>
                      {card.value}
                    </div>
                    {card.trend && (
                      <div className={cn(
                        'flex items-center gap-1 text-xs',
                        card.trendUp ? 'text-green-600' : 'text-red-600'
                      )}>
                        {card.trendUp ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        <span>{card.trend}</span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Monthly Flow Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('dashboard.monthlyFlow')}</CardTitle>
              </div>
              <Badge variant="default">{t('dashboard.thisMonth')}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {flowLoading ? (
              <div className="h-[350px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : monthlyFlowOption ? (
              <ReactECharts
                option={monthlyFlowOption}
                style={{ height: '350px', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
                <PackageX className="h-12 w-12 mb-2 opacity-50" />
                <p>{t('dashboard.noData')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trends Chart */}
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.stockTrends')}</CardTitle>
            </CardHeader>
            <CardContent>
              {trendsOption ? (
                <ReactECharts
                  option={trendsOption}
                  style={{ height: '350px', width: '100%' }}
                  opts={{ renderer: 'svg' }}
                />
              ) : (
                <div className="flex items-center justify-center h-[350px] text-muted-foreground text-sm">
                  {t('chart.noData')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Low Stock Items */}
      {lowStockList.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  {t('dashboard.lowStock')}
                </CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/inventory')}>
                {t('common.view')} {t('common.all')}
                <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {lowStockLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('items.itemCode')}</TableHead>
                    <TableHead>{t('items.itemName')}</TableHead>
                    <TableHead>{t('items.currentStock')}</TableHead>
                    <TableHead>{t('items.minStock')}</TableHead>
                    <TableHead>{t('dashboard.shortage')}</TableHead>
                    <TableHead>{t('requisitions.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockList.slice(0, 5).map((item) => {
                    const shortage = (item.min_stock || 0) - (item.current_stock || 0);
                    const stockPercentage = ((item.current_stock || 0) / (item.min_stock || 1)) * 100;
                    return (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">{item.code}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{item.current_stock ?? 0}</span>
                            <Progress value={Math.min(stockPercentage, 100)} className="w-16 h-2" />
                          </div>
                        </TableCell>
                        <TableCell>{item.min_stock}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <TrendingDown className="h-4 w-4 text-red-500" />
                            <span className="text-red-600 font-medium dark:text-red-400">{shortage}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="danger">{t('dashboard.critical')}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
