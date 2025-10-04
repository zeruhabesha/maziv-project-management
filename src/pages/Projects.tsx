import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Calendar, DollarSign, Eye, Edit, Trash2, FolderOpen, UserIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchProjectsStart, deleteProjectStart } from '../store/slices/projectsSlice';
import { useDebounce } from '../hooks/useDebounce';
import CreateProjectModal from '../components/Modals/CreateProjectModal';
import EditProjectModal from '../components/Modals/EditProjectModal';
import AssignProjectModal from '../components/Modals/AssignProjectModal';

// Helper to format currency
const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(Number(amount));
};

// Helper for status colors
const getStatusColor = (status: string) => {
  const colors: { [key: string]: string } = {
    completed: 'bg-green-100 text-green-800',
    active: 'bg-blue-100 text-blue-800',
    planning: 'bg-yellow-100 text-yellow-800',
    on_hold: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const Projects: React.FC = () => {
  const dispatch = useAppDispatch();
  const { projects, pagination, loading, error } = useAppSelector((state) => state.projects);
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignProject, setAssignProject] = useState<any>(null);

  useEffect(() => {
    dispatch(fetchProjectsStart({
      page: currentPage,
      limit: 10,
      client: debouncedSearchTerm,
      status: statusFilter,
    }));
  }, [dispatch, currentPage, debouncedSearchTerm, statusFilter]);

  const handleEditProject = (project: any) => {
    setSelectedProject(project);
    setShowEditModal(true);
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    if (window.confirm(`Are you sure you want to delete "${projectName}"? This will also delete all associated items and cannot be undone.`)) {
      dispatch(deleteProjectStart(projectId));
    }
  };

const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  const canCreateOrEdit = isAdminOrManager || currentUser?.role === 'manager';

  const handleAssignUser = (project: any) => {
    setAssignProject(project);
    setShowAssignModal(true);
  };

  const handleProjectDownload = async (projectId: string, filename: string) => {
    try {
      const { default: api } = await import('../lib/api');
      const res: any = await api.get(`/projects/${projectId}/download/${filename}`, { responseType: 'blob' as any });
      const blob = res.data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      // Optional: toast error if you have react-hot-toast on this page
      console.error(e?.message || 'Failed to download');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Manage and track all company projects.</p>
        </div>
        {canCreateOrEdit && (
          <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center space-x-2">
            <Plus className="h-5 w-5" /><span>New Project</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by client name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 p-2 w-full border rounded-lg bg-gray-50 focus:bg-white"
            />
          </div>
          <div className="sm:w-48 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="pl-10 p-2 w-full border rounded-lg appearance-none bg-gray-50 focus:bg-white"
            >
              <option value="">All Statuses</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {loading && (projects?.length ?? 0) === 0 && <p className="text-center p-4">Loading projects...</p>}
      {error && <p className="text-center p-4 text-red-500">{error}</p>}

      {!loading && (projects?.length ?? 0) > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(projects ?? []).map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className={`inline-flex capitalize px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 mt-2 hover:text-blue-600">
                        <Link to={`/projects/${project.id}`}>{project.name}</Link>
                      </h3>
                      <p className="text-sm text-gray-500">{project.client} (#{project.ref_no})</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {canCreateOrEdit && (
                        <button onClick={() => handleEditProject(project)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {isAdminOrManager && (
                        <button onClick={() => handleDeleteProject(project.id, project.name)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleAssignUser(project)}
                        className="p-2 text-gray-400 hover:text-purple-600 rounded-lg"
                        title="Assign User"
                      >
                        <UserIcon className="h-4 w-4" />
                      </button>
                      {project.file && (
                        <button
                        onClick={() => project.file && handleProjectDownload(project.id, project.file)}
                          // onClick={() => handleProjectDownload(project.id, project.file)}
                          className="p-2 text-gray-400 hover:text-green-600 rounded-lg"
                          title="Download Project File"
                          style={{ display: 'inline-flex', alignItems: 'center' }}
                        >
                          <FolderOpen className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">Progress</span>
                      <span className="font-semibold text-blue-600">{project.stats?.progress_percentage ?? 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${project.stats?.progress_percentage ?? 0}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4 mt-4">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>Ends: {new Date(project.end_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 font-medium text-gray-700">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span>{formatCurrency(project.tender_value)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination Controls */}
          {(pagination?.pages ?? 0) > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  className="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-100"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >Prev</button>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`px-3 py-2 border-t border-b border-gray-300 bg-white text-gray-700 hover:bg-gray-100 ${currentPage === page ? 'font-bold bg-blue-50 text-blue-600' : ''}`}
                    onClick={() => setCurrentPage(page)}
                    disabled={currentPage === page}
                  >{page}</button>
                ))}
                <button
                  className="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-100"
                  onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={currentPage === pagination.pages}
                >Next</button>
              </nav>
            </div>
          )}
        </>
      )}

      {!loading && (projects?.length ?? 0) === 0 && (
        <div className="text-center py-16">
          <FolderOpen className="mx-auto h-16 w-16 text-gray-300" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No projects found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your filters, or create a new project to get started.</p>
        </div>
      )}

      <CreateProjectModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      {selectedProject && (
        <EditProjectModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} project={selectedProject} />
      )}
      {assignProject && (
        <AssignProjectModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          project={assignProject}
        />
      )}
    </div>
  );
};

export default Projects;
