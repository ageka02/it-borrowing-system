const STATUS_CONFIG = {
  BORROWED: {
    label: 'Borrowed',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  RETURNED: {
    label: 'Returned',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  OVERDUE: {
    label: 'Overdue',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status?.toUpperCase()] || {
    label: status || 'Unknown',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.className}`}
    >
      {config.label}
    </span>
  );
}
