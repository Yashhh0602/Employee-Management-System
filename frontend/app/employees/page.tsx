'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';

type Employee = {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  status: 'active' | 'inactive';
  role: string;
  joiningDate: string;
};

function EmployeesContent() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('joiningDate');
  const [order, setOrder] = useState('DESC');
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');

  const canCreate = user?.role === 'super_admin' || user?.role === 'hr_manager';
  const canDelete = user?.role === 'super_admin';

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await api.get('/employees', {
        params: { search, department, role, status, sortBy, order, page, limit: 10 },
      });
      setEmployees(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load employees');
    }
  }, [search, department, role, status, sortBy, order, page]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      await api.delete(`/employees/${id}`);
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg('');
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/employees/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportMsg(res.data.message);
      fetchEmployees();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Employees ({total})</h1>
        <div className="flex gap-3">
          <Link href="/dashboard" className="text-gray-700 dark:text-gray-300 font-medium px-4 py-2 hover:underline">
            ← Dashboard
          </Link>
          {canCreate && (
            <>
              <Link
                href="/employees/new"
                className="bg-blue-600 text-white font-semibold px-4 py-2 rounded hover:bg-blue-700"
              >
                + Add Employee
              </Link>
              <label className="bg-green-600 text-white font-semibold px-4 py-2 rounded hover:bg-green-700 cursor-pointer">
                {importing ? 'Importing...' : '⭱ Import CSV'}
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImport}
                  className="hidden"
                  disabled={importing}
                />
              </label>
            </>
          )}
        </div>
      </div>

      {error && <p className="text-red-600 dark:text-red-400 font-medium mb-4">{error}</p>}
      {importMsg && <p className="text-green-600 dark:text-green-400 font-medium mb-4">{importMsg}</p>}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search name/email..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 flex-1 min-w-[200px]"
        />
        <select
          value={department}
          onChange={(e) => {
            setPage(1);
            setDepartment(e.target.value);
          }}
          className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
        >
          <option value="">All Departments</option>
          <option value="Management">Management</option>
          <option value="HR">HR</option>
          <option value="Engineering">Engineering</option>
        </select>
        <select
          value={role}
          onChange={(e) => {
            setPage(1);
            setRole(e.target.value);
          }}
          className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
        >
          <option value="">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="hr_manager">HR Manager</option>
          <option value="employee">Employee</option>
        </select>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={`${sortBy}_${order}`}
          onChange={(e) => {
            const [sb, ord] = e.target.value.split('_');
            setSortBy(sb);
            setOrder(ord);
          }}
          className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
        >
          <option value="joiningDate_DESC">Joining Date (Newest)</option>
          <option value="joiningDate_ASC">Joining Date (Oldest)</option>
          <option value="name_ASC">Name (A-Z)</option>
          <option value="name_DESC">Name (Z-A)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Employee ID</th>
              <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
              <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Email</th>
              <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Department</th>
              <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Designation</th>
              <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
              <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Role</th>
              <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="p-3 text-gray-900 dark:text-gray-100">{emp.employeeId}</td>
                <td className="p-3 text-gray-900 dark:text-gray-100">{emp.name}</td>
                <td className="p-3 text-gray-700 dark:text-gray-300">{emp.email}</td>
                <td className="p-3 text-gray-700 dark:text-gray-300">{emp.department}</td>
                <td className="p-3 text-gray-700 dark:text-gray-300">{emp.designation}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      emp.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {emp.status}
                  </span>
                </td>
                <td className="p-3 text-gray-700 dark:text-gray-300">{emp.role}</td>
                <td className="p-3 flex gap-3">
                  <Link href={`/employees/${emp.id}`} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                    View/Edit
                  </Link>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className="text-red-600 dark:text-red-400 font-medium hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-gray-700 dark:text-gray-300 text-sm">
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 font-medium disabled:opacity-40"
          >
            Prev
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 font-medium disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  return (
    <ProtectedRoute>
      <EmployeesContent />
    </ProtectedRoute>
  );
}