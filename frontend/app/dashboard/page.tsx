'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Stats = {
  total: number;
  active: number;
  inactive: number;
  departmentCount: number;
  departmentBreakdown: { department: string; count: number }[];
};

const COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ef4444', '#14b8a6', '#eab308'];

function DashboardContent() {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/employees/dashboard')
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load stats'));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {user?.name} ({user?.role})
          </span>
          <button
            onClick={toggleDarkMode}
            className="bg-gray-700 text-white font-semibold px-4 py-2 rounded hover:bg-gray-800 text-sm"
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button
            onClick={logout}
            className="bg-red-600 text-white font-semibold px-4 py-2 rounded hover:bg-red-700 text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>}

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard label="Total Employees" value={stats.total} color="bg-blue-500" />
            <StatCard label="Active Employees" value={stats.active} color="bg-green-500" />
            <StatCard label="Inactive Employees" value={stats.inactive} color="bg-gray-500" />
            <StatCard label="Departments" value={stats.departmentCount} color="bg-purple-500" />
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-8 max-w-xl">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Employees by Department
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.departmentBreakdown}
                  dataKey="count"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry: any) => `${entry.department}: ${entry.count}`}
                >
                  {stats.departmentBreakdown.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <div className="flex gap-4">
        <a href="/employees" className="bg-blue-600 text-white font-semibold px-4 py-2 rounded hover:bg-blue-700">
          View Employees
        </a>
        <a href="/organization" className="bg-purple-600 text-white font-semibold px-4 py-2 rounded hover:bg-purple-700">
          Org Chart
        </a>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <div className={`w-3 h-3 rounded-full ${color} mb-2`} />
      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{label}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}