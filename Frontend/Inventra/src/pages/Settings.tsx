/**
 * Settings Page
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '../components/ui/card';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select } from '../components/ui/select';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';
import { authApi } from '../api/endpoints';

export const SettingsPage = () => {
  const { role } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const isAdmin = role === 'Admin';
  const queryClient = useQueryClient();
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role_id: '',
  });
  const [editFormData, setEditFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role_id: '',
  });

  // Roles mapping - در واقع باید از API گرفته شود اما فعلاً ثابت است
  const roles = [
    { id: 1, name: 'Admin' },
    { id: 2, name: 'Storekeeper' },
    { id: 3, name: 'Requester' },
    { id: 4, name: 'Auditor' },
  ];

  // Mock data for users - در آینده باید از API گرفته شود
  const [users] = useState([
    { id: 1, username: 'admin', email: 'admin@inventra.com', role: 'Admin', is_active: true },
    { id: 2, username: 'storekeeper', email: 'storekeeper@inventra.com', role: 'Storekeeper', is_active: true },
    { id: 3, username: 'requester', email: 'requester@inventra.com', role: 'Requester', is_active: true },
  ]);

  const createUserMutation = useMutation({
    mutationFn: (data: {
      username: string;
      email: string;
      password: string;
      first_name?: string;
      last_name?: string;
      role_id?: number;
    }) => authApi.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowAddUserDialog(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role_id: '',
      });
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      first_name: formData.first_name || undefined,
      last_name: formData.last_name || undefined,
      role_id: formData.role_id ? Number(formData.role_id) : undefined,
    });
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    const roleId = roles.find(r => r.name === user.role)?.id || '';
    setEditFormData({
      username: user.username || '',
      email: user.email || '',
      password: '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role_id: roleId.toString(),
    });
    setShowEditUserDialog(true);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement update user API call
    console.log('Update user:', editingUser?.id, editFormData);
    // For now, just close the dialog
    setShowEditUserDialog(false);
    setEditingUser(null);
  };


  return (
    <div className="w-full h-full overflow-y-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">{t('settings.title')}</h1>
      </div>

      {/* Users & Roles Card */}
      <Card>
        <CardContent className="space-y-6 pt-6">
          {/* Security Settings */}
          <div className="space-y-4 pb-4 border-b">
            <h3 className="text-lg font-semibold">{t('settings.security')}</h3>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">{t('settings.sessionTimeout')}</label>
                <div className="flex gap-2">
                  <Input type="number" defaultValue={30} className="flex-1" />
                  {isAdmin && (
                    <Button>{t('settings.saveSecurity')}</Button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('settings.language')}</label>
                <Button 
                  onClick={toggleLanguage}
                  variant="outline"
                  size="sm"
                  className="gap-2 w-full"
                >
                  <Globe className="h-4 w-4" />
                  {language === 'fa' ? 'EN' : 'FA'}
                </Button>
              </div>
            </div>
          </div>

          {/* Users & Roles Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{t('settings.usersRoles')}</h3>
              {isAdmin && (
                <Button onClick={() => setShowAddUserDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('settings.addUser')}
                </Button>
              )}
            </div>

            {/* Users Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('login.username')}</TableHead>
                  <TableHead>{t('common.email')}</TableHead>
                  <TableHead>{t('common.role')}</TableHead>
                  <TableHead>{t('requisitions.status')}</TableHead>
                  {isAdmin && <TableHead>{t('items.actions')}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="info">{user.role === 'Admin' ? t('common.admin') : user.role === 'Storekeeper' ? t('common.storekeeper') : user.role === 'Requester' ? t('common.requester') : user.role === 'Auditor' ? t('common.auditor') : user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Badge variant="success">{t('status.active')}</Badge>
                      ) : (
                        <Badge variant="default">{t('status.inactive')}</Badge>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t('settings.addUser')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('login.username')} *</label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                placeholder={t('login.usernamePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.email')} *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder={t('common.emailPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('login.password')} *</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder={t('login.passwordPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.role')} *</label>
              <Select
                value={formData.role_id}
                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                required
              >
                <option value="">{t('common.select')}</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name === 'Admin' ? t('common.admin') : 
                     role.name === 'Storekeeper' ? t('common.storekeeper') : 
                     role.name === 'Requester' ? t('common.requester') : 
                     role.name === 'Auditor' ? t('common.auditor') : role.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.firstName')}</label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder={t('common.firstName')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.lastName')}</label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder={t('common.lastName')}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddUserDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? t('common.loading') : t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t('settings.editUser')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('login.username')} *</label>
              <Input
                value={editFormData.username}
                onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                required
                placeholder={t('login.usernamePlaceholder')}
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.email')} *</label>
              <Input
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                required
                placeholder={t('common.emailPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('login.password')}</label>
              <Input
                type="password"
                value={editFormData.password}
                onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                placeholder={t('login.passwordPlaceholder')}
              />
              <p className="text-xs text-muted-foreground mt-1">{t('settings.passwordHint')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.role')} *</label>
              <Select
                value={editFormData.role_id}
                onChange={(e) => setEditFormData({ ...editFormData, role_id: e.target.value })}
                required
              >
                <option value="">{t('common.select')}</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name === 'Admin' ? t('common.admin') : 
                     role.name === 'Storekeeper' ? t('common.storekeeper') : 
                     role.name === 'Requester' ? t('common.requester') : 
                     role.name === 'Auditor' ? t('common.auditor') : role.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.firstName')}</label>
              <Input
                value={editFormData.first_name}
                onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                placeholder={t('common.firstName')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('common.lastName')}</label>
              <Input
                value={editFormData.last_name}
                onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                placeholder={t('common.lastName')}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowEditUserDialog(false);
                setEditingUser(null);
              }}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">
                {t('common.update')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

