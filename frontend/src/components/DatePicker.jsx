import { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diff = d2 - d1;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function DatePicker({ borrowDate, returnDate, onBorrowDateChange, onReturnDateChange }) {
  const today = formatDate(new Date());
  const [daysCount, setDaysCount] = useState(() => {
    if (borrowDate && returnDate) {
      return daysBetween(borrowDate, returnDate);
    }
    return 7;
  });
  const [mode, setMode] = useState('days'); // 'days' or 'date'

  // Initialize dates
  useEffect(() => {
    if (!borrowDate) {
      onBorrowDateChange(today);
    }
    if (!returnDate) {
      onReturnDateChange(formatDate(addDays(new Date(), 7)));
    }
  }, []);

  const handleDaysChange = (days) => {
    const num = parseInt(days) || 1;
    setDaysCount(num);
    if (borrowDate && num > 0) {
      onReturnDateChange(formatDate(addDays(new Date(borrowDate), num)));
    }
  };

  const handleReturnDateChange = (date) => {
    onReturnDateChange(date);
    if (borrowDate) {
      setDaysCount(daysBetween(borrowDate, date));
    }
  };

  const handleBorrowDateChange = (date) => {
    onBorrowDateChange(date);
    if (mode === 'days' && daysCount > 0) {
      onReturnDateChange(formatDate(addDays(new Date(date), daysCount)));
    }
  };

  const duration = borrowDate && returnDate ? daysBetween(borrowDate, returnDate) : 0;

  const quickDays = [1, 3, 7, 14, 30];

  return (
    <div className="space-y-5">
      {/* Borrow Date */}
      <div>
        <label className="label flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          Borrow Date
        </label>
        <input
          type="date"
          value={borrowDate || today}
          min={today}
          onChange={(e) => handleBorrowDateChange(e.target.value)}
          className="input-field"
        />
      </div>

      {/* Return Date Mode Toggle */}
      <div>
        <label className="label">Return Date Method</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('days')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors
              ${mode === 'days'
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
          >
            <Clock className="w-4 h-4 inline mr-1.5" />
            By Duration
          </button>
          <button
            type="button"
            onClick={() => setMode('date')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors
              ${mode === 'date'
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
          >
            <Calendar className="w-4 h-4 inline mr-1.5" />
            Pick Date
          </button>
        </div>
      </div>

      {mode === 'days' ? (
        <div>
          <label className="label">Number of Days</label>
          {/* Quick select buttons */}
          <div className="flex flex-wrap gap-2 mb-3">
            {quickDays.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleDaysChange(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
                  ${daysCount === d
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {d} {d === 1 ? 'day' : 'days'}
              </button>
            ))}
          </div>
          <input
            type="number"
            min="1"
            max="365"
            value={daysCount}
            onChange={(e) => handleDaysChange(e.target.value)}
            className="input-field"
            placeholder="Enter number of days"
          />
        </div>
      ) : (
        <div>
          <label className="label flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            Return Date
          </label>
          <input
            type="date"
            value={returnDate || ''}
            min={borrowDate || today}
            onChange={(e) => handleReturnDateChange(e.target.value)}
            className="input-field"
          />
        </div>
      )}

      {/* Duration Summary */}
      {duration > 0 && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Borrowing Duration</p>
              <p className="text-2xl font-bold text-blue-900 mt-0.5">
                {duration} {duration === 1 ? 'day' : 'days'}
              </p>
            </div>
            <div className="text-right text-sm text-blue-700">
              <p>{borrowDate} <span className="text-blue-400">to</span></p>
              <p className="font-semibold">{returnDate}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
