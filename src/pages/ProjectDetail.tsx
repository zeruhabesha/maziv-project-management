import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, DollarSign, Users, Plus, BarChart3, Package, Edit, TrendingUp, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchProjectStart } from '../store/slices/projectsSlice';
import { fetchItemsStart, deleteItemStart } from '../store/slices/itemsSlice';
import { fetchUsersStart } from '../store/slices/usersSlice';
import toast from 'react-hot-toast';
import EditProjectModal from '../components/Modals/EditProjectModal';
import CreateEditItemModal from '../components/Modals/CreateEditItemModal';
import api from '../lib/api';

// Helper to format currency
const formatCurrency = (amount: number | string | undefined) => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(Number(amount));
};

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();

  // Redux state selectors
  const { currentProject, loading: projectLoading, error } = useAppSelector(state => state.projects);
  const { items: itemsState, loading: itemsLoading } = useAppSelector(state => state.items);
  const { users } = useAppSelector(state => state.users);
  const { user: currentUser } = useAppSelector(state => state.auth);

  // Ensure we always have an array for rendering
  const items = useMemo(() => Array.isArray(itemsState) ? itemsState : [], [itemsState]);

  // Local UI state
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'financials'>('overview');
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [projectFile, setProjectFile] = useState<File | null>(null);

  // Fetch project + items + users
  useEffect(() => {
    if (!id) return;
    dispatch(fetchProjectStart(id));
    dispatch(fetchItemsStart({ projectId: id }));
    dispatch(fetchUsersStart());
  }, [id, dispatch]);

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  if (projectLoading) return <div className="p-6 text-center">Loading Project...</div>;
  if (!currentProject) return <div className="p-6 text-center text-red-500">Project not found.</div>;

  const totalCost = items.reduce((acc, item) => {
    const qty = Number(item.quantity ?? 0);
    const price = Number(item.unit_price ?? 0);
    return acc + qty * price;
  }, 0);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'items', name: 'Items & Activities', icon: Package },
    { id: 'financials', name: 'Financials', icon: DollarSign },
  ] as const;

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setShowItemModal(true);
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setShowItemModal(true);
  };

  const handleDeleteItem = (itemId: string, itemName: string) => {
    if (window.confirm(`Are you sure you want to delete the item "${itemName}"?`)) {
      dispatch(deleteItemStart(itemId));
    }
  };

  const handleProjectFileUpload = async () => {
    if (!projectFile || !currentProject) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', projectFile);
      await api.post(`/projects/${currentProject.id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Project file uploaded');
      dispatch(fetchProjectStart(currentProject.id)); // Refresh
      setProjectFile(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to upload project file');
    } finally {
      setUploading(false);
    }
  };

  const handleProjectFileDownload = async () => {
    if (!currentProject?.file) return;
    try {
      const response: any = await api.get(`/projects/${currentProject.id}/download/${currentProject.file}`, { responseType: 'blob' as any });
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = currentProject.file; a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to download');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/projects" className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{currentProject.name}</h1>
            <p className="text-gray-600">{currentProject.client} (#{currentProject.ref_no})</p>
          </div>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowEditProjectModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" /><span>Edit Project</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <InfoCard title="Timeline" value={`${new Date(currentProject.start_date).toLocaleDateString()} - ${new Date(currentProject.end_date).toLocaleDateString()}`} icon={Calendar} />
        <InfoCard title="Tender Value" value={formatCurrency(currentProject.tender_value)} icon={DollarSign} />
        <InfoCard title="Progress" value={`${currentProject.stats?.progress_percentage ?? 0}%`} icon={TrendingUp} />
        <InfoCard title="Managers" value={`${currentProject.manager_ids?.length ?? 0}`} icon={Users} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300'}`}
              >
                <tab.icon className="h-5 w-5" /><span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab stats={currentProject.stats} />}
          {activeTab === 'items' && (
            <ItemsTab
              items={items}
              loading={itemsLoading}
              onAddItem={handleAddItem}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
            />
          )}
          {activeTab === 'financials' && <FinancialsTab tenderValue={currentProject.tender_value} totalCost={totalCost} />}
        </div>
      </div>

      {canEdit && (
        <EditProjectModal
          isOpen={showEditProjectModal}
          onClose={() => setShowEditProjectModal(false)}
          project={currentProject}
        />
      )}

      {showItemModal && (
        <CreateEditItemModal
          isOpen={showItemModal}
          onClose={() => setShowItemModal(false)}
          projectId={currentProject.id}
          item={editingItem}
          users={users}
        />
      )}

      {currentProject.file && (
        <div className="flex items-center space-x-4 mt-6">
          <button onClick={handleProjectFileDownload} className="text-blue-600 underline">
            Download Project File
          </button>
        </div>
      )}

      {canEdit && (
        <div className="flex items-center space-x-2 mt-4">
          <input
            type="file"
            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={e => setProjectFile(e.target.files?.[0] || null)}
            className="border rounded p-2"
          />
          <button
            onClick={handleProjectFileUpload}
            disabled={!projectFile || uploading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload Project File'}
          </button>
        </div>
      )}
    </div>
  );
};

