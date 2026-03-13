import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Mail,
  RotateCcw,
  Loader2,
  RefreshCw,
  CheckCircle,
  Clock,
  Send,
  Inbox,
  User,
  Calendar,
  Package,
} from 'lucide-react';
import { adminAPI, borrowingAPI } from '../../api/client';
import { useToast } from '../../components/Toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';

export default function OverduePage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Action states
  const [returnTx, setReturnTx] = useState(null);
  const [returning, setReturning] = useState(false);
  const [remindingId, setRemindingId] = useState(null);
  const [bulkReminding, setBulkReminding] = useState(false);

  const fetchOverdue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAPI.getOverdue();
      setTransactions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdue();
  }, []);

  // Mark returned
  const handleReturn = async () => {
    if (!returnTx) return;
    setReturning(true);
    try {
      const txId = returnTx.transaction_id || returnTx.id;
      await borrowingAPI.markReturned(txId);
      toast.success('Transaction marked as returned.');
      setReturnTx(null);
      fetchOverdue();
    } catch (err) {
      toast.error(err.message || 'Failed to mark as returned.');
    } finally {
      setReturning(false);
    }
  };

  // Send single reminder
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

  // Send all reminders
  const handleBulkRemind = async () => {
    setBulkReminding(true);
    let successCount = 0;
    let failCount = 0;

    for (const tx of transactions) {
      const txId = tx.transaction_id || tx.id;
      try {
        await adminAPI.sendReminder(txId);
        successCount++;
      } catch {
        failCount++;
      }
    }

    setBulkReminding(false);
    if (failCount === 0) {
      toast.success(`Reminders sent to all ${successCount} overdue borrowers.`);
    } else {
      toast.warning(`Sent ${successCount} reminders. ${failCount} failed.`);
    }
  };

  if (loading) return <LoadingSpinner text="Loading overdue transactions..." />;

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900">Failed to load overdue data</h3>
        <p className="text-sm text-gray-500 mt-1 mb-4">{error}</p>
        <button onClick={fetchOverdue} className="btn-primary">
          <RefreshCw className="w-4 h-4 mr-1.5" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-red-500" />
            Overdue Items
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {transactions.length} overdue transaction{transactions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchOverdue} className="btn-secondary">
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh
          </button>
          {transactions.length > 0 && (
            <button
              onClick={handleBulkRemind}
              disabled={bulkReminding}
              className="btn-primary"
            >
              {bulkReminding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-1.5" />
                  Send All Reminders
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {transactions.length === 0 ? (
        <div className="card text-center py-16">
          <CheckCircle className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900">All Clear!</h3>
          <p className="text-sm text-gray-500 mt-2">No overdue transactions at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => {
            const txId = tx.transaction_id || tx.id;
            const daysOverdue = tx.days_overdue || 0;
            const items = tx.details || tx.items || [];
            const isReminding = remindingId === txId;

            // Severity based on days overdue
            let severityClass = 'border-amber-200 bg-amber-50';
            let severityBadge = 'bg-amber-100 text-amber-700';
            if (daysOverdue > 14) {
              severityClass = 'border-red-300 bg-red-50';
              severityBadge = 'bg-red-100 text-red-700';
            } else if (daysOverdue > 7) {
              severityClass = 'border-orange-200 bg-orange-50';
              severityBadge = 'bg-orange-100 text-orange-700';
            }

            return (
              <div
                key={txId}
                className={`rounded-xl border-2 p-5 transition-all ${severityClass}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-gray-600">
                        {txId?.toString().slice(0, 14)}...
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${severityBadge}`}>
                        <Clock className="w-3 h-3 inline mr-1" />
                        {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                      {/* Employee */}
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{tx.employee_name}</p>
                          <p className="text-xs text-gray-500">{tx.department}</p>
                          <p className="text-xs text-gray-400">{tx.nik}</p>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Borrowed: <span className="font-medium text-gray-700">{tx.borrow_date}</span></p>
                          <p className="text-xs text-gray-500">Due: <span className="font-bold text-red-600">{tx.return_date}</span></p>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="flex items-start gap-2">
                        <Package className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          {items.map((item, idx) => (
                            <p key={idx} className="text-xs text-gray-700">
                              {item.item_name} <span className="font-semibold">x{item.quantity}</span>
                            </p>
                          ))}
                          {items.length === 0 && (
                            <p className="text-xs text-gray-400">No item details</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setReturnTx(tx)}
                      className="btn-success text-sm flex-1 sm:flex-none sm:w-full"
                    >
                      <RotateCcw className="w-4 h-4 mr-1.5" />
                      Mark Returned
                    </button>
                    <button
                      onClick={() => handleReminder(txId)}
                      disabled={isReminding}
                      className="btn-secondary text-sm flex-1 sm:flex-none sm:w-full"
                    >
                      {isReminding ? (
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4 mr-1.5" />
                      )}
                      Send Reminder
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Return Confirmation Modal */}
      <ConfirmModal
        isOpen={!!returnTx}
        onClose={() => setReturnTx(null)}
        onConfirm={handleReturn}
        title="Mark as Returned"
        message={`Confirm that ${returnTx?.employee_name} has returned all items for this transaction?`}
        confirmText="Mark Returned"
        variant="success"
        loading={returning}
      />
    </div>
  );
}
