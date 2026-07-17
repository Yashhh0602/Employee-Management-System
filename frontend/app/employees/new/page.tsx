'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';

function NewEmployeeForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    employeeId: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    department: '',
    designation: '',
    salary: '',
    joiningDate: '',
    role: 'employee',
    status: 'active',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/employees', { ...form, salary: parseFloat(form.salary) });
      router.push('/employees');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Add Employee</h1>
        <Link href="/employees" className="text-gray-700 dark:text-gray-300 font-medium hover:underline">
          ← Back to list
        </Link>
      </div>

      {error && <p className="text-red-600 dark:text-red-400 font-medium mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Employee ID" name="employeeId" value={form.employeeId} onChange={handleChange} required />
          <Field label="Name" name="name" value={form.name} onChange={handleChange} required />
          <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
          <Field label="Password" name="password" type="password" value={form.password} onChange={handleChange} required />
          <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} required />
          <Field label="Department" name="department" value={form.department} onChange={handleChange} required />
          <Field label="Designation" name="designation" value={form.designation} onChange={handleChange} required />
          <Field label="Salary" name="salary" type="number" value={form.salary} onChange={handleChange} required />
          <Field label="Joining Date" name="joiningDate" type="date" value={form.joiningDate} onChange={handleChange} required />
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
            >
              <option value="employee">Employee</option>
              <option value="hr_manager">HR Manager</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white font-semibold px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Employee'}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
      />
    </div>
  );
}

export default function NewEmployeePage() {
  return (
    <ProtectedRoute>
      <NewEmployeeForm />
    </ProtectedRoute>
  );
}