// Sub-components
const InfoCard = ({ title, value, icon: Icon }: any) => (
  <div className="flex items-center space-x-3">
    <div className="p-2 bg-gray-100 rounded-lg"><Icon className="h-5 w-5 text-gray-500" /></div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="font-semibold text-gray-800">{value}</p>
    </div>
  </div>
);

const OverviewTab = ({ stats }: { stats?: any }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <StatCard title="Total Items" value={stats?.total_items ?? 0} />
    <StatCard title="Completed" value={stats?.completed_items ?? 0} color="text-green-600" />
    <StatCard title="In Progress" value={stats?.in_progress_items ?? 0} color="text-blue-600" />
    <StatCard title="Overdue" value={stats?.overdue_items ?? 0} color="text-red-600" />
  </div>
);

const StatCard = ({ title, value, color = 'text-gray-900' }: { title: string; value: number | string; color?: string }) => (
  <div className="bg-gray-50 p-4 rounded-lg text-center">
    <p className="text-sm text-gray-500">{title}</p>
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
  </div>
);

const ItemsTab = ({
  items,
  loading,
  onAddItem,
  onEditItem,
  onDeleteItem,
}: {
  items: any[];
  loading: boolean;
  onAddItem: () => void;
  onEditItem: (item: any) => void;
  onDeleteItem: (id: string, name: string) => void;
}) => (
  <div className="space-y-4">
    <div className="flex justify-end">
      <button onClick={onAddItem} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2">
        <Plus size={16} /><span>Add Item</span>
      </button>
    </div>
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left text-gray-500">
            <th className="p-3">Item</th>
            <th className="p-3">Status</th>
            <th className="p-3">Assigned To</th>
            <th className="p-3">Value</th>
            <th className="p-3">Attachment</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {loading ? (
            <tr><td colSpan={6} className="p-4 text-center">Loading items...</td></tr>
          ) : (items ?? []).map((item: any) => (
            <tr key={item.id}>
              <td className="p-3 font-medium">{item.name}</td>
              <td className="p-3 capitalize">{item.status}</td>
              <td className="p-3">{item.assigned_user_name || item.AssignedTo?.name || 'Unassigned'}</td>
              <td className="p-3">{formatCurrency(Number(item.quantity) * Number(item.unit_price))}</td>
              <td className="p-3">
                {item.file ? (
                  <button onClick={() => handleDownload(item.id, item.file)} className="text-blue-600 underline">
                    Download
                  </button>
                ) : (
                  <span className="text-gray-400">No file</span>
                )}
              </td>
              <td className="p-3 flex space-x-2">
                <button onClick={() => onEditItem(item)} className="text-blue-600"><Edit size={16} /></button>
                <button onClick={() => onDeleteItem(item.id, item.name)} className="text-red-600"><Trash2 size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const FinancialsTab = ({ tenderValue, totalCost }: { tenderValue: number; totalCost: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <StatCard title="Tender Value" value={formatCurrency(tenderValue)} />
    <StatCard title="Total Cost" value={formatCurrency(totalCost)} color="text-blue-600" />
    <StatCard title="Projected Profit" value={formatCurrency((tenderValue ?? 0) - (totalCost ?? 0))} color="text-green-600" />
  </div>
);

const handleDownload = async (itemId: string, filename: string) => {
  try {
    const res: any = await api.get(`/items/${itemId}/download/${filename}`, { responseType: 'blob' as any });
    const blob = res.data;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    window.URL.revokeObjectURL(url);
  } catch (e: any) {
    toast.error(e?.message || 'Failed to download');
  }
};

export default ProjectDetail;
