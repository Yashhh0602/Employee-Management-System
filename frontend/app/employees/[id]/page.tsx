'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';

type Employee = {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  salary: string;
  joiningDate: string;
  status: string;
  role: string;
  reportingManagerId: string | null;
};

function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [reportees, setReportees] = useState<Employee[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState<Partial<Employee>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const isSelf = user?.id === id;
  const isEmployeeRole = user?.role === 'employee';
  const canEditRoleManager = user?.role === 'super_admin';

  const fetchData = useCallback(async () => {
    try {
      const empRes = await api.get(`/employees/${id}`);
      setEmployee(empRes.data);
      setForm(empRes.data);

      const reporteesRes = await api.get(`/employees/${id}/reportees`);
      setReportees(reporteesRes.data);

      if (!isEmployeeRole) {
        const allRes = await api.get('/employees', { params: { limit: 100 } });
        setAllEmployees(allRes.data.data.filter((e: Employee) => e.id !== id));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load employee');
    }
  }, [id, isEmployeeRole]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.put(`/employees/${id}`, form);
      setSuccess('Employee updated successfully');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleManagerChange = async (managerId: string) => {
    try {
      await api.patch(`/employees/${id}/manager`, { managerId });
      setSuccess('Manager updated');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update manager');
    }
  };

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {isSelf ? 'My Profile' : employee.name}
        </h1>
        <Link href="/employees" className="text-gray-700 dark:text-gray-300 font-medium hover:underline">
          ← Back to list
        </Link>
      </div>

      {error && <p className="text-red-600 dark:text-red-400 font-medium mb-4">{error}</p>}
      {success && <p className="text-green-600 dark:text-green-400 font-medium mb-4">{success}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Employee ID" name="employeeId" value={form.employeeId || ''} onChange={handleChange} disabled />
            <Field label="Name" name="name" value={form.name || ''} onChange={handleChange} />
            <Field label="Email" name="email" value={form.email || ''} onChange={handleChange} disabled={isEmployeeRole} />
            <Field label="Phone" name="phone" value={form.phone || ''} onChange={handleChange} />
            <Field label="Department" name="department" value={form.department || ''} onChange={handleChange} disabled={isEmployeeRole} />
            <Field label="Designation" name="designation" value={form.designation || ''} onChange={handleChange} disabled={isEmployeeRole} />
            <Field label="Salary" name="salary" value={form.salary || ''} onChange={handleChange} disabled={isEmployeeRole} />
            <Field label="Joining Date" name="joiningDate" type="date" value={form.joiningDate?.slice(0, 10) || ''} onChange={handleChange} disabled={isEmployeeRole} />
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Status</label>
              <select
                name="status"
                value={form.status || 'active'}
                onChange={handleChange}
                disabled={isEmployeeRole}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-800"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Role</label>
              <select
                name="role"
                value={form.role || 'employee'}
                onChange={handleChange}
                disabled={!canEditRoleManager}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-800"
              >
                <option value="employee">Employee</option>
                <option value="hr_manager">HR Manager</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        <div className="space-y-6">
          {canEditRoleManager && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Reporting Manager</h2>
              <select
                value={employee.reportingManagerId || ''}
                onChange={(e) => handleManagerChange(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
              >
                <option value="">No Manager</option>
                {allEmployees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.designation})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Direct Reportees ({reportees.length})</h2>
            {reportees.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No direct reportees</p>
            ) : (
              <ul className="space-y-2">
                {reportees.map((r) => (
                  <li key={r.id} className="text-sm">
                    <Link href={`/employees/${r.id}`} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                      {r.name}
                    </Link>
                    <span className="text-gray-500 dark:text-gray-400"> — {r.designation}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  disabled = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-800"
      />
    </div>
  );
}

export default function EmployeeDetailPage() {
  return (
    <ProtectedRoute>
      <EmployeeDetail />
    </ProtectedRoute>
  );
}