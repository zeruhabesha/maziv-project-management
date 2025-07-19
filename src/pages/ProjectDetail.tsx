import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, DollarSign, Users, Plus, BarChart3, AlertTriangle, CheckCircle, Clock, Package, Edit, FileText, TrendingUp, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchProjectStart } from '../store/slices/projectsSlice';
import { fetchItemsStart, deleteItemStart } from '../store/slices/itemsSlice';
import { fetchUsersStart } from '../store/slices/usersSlice';
import toast from 'react-hot-toast';
import EditProjectModal from '../components/Modals/EditProjectModal';
import CreateEditItemModal from '../components/Modals/CreateEditItemModal';

// Helper to format currency
const formatCurrency = (amount: number | string | undefined) => {
    if (amount === undefined) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(Number(amount));
};

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();

  // Redux state selectors
  const { currentProject, loading: projectLoading, error } = useAppSelector(state => state.projects);
  const { items, loading: itemsLoading } = useAppSelector(state => state.items);
  const { users } = useAppSelector(state => state.users);
  const { user: currentUser } = useAppSelector(state => state.auth);

  // Local UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    if (id) {
      dispatch(fetchProjectStart(id));
      dispatch(fetchItemsStart({ projectId: id }));
      dispatch(fetchUsersStart()); // For the "Assign To" dropdown in the item modal
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (!projectLoading && !currentProject) {
      console.log('Project detail error:', error);
    }
  }, [projectLoading, currentProject, error]);

  useEffect(() => {
    console.log('currentProject:', currentProject);
    console.log('projectLoading:', projectLoading);
    // Optionally, log error from Redux
    // const { error } = useAppSelector(state => state.projects);
    // console.log('projectError:', error);
  }, [currentProject, projectLoading]);

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setShowItemModal(true);
  };
  
  const handleAddItem = () => {
    setEditingItem(null); // Ensure we're creating a new item
    setShowItemModal(true);
  };

  const handleDeleteItem = (itemId: string, itemName: string) => {
    if (window.confirm(`Are you sure you want to delete the item "${itemName}"?`)) {
      dispatch(deleteItemStart(itemId));
    }
  };
  
  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  
  if (projectLoading) return <div className="p-6 text-center">Loading Project...</div>;
  if (!currentProject) return <div className="p-6 text-center text-red-500">Project not found.</div>;

  const totalCost = items.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.unit_price || 0)), 0);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'items', name: 'Items & Activities', icon: Package },
    { id: 'financials', name: 'Financials', icon: DollarSign },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/projects" className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{currentProject.name}</h1>
            <p className="text-gray-600">{currentProject.client} (#{currentProject.ref_no})</p>
          </div>
        </div>
        {canEdit && <button onClick={() => setShowEditProjectModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"><Edit className="h-4 w-4" /><span>Edit Project</span></button>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <InfoCard title="Timeline" value={`${new Date(currentProject.start_date).toLocaleDateString()} - ${new Date(currentProject.end_date).toLocaleDateString()}`} icon={Calendar} />
          <InfoCard title="Tender Value" value={formatCurrency(currentProject.tender_value)} icon={DollarSign} />
          <InfoCard title="Progress" value={`${currentProject.stats?.progress_percentage || 0}%`} icon={TrendingUp} />
          <InfoCard title="Managers" value={`${currentProject.manager_ids?.length || 0}`} icon={Users} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b"><nav className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300'}`}>
                <tab.icon className="h-5 w-5" /><span>{tab.name}</span>
              </button>
            ))}
        </nav></div>
        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab stats={currentProject.stats} />}
          {activeTab === 'items' && <ItemsTab items={items} loading={itemsLoading} onAddItem={handleAddItem} onEditItem={handleEditItem} onDeleteItem={handleDeleteItem} />}
          {activeTab === 'financials' && <FinancialsTab tenderValue={currentProject.tender_value} totalCost={totalCost} />}
        </div>
      </div>
      
      {canEdit && <EditProjectModal isOpen={showEditProjectModal} onClose={() => setShowEditProjectModal(false)} project={currentProject} />}
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
        <a
          href={`/uploads/projects/${currentProject.file}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          Download Project File
        </a>
      )}
    </div>
  );
};  

// Sub-components for ProjectDetail for better organization
const InfoCard = ({ title, value, icon: Icon }: any) => (
  <div className="flex items-center space-x-3"><div className="p-2 bg-gray-100 rounded-lg"><Icon className="h-5 w-5 text-gray-500" /></div><div><p className="text-sm text-gray-500">{title}</p><p className="font-semibold text-gray-800">{value}</p></div></div>
);

const OverviewTab = ({ stats }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <StatCard title="Total Items" value={stats?.total_items} />
    <StatCard title="Completed" value={stats?.completed_items} color="text-green-600" />
    <StatCard title="In Progress" value={stats?.in_progress_items} color="text-blue-600" />
    <StatCard title="Overdue" value={stats?.overdue_items} color="text-red-600" />
  </div>
);
const StatCard = ({ title, value, color = 'text-gray-900' }: any) => (<div className="bg-gray-50 p-4 rounded-lg text-center"><p className="text-sm text-gray-500">{title}</p><p className={`text-3xl font-bold ${color}`}>{value || 0}</p></div>);

const ItemsTab = ({ items, loading, onAddItem, onEditItem, onDeleteItem }: any) => (
  <div className="space-y-4">
    <div className="flex justify-end"><button onClick={onAddItem} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"><Plus size={16} /><span>Add Item</span></button></div>
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-gray-50"><tr className="text-left text-gray-500"><th className="p-3">Item</th><th className="p-3">Status</th><th className="p-3">Assigned To</th><th className="p-3">Value</th><th className="p-3">Attachment</th><th className="p-3">Actions</th></tr></thead>
        <tbody className="divide-y">{loading ? (<tr><td colSpan={6} className="p-4 text-center">Loading items...</td></tr>) : items.map((item: any) => (<tr key={item.id}>
          <td className="p-3 font-medium">{item.name}</td><td className="p-3 capitalize">{item.status}</td>
          <td className="p-3">{item.AssignedTo?.name || 'Unassigned'}</td><td className="p-3">{formatCurrency(Number(item.quantity) * Number(item.unit_price))}</td>
          <td className="p-3">
            {item.file ? (
              <a
                href={`/api/items/${item.id}/download/${item.file}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Download
              </a>
            ) : (
              <span className="text-gray-400">No file</span>
            )}
          </td>
          <td className="p-3 flex space-x-2"><button onClick={() => onEditItem(item)} className="text-blue-600"><Edit size={16} /></button><button onClick={() => onDeleteItem(item.id, item.name)} className="text-red-600"><Trash2 size={16} /></button></td>
        </tr>))}</tbody>
      </table>
    </div>
  </div>
);

const FinancialsTab = ({ tenderValue, totalCost }: any) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Tender Value" value={formatCurrency(tenderValue)} />
        <StatCard title="Total Cost" value={formatCurrency(totalCost)} color="text-blue-600" />
        <StatCard title="Projected Profit" value={formatCurrency(tenderValue - totalCost)} color="text-green-600" />
    </div>
);

export default ProjectDetail;