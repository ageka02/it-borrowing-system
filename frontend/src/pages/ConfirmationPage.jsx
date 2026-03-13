import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle,
  ClipboardList,
  History,
  Printer,
  Package,
  Calendar,
  User,
  Hash,
} from 'lucide-react';
import { borrowingAPI } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';

export default function ConfirmationPage() {
  const { transactionId } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!transactionId) return;
    setLoading(true);
    borrowingAPI
      .getTransaction(transactionId)
      .then((res) => setTransaction(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [transactionId]);

  if (loading) return <LoadingSpinner text="Loading transaction details..." />;

  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Hash className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Transaction Not Found</h2>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <Link to="/borrow" className="btn-primary">
          <ClipboardList className="w-4 h-4 mr-1.5" />
          Borrow Equipment
        </Link>
      </div>
    );
  }

  if (!transaction) return null;

  const items = transaction.details || transaction.items || [];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success Banner */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Borrowing Confirmed!</h1>
        <p className="mt-2 text-sm text-gray-500">
          Your equipment borrowing request has been successfully recorded.
        </p>
      </div>

      {/* Transaction Card */}
      <div className="card p-6 sm:p-8 print:shadow-none print:border-2">
        {/* Transaction ID */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Transaction ID</p>
            <p className="text-lg font-bold text-primary-700 font-mono mt-0.5">
              {transaction.transaction_id || transactionId}
            </p>
          </div>
          <StatusBadge status={transaction.status} />
        </div>

        {/* Employee Info */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <User className="w-4 h-4" /> Employee Details
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">NIK:</span>{' '}
              <span className="font-medium">{transaction.nik}</span>
            </div>
            <div>
              <span className="text-gray-500">Name:</span>{' '}
              <span className="font-medium">{transaction.employee_name}</span>
            </div>
            <div>
              <span className="text-gray-500">Department:</span>{' '}
              <span className="font-medium">{transaction.department}</span>
            </div>
            {transaction.email && (
              <div>
                <span className="text-gray-500">Email:</span>{' '}
                <span className="font-medium">{transaction.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <Package className="w-4 h-4" /> Borrowed Items
          </h3>
          <div className="bg-gray-50 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2.5 px-4 font-medium text-gray-600">Item</th>
                  <th className="text-right py-2.5 px-4 font-medium text-gray-600">Qty</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 last:border-0">
                    <td className="py-2.5 px-4 text-gray-900">{item.item_name}</td>
                    <td className="py-2.5 px-4 text-right font-semibold text-gray-900">
                      {item.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dates */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4" /> Borrowing Period
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Borrow Date:</span>{' '}
              <span className="font-medium">{transaction.borrow_date}</span>
            </div>
            <div>
              <span className="text-gray-500">Return Date:</span>{' '}
              <span className="font-medium">{transaction.return_date}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {transaction.notes && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{transaction.notes}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 no-print">
        <Link to="/borrow" className="btn-primary flex-1 justify-center">
          <ClipboardList className="w-4 h-4 mr-1.5" />
          Borrow Again
        </Link>
        <Link to="/history" className="btn-secondary flex-1 justify-center">
          <History className="w-4 h-4 mr-1.5" />
          View History
        </Link>
        <button
          onClick={() => window.print()}
          className="btn-secondary flex-1 justify-center"
        >
          <Printer className="w-4 h-4 mr-1.5" />
          Print
        </button>
      </div>
    </div>
  );
}
