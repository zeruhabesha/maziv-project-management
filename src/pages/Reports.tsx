import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart as BarChartIcon, Download, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchProjectsStart } from '../store/slices/projectsSlice';
import toast from 'react-hot-toast';

const Reports: React.FC = () => {
  const dispatch = useAppDispatch();
  const { projects, loading } = useAppSelector(state => state.projects);

  useEffect(() => {
    // Fetch all projects for reporting purposes (up to a reasonable limit)
    dispatch(fetchProjectsStart({ limit: 1000 }));
  }, [dispatch]);
  
  const reportData = useMemo(() => {
    const costData = projects.map(p => ({
      name: p.ref_no,
      budget: p.tender_value,
      cost: p.stats?.total_cost || 0,
    }));

    const statusCounts = projects.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusChartData = [
      { name: 'Planning', value: statusCounts.planning || 0, color: '#F59E0B' },
      { name: 'Active', value: statusCounts.active || 0, color: '#3B82F6' },
      { name: 'Completed', value: statusCounts.completed || 0, color: '#10B981' },
      { name: 'On Hold', value: statusCounts.on_hold || 0, color: '#6B7280' },
      { name: 'Cancelled', value: statusCounts.cancelled || 0, color: '#EF4444' },
    ].filter(item => item.value > 0);

    return { costData, statusChartData };
  }, [projects]);
  
  const exportReport = () => {
    toast.success("Export functionality is a placeholder.");
  };

  if (loading && projects.length === 0) {
      return <div className="text-center p-8">Generating reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-gray-600">Portfolio-wide project insights</p>
        </div>
        <button onClick={exportReport} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2">
            <Download size={16} /><span>Export</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Project Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={reportData.statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {reportData.statusChartData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-3 bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Project Budget vs. Actual Cost</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.costData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} />
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    <Bar dataKey="budget" fill="#8884d8" name="Budget" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cost" fill="#82ca9d" name="Actual Cost" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
};

export default Reports;