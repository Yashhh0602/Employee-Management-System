'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';

type TreeNode = {
  id: string;
  name: string;
  designation: string;
  role: string;
  status: string;
  children: TreeNode[];
};

function OrgNode({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  return (
    <div className={depth > 0 ? 'ml-6 mt-2 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : 'mt-2'}>
      <Link
        href={`/employees/${node.id}`}
        className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition"
      >
        <span className="font-semibold text-gray-900 dark:text-gray-100">{node.name}</span>
        <span className="text-gray-500 dark:text-gray-400 text-sm">— {node.designation}</span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded ${
            node.status === 'active'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
          }`}
        >
          {node.status}
        </span>
      </Link>
      {node.children?.length > 0 && (
        <div>
          {node.children.map((child) => (
            <OrgNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrgChartContent() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/organization/tree')
      .then((res) => setTree(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load org chart'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Organization Chart</h1>
        <Link href="/dashboard" className="text-gray-700 dark:text-gray-300 font-medium hover:underline">
          ← Dashboard
        </Link>
      </div>

      {error && <p className="text-red-600 dark:text-red-400 font-medium mb-4">{error}</p>}
      {loading && <p className="text-gray-600 dark:text-gray-400">Loading...</p>}

      {!loading && tree.length === 0 && !error && (
        <p className="text-gray-500 dark:text-gray-400">No organizational hierarchy found.</p>
      )}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        {tree.map((node) => (
          <OrgNode key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
}

export default function OrgChartPage() {
  return (
    <ProtectedRoute>
      <OrgChartContent />
    </ProtectedRoute>
  );
}