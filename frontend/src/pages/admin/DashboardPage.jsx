import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Users,
  ArrowRight,
  TrendingUp,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { adminAPI } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, txRes, overdueRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getTransactions({ limit: 5, skip: 0 }),
        adminAPI.getOverdue(),
      ]);
      setStats(dashRes.data);
      const txData = txRes.data;
      setTransactions(Array.isArray(txData) ? txData.slice(0, 5) : (txData.items || txData.transactions || []).slice(0, 5));
      setOverdue(Array.isArray(overdueRes.data) ? overdueRes.data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900">Failed to load dashboard</h3>
        <p className="text-sm text-gray-500 mt-1 mb-4">{error}</p>
        <button onClick={fetchData} className="btn-primary">
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Retry
        </button>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Items',
      value: stats?.total_items ?? 0,
      subtitle: `${stats?.total_active_items ?? 0} active`,
      icon: Package,
      color: 'bg-blue-500',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-700',
      link: '/admin/inventory',
    },
    {
      label: 'Active Borrows',
      value: stats?.active_borrows ?? 0,
      subtitle: 'Currently borrowed',
      icon: ClipboardList,
      color: 'bg-amber-500',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-700',
      link: '/admin/transactions',
    },
    {
      label: 'Overdue',
      value: stats?.overdue_count ?? 0,
      subtitle: 'Past return date',
      icon: AlertTriangle,
      color: 'bg-red-500',
      bgLight: 'bg-red-50',
      textColor: 'text-red-700',
      link: '/admin/overdue',
    },
    {
      label: 'Total Transactions',
      value: stats?.total_transactions ?? 0,
      subtitle: `${stats?.returned_count ?? 0} returned`,
      icon: TrendingUp,
      color: 'bg-emerald-500',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      link: '/admin/transactions',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of IT equipment borrowing</p>
        </div>
        <button onClick={fetchData} className="btn-secondary">
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.link}
              className="card p-5 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {card.label}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                  <p className={`text-xs font-medium mt-1 ${card.textColor}`}>{card.subtitle}</p>
                </div>
                <div className={`w-10 h-10 ${card.bgLight} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.textColor}`} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Recent Transactions</h2>
            <Link
              to="/admin/transactions"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No recent transactions</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-5 font-medium text-gray-500">ID</th>
                    <th className="text-left py-3 px-5 font-medium text-gray-500">Employee</th>
                    <th className="text-left py-3 px-5 font-medium text-gray-500 hidden sm:table-cell">Date</th>
                    <th className="text-left py-3 px-5 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.transaction_id || tx.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-5 font-mono text-xs font-semibold text-primary-700">
                        {(tx.transaction_id || tx.id || '').toString().slice(0, 12)}...
                      </td>
                      <td className="py-3 px-5">
                        <p className="font-medium text-gray-900">{tx.employee_name}</p>
                        <p className="text-xs text-gray-500">{tx.department}</p>
                      </td>
                      <td className="py-3 px-5 text-gray-600 hidden sm:table-cell">{tx.borrow_date}</td>
                      <td className="py-3 px-5">
                        <StatusBadge status={tx.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Overdue Alerts */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Overdue
            </h2>
            <Link
              to="/admin/overdue"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {overdue.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No overdue items</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {overdue.slice(0, 5).map((tx) => {
                const txId = tx.transaction_id || tx.id;
                const daysOverdue = tx.days_overdue || 0;
                return (
                  <div key={txId} className="p-4 hover:bg-red-50/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{tx.employee_name}</p>
                        <p className="text-xs text-gray-500">{tx.department}</p>
                      </div>
                      <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {daysOverdue}d overdue
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Due: {tx.return_date}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
