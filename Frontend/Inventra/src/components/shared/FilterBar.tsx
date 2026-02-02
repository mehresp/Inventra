/**
 * Shared Filter Bar Component
 */
import { Select } from '../ui/select';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { useLanguage } from '../../context/LanguageContext';

interface FilterBarProps {
  warehouses?: Array<{ id: number; name: string }>;
  selectedWarehouse?: number;
  onWarehouseChange?: (warehouseId: number | undefined) => void;
  dateRange?: {
    start: string;
    end: string;
  };
  onDateRangeChange?: (start: string, end: string) => void;
  showWarehouse?: boolean;
  showDateRange?: boolean;
  className?: string;
}

export const FilterBar = ({
  warehouses = [],
  selectedWarehouse,
  onWarehouseChange,
  dateRange,
  onDateRangeChange,
  showWarehouse = true,
  showDateRange = true,
  className,
}: FilterBarProps) => {
  const { t } = useLanguage();
  const handleDateChange = (type: 'start' | 'end', value: string) => {
    if (onDateRangeChange) {
      if (type === 'start') {
        onDateRangeChange(value, dateRange?.end || '');
      } else {
        onDateRangeChange(dateRange?.start || '', value);
      }
    }
  };

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {showWarehouse && (
            <div>
              <label className="block text-sm font-medium mb-1">{t('filter.warehouse')}</label>
              <Select
                value={selectedWarehouse || ''}
                onChange={(e) => onWarehouseChange?.(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">{t('common.allWarehouses')}</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
          {showDateRange && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">{t('filter.startDate')}</label>
                <Input
                  type="date"
                  value={dateRange?.start || ''}
                  onChange={(e) => handleDateChange('start', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('filter.endDate')}</label>
                <Input
                  type="date"
                  value={dateRange?.end || ''}
                  onChange={(e) => handleDateChange('end', e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    const today = new Date();
                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                    onDateRangeChange?.(
                      firstDay.toISOString().split('T')[0],
                      today.toISOString().split('T')[0]
                    );
                  }}
                >
                  {t('filter.thisMonth')}
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};



