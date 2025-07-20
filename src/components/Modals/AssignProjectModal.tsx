import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Users, Check, Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchUsersStart } from '../../store/slices/usersSlice';
import { updateProjectStart } from '../../store/slices/projectsSlice';
import toast from 'react-hot-toast';
import { Project } from '../../types';

interface AssignProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project;
}

const AssignProjectModal: React.FC<AssignProjectModalProps> = ({ isOpen, onClose, project }) => {
  const dispatch = useAppDispatch();
  const { users, loading: usersLoading } = useAppSelector(state => state.users);
  const { loading: projectLoading, error: projectError } = useAppSelector(state => state.projects);
  const [selectedManagerIds, setSelectedManagerIds] = useState<string[]>([]);
  const [wasSubmitting, setWasSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchUsersStart());
      setSelectedManagerIds(project?.manager_ids?.map(String) || []);
    }
  }, [isOpen, dispatch, project]);

  useEffect(() => {
    if (wasSubmitting && !projectLoading) {
      if (!projectError) {
        toast.success(`Managers updated for project: ${project?.name}`);
        onClose();
      } else {
        toast.error('Failed to update managers');
      }
      setWasSubmitting(false);
    }
  }, [wasSubmitting, projectLoading, projectError, onClose, project?.name]);

  const handleToggleManager = (userId: string) => {
    setSelectedManagerIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleAssign = () => {
    if (!project) return;
    const manager_ids = selectedManagerIds.map(id => parseInt(id, 10));
    setWasSubmitting(true);
    dispatch(updateProjectStart({ id: project.id, data: { manager_ids } }));
  };
  
  const managers = users.filter(u => u.role === 'admin' || u.role === 'manager');
  const loading = usersLoading || projectLoading;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Assign Managers to {project?.name}</h3>
            <button onClick={onClose}><X size={20} /></button>
          </div>
          <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
            {usersLoading ? <p>Loading users...</p> : managers.map(manager => (
              <div key={manager.id} onClick={() => handleToggleManager(manager.id)}
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${
                  selectedManagerIds.includes(manager.id) ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
                }`}>
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center"><span className="font-medium text-xs">{manager.name.charAt(0)}</span></div>
                  <div><p className="font-medium">{manager.name}</p><p className="text-xs text-gray-500">{manager.email}</p></div>
                </div>
                {selectedManagerIds.includes(manager.id) && <Check className="text-blue-600" />}
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-4 mt-4 border-t">
            <button onClick={handleAssign} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center space-x-2 disabled:opacity-50">
              <Plus size={16} /><span>Update Managers</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AssignProjectModal;