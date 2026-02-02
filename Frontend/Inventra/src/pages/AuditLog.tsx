/**
 * Audit Log Page - با shadcn/ui
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { auditLogsApi } from '../api/endpoints';
import { useLanguage } from '../context/LanguageContext';
import { Search, Eye, PackageX } from 'lucide-react';

export const AuditLogPage = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['audit-logs', search, entityFilter, actionFilter],
    queryFn: () =>
      auditLogsApi.list({
        entity: entityFilter || undefined,
        action: actionFilter || undefined,
      }).then(res => res.data),
  });

  const logs = logsData?.results || [];
  const filteredLogs = search
    ? logs.filter(
        (log) =>
          log.actor_username?.toLowerCase().includes(search.toLowerCase()) ||
          log.entity?.toLowerCase().includes(search.toLowerCase()) ||
          log.action?.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const getActionBadge = (action: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      CREATE: 'success',
      UPDATE: 'info',
      DELETE: 'danger',
      APPROVE: 'success',
      REJECT: 'danger',
      FULFILL: 'success',
    };
    const actionLabels: Record<string, string> = {
      CREATE: t('common.create'),
      UPDATE: t('common.update'),
      DELETE: t('common.delete'),
      APPROVE: t('requisitions.approve'),
      REJECT: t('requisitions.reject'),
      FULFILL: t('requisitions.fulfill'),
    };
    return <Badge variant={variants[action] || 'default'}>{actionLabels[action] || action}</Badge>;
  };

  const getEntityLabel = (entity: string) => {
    const entityLabels: Record<string, string> = {
      Item: t('common.item'),
      Warehouse: t('common.warehouse'),
      Requisition: t('requisitions.title'),
      Movement: t('movements.title'),
      InventoryCount: t('inventoryCount.title'),
    };
    return entityLabels[entity] || entity;
  };

  return (
    <div className="w-full h-full overflow-y-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">{t('auditLog.title')}</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('auditLog.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}>
              <option value="">{t('common.allEntities')}</option>
              <option value="Item">{t('common.item')}</option>
              <option value="Warehouse">{t('common.warehouse')}</option>
              <option value="Requisition">{t('requisitions.title')}</option>
              <option value="Movement">{t('inventory.movements')}</option>
            </Select>
            <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
              <option value="">{t('common.allActions')}</option>
              <option value="CREATE">{t('common.create')}</option>
              <option value="UPDATE">{t('common.update')}</option>
              <option value="DELETE">{t('common.delete')}</option>
              <option value="APPROVE">{t('requisitions.approve')}</option>
              <option value="REJECT">{t('requisitions.reject')}</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('auditLog.activityLog')}</CardTitle>
          <CardDescription>
            {filteredLogs.length} {t('auditLog.activityLog')} {t('common.found')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <PackageX className="h-12 w-12 mb-2 opacity-50" />
              <p>{t('auditLog.noLogs')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('auditLog.timestamp')}</TableHead>
                  <TableHead>{t('auditLog.actor')}</TableHead>
                  <TableHead>{t('auditLog.entity')}</TableHead>
                  <TableHead>{t('auditLog.action')}</TableHead>
                  <TableHead>IP {t('common.address')}</TableHead>
                  <TableHead>{t('common.details')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.actor_username}</div>
                        {log.actor_full_name && (
                          <div className="text-xs text-muted-foreground">{log.actor_full_name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="info">{getEntityLabel(log.entity)}</Badge>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell className="font-mono text-xs">{log.ip}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{t('auditLog.viewDetails')}</DialogTitle>
                            <DialogDescription>
                              {t('common.details')} {t('auditLog.activity')}
                            </DialogDescription>
                          </DialogHeader>
                          {log && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">{t('auditLog.actor')}</label>
                                  <p className="text-base">{log.actor_username}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">{t('auditLog.timestamp')}</label>
                                  <p className="text-base">{new Date(log.created_at).toLocaleString()}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">{t('auditLog.entity')}</label>
                                  <p className="text-base">{getEntityLabel(log.entity)}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">{t('auditLog.action')}</label>
                                  <p className="text-base">{getActionBadge(log.action)}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">IP {t('common.address')}</label>
                                  <p className="text-base font-mono text-sm">{log.ip}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">{t('common.userAgent')}</label>
                                  <p className="text-base text-sm">{log.user_agent}</p>
                                </div>
                              </div>
                              {(log.before || log.after) && (
                                <div className="space-y-4">
                                  <label className="text-sm font-medium">{t('auditLog.changes')}</label>
                                  <div className="space-y-3">
                                    {(() => {
                                      const before = log.before || {};
                                      const after = log.after || {};
                                      const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
                                      
                                      return Array.from(allKeys).map((key) => {
                                        const beforeValue = before[key];
                                        const afterValue = after[key];
                                        const hasChanged = JSON.stringify(beforeValue) !== JSON.stringify(afterValue);
                                        
                                        return (
                                          <div key={key} className={`border rounded-md p-3 ${hasChanged ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                            <div className="font-medium text-sm mb-2">{key}</div>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                              {beforeValue !== undefined && (
                                                <div>
                                                  <div className="text-xs text-muted-foreground mb-1">{t('common.before')}</div>
                                                  <div className={`p-2 rounded bg-muted ${hasChanged ? 'line-through text-muted-foreground' : ''}`}>
                                                    {typeof beforeValue === 'object' ? JSON.stringify(beforeValue) : String(beforeValue || t('common.none'))}
                                                  </div>
                                                </div>
                                              )}
                                              {afterValue !== undefined && (
                                                <div>
                                                  <div className="text-xs text-muted-foreground mb-1">{t('common.after')}</div>
                                                  <div className={`p-2 rounded bg-muted ${hasChanged ? 'text-primary font-medium' : ''}`}>
                                                    {typeof afterValue === 'object' ? JSON.stringify(afterValue) : String(afterValue || t('common.none'))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      });
                                    })()}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
