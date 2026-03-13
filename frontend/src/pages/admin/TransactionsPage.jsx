import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Mail,
  RotateCcw,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Inbox,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileDown,
} from 'lucide-react';
import { adminAPI, borrowingAPI } from '../../api/client';
import { useToast } from '../../components/Toast';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';

const PAGE_SIZE = 20;

export default function TransactionsPage() {
  const { toast } = useToast();

  // Data
  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  // Actions
  const [returnTx, setReturnTx] = useState(null);
  const [returning, setReturning] = useState(false);
  const [remindingId, setRemindingId] = useState(null);
  const [exporting, setExporting] = useState('');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
      };
      if (status) params.status = status;
      if (department) params.department = department;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (search) params.search = search;

      const res = await adminAPI.getTransactions(params);
      const data = res.data;

      if (Array.isArray(data)) {
        setTransactions(data);
        setTotalCount(data.length);
      } else {
        setTransactions(data.items || data.transactions || []);
        setTotalCount(data.total || data.count || (data.items || data.transactions || []).length);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, status, department, dateFrom, dateTo, search]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reset page when filters change
  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setPage(0);
  };

  // Mark returned
  const handleReturn = async () => {
    if (!returnTx) return;
    setReturning(true);
    try {
      const txId = returnTx.transaction_id || returnTx.id;
      await borrowingAPI.markReturned(txId);
      toast.success('Transaction marked as returned.');
      setReturnTx(null);
      fetchTransactions();
    } catch (err) {
      toast.error(err.message || 'Failed to mark as returned.');
    } finally {
      setReturning(false);
    }
  };

  // Send reminder
  const handleReminder = async (txId) => {
    setRemindingId(txId);
    try {
      await adminAPI.sendReminder(txId);
      toast.success('Reminder sent successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to send reminder.');
    } finally {
      setRemindingId(null);
    }
  };

  // Export
  const handleExport = async (type) => {
    setExporting(type);
    try {
      const res = type === 'excel' ? await adminAPI.exportExcel() : await adminAPI.exportPdf();
      const blob = new Blob([res.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'excel' ? 'transactions.xlsx' : 'transactions.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${type.toUpperCase()} exported successfully.`);
    } catch (err) {
      toast.error(err.message || `Failed to export ${type}.`);
    } finally {
      setExporting('');
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all borrowing transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('excel')}
            disabled={!!exporting}
            className="btn-secondary text-sm"
          >
            {exporting === 'excel' ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            )}
            Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={!!exporting}
            className="btn-secondary text-sm"
          >
            {exporting === 'pdf' ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 mr-1.5" />
            )}
            PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleFilterChange(setSearch)(e.target.value)}
              placeholder="Search by name, NIK, ID..."
              className="input-field pl-10 text-sm"
            />
          </div>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => handleFilterChange(setStatus)(e.target.value)}
            className="input-field text-sm"
          >
            <option value="">All Statuses</option>
            <option value="BORROWED">Borrowed</option>
            <option value="RETURNED">Returned</option>
            <option value="OVERDUE">Overdue</option>
          </select>

          {/* Date From */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => handleFilterChange(setDateFrom)(e.target.value)}
            className="input-field text-sm"
            placeholder="From date"
          />

          {/* Date To */}
          <input
            type="date"
            value={dateTo}
            onChange={(e) => handleFilterChange(setDateTo)(e.target.value)}
            className="input-field text-sm"
            placeholder="To date"
          />
        </div>

        {/* Department filter as text since we may not know all departments */}
        <div className="mt-3">
          <input
            type="text"
            value={department}
            onChange={(e) => handleFilterChange(setDepartment)(e.target.value)}
            placeholder="Filter by department..."
            className="input-field text-sm max-w-xs"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Loading transactions..." />
      ) : error ? (
        <div className="text-center py-12">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button onClick={fetchTransactions} className="btn-primary">
            <RefreshCw className="w-4 h-4 mr-1.5" /> Retry
          </button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">No transactions found</h3>
          <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Employee</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden md:table-cell">Department</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden lg:table-cell">Items</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden sm:table-cell">Borrow</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 hidden sm:table-cell">Return</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const txId = tx.transaction_id || tx.id;
                    const items = tx.details || tx.items || [];
                    const isBorrowed = tx.status === 'BORROWED';
                    const isOverdue = tx.status === 'OVERDUE';
                    const canReturn = isBorrowed || isOverdue;
                    const canRemind = isBorrowed || isOverdue;

                    return (
                      <tr key={txId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs font-semibold text-primary-700">
                            {txId?.toString().slice(0, 10)}...
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{tx.employee_name}</p>
                          <p className="text-xs text-gray-500">{tx.nik}</p>
                        </td>
                        <td className="py-3 px-4 text-gray-600 hidden md:table-cell">{tx.department}</td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          <div className="max-w-[200px]">
                            {items.slice(0, 2).map((item, idx) => (
                              <span key={idx} className="text-xs text-gray-600">
                                {item.item_name} (x{item.quantity}){idx < Math.min(items.length, 2) - 1 ? ', ' : ''}
                              </span>
                            ))}
                            {items.length > 2 && (
                              <span className="text-xs text-gray-400"> +{items.length - 2} more</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 hidden sm:table-cell whitespace-nowrap">
                          {tx.borrow_date}
                        </td>
                        <td className="py-3 px-4 text-gray-600 hidden sm:table-cell whitespace-nowrap">
                          {tx.return_date}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={tx.status} />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            {canReturn && (
                              <button
                                onClick={() => setReturnTx(tx)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Mark Returned"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                            {canRemind && (
                              <button
                                onClick={() => handleReminder(txId)}
                                disabled={remindingId === txId}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Send Reminder"
                              >
                                {remindingId === txId ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Mail className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="btn-secondary text-sm py-2 px-3"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-700 font-medium px-2">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="btn-secondary text-sm py-2 px-3"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Return Confirmation Modal */}
      <ConfirmModal
        isOpen={!!returnTx}
        onClose={() => setReturnTx(null)}
        onConfirm={handleReturn}
        title="Mark as Returned"
        message={`Mark transaction ${(returnTx?.transaction_id || returnTx?.id || '').toString().slice(0, 12)}... by ${returnTx?.employee_name} as returned?`}
        confirmText="Mark Returned"
        variant="success"
        loading={returning}
      />
    </div>
  );
}
