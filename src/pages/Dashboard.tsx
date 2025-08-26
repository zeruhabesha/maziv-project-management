import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Users, AlertTriangle, TrendingUp, Clock, CheckCircle, DollarSign, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchDashboardStart } from '../store/slices/reportsSlice';
import { fetchProjectsStart } from '../store/slices/projectsSlice';
import { fetchAlertsStart } from '../store/slices/alertsSlice';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { dashboard, loading: dashboardLoading } = useAppSelector((state) => state.reports);
  const { projects, loading: projectsLoading } = useAppSelector((state) => state.projects);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchDashboardStart());
    // Fetch recent projects for the table
    dispatch(fetchProjectsStart({ page: 1, limit: 5 }));
    // Fetch alerts for current user - only if user exists and has an ID
    if (user?.id) {
      dispatch(fetchAlertsStart({ userId: user.id }));
    }
  }, [dispatch, user]);

  // Memoize chart data to prevent re-calculation on every render
  const statusChartData = useMemo(() => {
    if (!dashboard) return [];
    return [
      { name: 'Active', value: dashboard.projects.active_projects, color: '#3B82F6' },
      { name: 'Completed', value: dashboard.projects.completed_projects, color: '#10B981' },
      { name: 'Overdue', value: dashboard.projects.overdue_projects, color: '#EF4444' },
    ];
  }, [dashboard]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const loading = dashboardLoading || projectsLoading;
  if (loading && !dashboard) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!dashboard) {
    return <div className="text-center p-8">Failed to load dashboard data. Please try again later.</div>;
  }

  const stats = [
    { title: 'Total Projects', value: dashboard.projects.total_projects, icon: FolderOpen, color: 'bg-blue-500' },
    { title: 'Active Projects', value: dashboard.projects.active_projects, icon: Target, color: 'bg-emerald-500' },
    { title: 'Overdue Items', value: dashboard.items.overdue_items, icon: AlertTriangle, color: 'bg-red-500' },
    { title: 'Total Items Value', value: `$${Number(dashboard.items.total_value).toLocaleString()}`, icon: DollarSign, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's a high-level overview of your projects.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={statusChartData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {statusChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
          {dashboard.alerts?.length ? dashboard.alerts.map((alert: any) => (
              <div key={alert.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50">
                <div className={`flex-shrink-0 w-2 h-2 ${alert.severity === 'high' || alert.type === 'overdue' ? 'bg-red-500' : 'bg-yellow-500'} rounded-full mt-1.5`}></div>
                <div>
                  <p className="text-sm text-gray-900">{alert.message}</p>
                  <p className="text-xs text-gray-500">
                    Project: {alert.Project?.name || 'N/A'} - {new Date(alert.triggered_at).toLocaleString()}
                  </p>
                </div>
              </div>
            )) : <p className="text-sm text-gray-500 text-center py-10">No recent alerts.</p>}
          </div>
        </motion.div>
      </div>
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b"><h3 className="text-lg font-semibold text-gray-900">Recently Active Projects</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="p-4"><Link to={`/projects/${project.id}`} className="font-medium text-blue-600 hover:underline">{project.name}</Link></td>
                  <td className="p-4">
                    <div className="flex items-center"><div className="w-full bg-gray-200 rounded-full h-2 mr-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${project.stats?.progress_percentage || 0}%` }}></div></div>
                      <span className="text-sm text-gray-600">{project.stats?.progress_percentage || 0}%</span>
                    </div>
                  </td>
                  <td className="p-4"><span className={`inline-flex capitalize px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>{project.status.replace('_', ' ')}</span></td>
                  <td className="p-4 text-sm text-gray-600">{new Date(project.end_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;