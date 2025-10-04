import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Edit, Trash2, Shield, User, Crown, Users as UsersIcon, UserPlus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchUsersStart, deleteUserStart } from '../store/slices/usersSlice';
import CreateUserModal from '../components/Modals/CreateUserModal';
import EditUserModal from '../components/Modals/EditUserModal';

const Users: React.FC = () => {
  const dispatch = useAppDispatch();
  const { users, loading, error } = useAppSelector((state) => state.users);
  const { user: currentUser } = useAppSelector((state) => state.auth);

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    dispatch(fetchUsersStart());
  }, [dispatch]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);
  
  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      dispatch(deleteUserStart(userId));
    }
  };
  
  // Check if current user is an admin
const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';

if (!isAdminOrManager) {
  return (
    <div className="text-center py-12">
      <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium">Access Denied</h3>
      <p className="text-gray-600">You do not have permission to view this page.</p>
    </div>
  );
}

  const getRoleIcon = (role: string) => {
    const icons = { admin: Crown, manager: Shield, user: User };
    const Icon = icons[role as keyof typeof icons] || User;
    return <Icon className="h-4 w-4" />;
  };

  const getRoleColor = (role: string) => {
    const colors = {
        admin: 'bg-purple-100 text-purple-800',
        manager: 'bg-blue-100 text-blue-800',
        user: 'bg-gray-100 text-gray-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600">Manage team members and their roles.</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2">
          <UserPlus className="h-5 w-5" /><span>Add User</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 p-2 w-full border rounded-lg" />
          </div>
          <div className="sm:w-48 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="pl-10 p-2 w-full border rounded-lg appearance-none bg-white">
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>
      </div>
      
      {loading ? (<p className="text-center p-4">Loading users...</p>) :
      (<div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map((user) => (
                <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center mr-3"><span className="font-semibold text-blue-600">{user.name.charAt(0)}</span></div>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4"><span className={`inline-flex items-center space-x-1.5 capitalize px-2.5 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>{getRoleIcon(user.role)}<span>{user.role}</span></span></td>
                  <td className="p-4 text-sm text-gray-500">
                    {user.createdAt && !isNaN(new Date(user.createdAt).getTime())
                      ? new Date(user.createdAt).toLocaleDateString()
                      : ''}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleEditUser(user)} className="p-1 text-gray-400 hover:text-blue-600" title="Edit User"><Edit size={16} /></button>
                      {user.id !== currentUser?.id && <button onClick={() => handleDeleteUser(user.id, user.name)} className="p-1 text-gray-400 hover:text-red-600" title="Delete User"><Trash2 size={16} /></button>}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && <p className="p-4 text-center text-gray-500">No users match your criteria.</p>}
        </div>
      </div>)}

      <CreateUserModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      {selectedUser && <EditUserModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} user={selectedUser} />}
    </div>
  );
};

export default Users;