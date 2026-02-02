/**
 * Reports Page - با shadcn/ui و ECharts
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { FilterBar } from '../components/shared/FilterBar';
import ReactECharts from 'echarts-for-react';
import { reportsApi, warehousesApi } from '../api/endpoints';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { AlertTriangle, TrendingDown, PackageX } from 'lucide-react';

export const ReportsPage = () => {
  const { t, isRTL } = useLanguage();
  const { theme } = useTheme();
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | undefined>();

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehousesApi.list().then(res => res.data),
  });

  const { data: shortages } = useQuery({
    queryKey: ['shortages', selectedWarehouse],
    queryFn: () => reportsApi.shortages({ warehouse: selectedWarehouse }).then(res => res.data),
  });

  const { data: consumptionData } = useQuery({
    queryKey: ['consumption-by-dept'],
    queryFn: () => reportsApi.consumptionByDept().then(res => res.data),
  });

  const warehouses = warehousesData?.results || [];

  // Shortages Chart
  const shortagesChartOption = shortages && shortages.length > 0
    ? {
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
                <span style="direction: ltr; text-align: left;">${param.seriesName}: <strong>${param.value}</strong></span>
              </div>`;
            });
            return result;
          },
        },
        legend: {
          data: [t('common.currentStock'), t('common.minStock'), t('common.shortage')],
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
          bottom: '15%',
          top: '15%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: shortages.slice(0, 10).map((item: any) => item.item_code),
          axisLabel: {
            rotate: 45,
            fontSize: 10,
            color: theme === 'dark' ? '#ffffff' : 'hsl(var(--foreground))',
          },
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            color: theme === 'dark' ? '#ffffff' : 'hsl(var(--foreground))',
          },
        },
        series: [
          {
            name: t('common.currentStock'),
            type: 'bar',
            data: shortages.slice(0, 10).map((item: any) => item.current_stock),
            itemStyle: { color: '#3b82f6' },
            label: {
              show: false,
            },
          },
          {
            name: t('common.minStock'),
            type: 'bar',
            data: shortages.slice(0, 10).map((item: any) => item.min_stock),
            itemStyle: { color: '#f59e0b' },
            label: {
              show: false,
            },
          },
          {
            name: t('common.shortage'),
            type: 'bar',
            data: shortages.slice(0, 10).map((item: any) => item.shortage),
            itemStyle: { color: '#ef4444' },
            label: {
              show: false,
            },
          },
        ],
      }
    : null;

  // Consumption by Department Chart
  const consumptionChartOption = consumptionData && consumptionData.length > 0
    ? {
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderColor: 'transparent',
          textStyle: {
            color: '#fff',
            fontSize: 12,
          },
          formatter: (params: any) => {
            return `<div style="direction: ltr; text-align: left;">
              <div style="font-weight: 600; margin-bottom: 8px;">${params.name}</div>
              <div>${t('common.consumption')}: <strong>${params.value}</strong></div>
              <div>${params.percent}%</div>
            </div>`;
          },
        },
        legend: {
          orient: 'vertical',
          ...(isRTL ? {
            right: 'left',
            left: 'auto',
            top: 'middle',
          } : {
            left: 'left',
            top: 'middle',
          }),
          textStyle: {
            fontSize: 12,
            color: theme === 'dark' ? '#ffffff' : 'hsl(var(--muted-foreground))',
          },
        },
        series: [
          {
            name: t('common.consumption'),
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2,
            },
            label: {
              show: true,
              formatter: '{b}: {c}',
              color: theme === 'dark' ? '#ffffff' : 'hsl(var(--foreground))',
              ...(isRTL ? {
                rich: {
                  label: {
                    direction: 'ltr',
                    textAlign: 'left',
                  },
                },
              } : {}),
            },
            labelLine: {
              ...(isRTL ? {
                lineStyle: {
                  align: 'right',
                },
              } : {}),
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 14,
                fontWeight: 'bold',
              },
            },
            data: consumptionData.map((item: any) => ({
              value: item.total_consumption,
              name: item.dept_lab,
            })),
          },
        ],
      }
    : null;

  return (
    <div className="w-full h-full overflow-y-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">{t('reports.title')}</h1>
      </div>

      <FilterBar
        warehouses={warehouses}
        selectedWarehouse={selectedWarehouse}
        onWarehouseChange={setSelectedWarehouse}
        showDateRange={false}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {/* Shortages Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              {t('reports.shortages')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {shortagesChartOption ? (
              <ReactECharts
                option={shortagesChartOption}
                style={{ height: '400px', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <PackageX className="h-12 w-12 mb-2 opacity-50" />
                <p>{t('dashboard.noData')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Consumption Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.consumption')}</CardTitle>
          </CardHeader>
          <CardContent>
            {consumptionChartOption ? (
              <ReactECharts
                option={consumptionChartOption}
                style={{ height: '400px', width: '100%' }}
                opts={{ renderer: 'svg' }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <PackageX className="h-12 w-12 mb-2 opacity-50" />
                <p>{t('dashboard.noData')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shortages Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            {t('reports.shortages')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shortages && shortages.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('items.itemCode')}</TableHead>
                  <TableHead>{t('items.itemName')}</TableHead>
                  <TableHead>{t('common.currentStock')}</TableHead>
                  <TableHead>{t('common.minStock')}</TableHead>
                  <TableHead>{t('common.shortage')}</TableHead>
                  <TableHead>{t('requisitions.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shortages.map((item: any, idx: number) => (
                  <TableRow key={idx} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">{item.item_code}</TableCell>
                    <TableCell className="font-medium">{item.item_name}</TableCell>
                    <TableCell>{item.current_stock}</TableCell>
                    <TableCell>{item.min_stock}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        <span className="text-red-600 font-medium">{item.shortage}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="danger">{t('common.critical')}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <PackageX className="h-12 w-12 mb-2 opacity-50" />
              <p>{t('reports.noShortages')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

