import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  History,
  Package,
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  Inbox,
} from 'lucide-react';
import { borrowingAPI } from '../api/client';
import StatusBadge from '../components/StatusBadge';

export default function HistoryPage() {
  const [nik, setNik] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const handleSearch = async () => {
    if (!nik.trim()) {
      setError('Please enter your NIK');
      return;
    }
    setLoading(true);
    setError('');
    setTransactions([]);
    setSearched(true);
    try {
      const res = await borrowingAPI.getHistory(nik.trim());
      setTransactions(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch history.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <History className="w-7 h-7 text-primary-600" />
          Borrowing History
        </h1>
        <p className="mt-1 text-sm text-gray-500">Look up your equipment borrowing history by NIK</p>
      </div>

      {/* Search Bar */}
      <div className="card p-4 sm:p-6 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={nik}
            onChange={(e) => {
              setNik(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter your NIK to search..."
            className="input-field flex-1"
            autoFocus
          />
          <button
            onClick={handleSearch}
            disabled={loading || !nik.trim()}
            className="btn-primary whitespace-nowrap"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Search className="w-4 h-4 mr-1.5" />
                Search
              </>
            )}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {/* Results */}
      {loading && (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Searching history...</p>
        </div>
      )}

      {!loading && searched && transactions.length === 0 && (
        <div className="text-center py-12">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">No Records Found</h3>
          <p className="text-sm text-gray-500 mt-1">No borrowing history found for NIK: {nik}</p>
          <Link to="/borrow" className="btn-primary mt-4 inline-flex">
            Borrow Equipment
          </Link>
        </div>
      )}

      {!loading && transactions.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Found <span className="font-semibold text-gray-700">{transactions.length}</span> transaction(s)
          </p>

          {transactions.map((tx) => {
            const isExpanded = expandedId === (tx.transaction_id || tx.id);
            const txId = tx.transaction_id || tx.id;
            const items = tx.details || tx.items || [];

            return (
              <div key={txId} className="card overflow-hidden">
                {/* Summary Row */}
                <button
                  onClick={() => toggleExpand(txId)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-sm font-bold text-primary-700 font-mono">{txId}</span>
                      <StatusBadge status={tx.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {tx.borrow_date} - {tx.return_date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5" />
                        {items.length} item(s)
                      </span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                  )}
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100">
                    <div className="pt-4">
                      {/* Items Table */}
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Borrowed Items</h4>
                      <div className="bg-gray-50 rounded-lg overflow-hidden mb-4">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3 font-medium text-gray-600">Item</th>
                              <th className="text-right py-2 px-3 font-medium text-gray-600">Qty</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, idx) => (
                              <tr key={idx} className="border-b border-gray-100 last:border-0">
                                <td className="py-2 px-3 text-gray-900">{item.item_name}</td>
                                <td className="py-2 px-3 text-right font-semibold">{item.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Additional Details */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Employee:</span>{' '}
                          <span className="font-medium">{tx.employee_name}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Department:</span>{' '}
                          <span className="font-medium">{tx.department}</span>
                        </div>
                        {tx.actual_return_date && (
                          <div>
                            <span className="text-gray-500">Returned:</span>{' '}
                            <span className="font-medium">{tx.actual_return_date}</span>
                          </div>
                        )}
                      </div>

                      {tx.notes && (
                        <div className="mt-3">
                          <span className="text-sm text-gray-500">Notes: </span>
                          <span className="text-sm text-gray-700">{tx.notes}</span>
                        </div>
                      )}

                      <div className="mt-4">
                        <Link
                          to={`/confirmation/${txId}`}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                        >
                          <FileText className="w-4 h-4" />
                          View Full Details
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
