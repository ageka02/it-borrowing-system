import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Package,
  Calendar,
  ClipboardCheck,
  ArrowRight,
  ArrowLeft,
  Search,
  CheckCircle,
  Loader2,
  FileText,
} from 'lucide-react';
import { employeesAPI, borrowingAPI } from '../api/client';
import { useToast } from '../components/Toast';
import ItemSelector from '../components/ItemSelector';
import DatePicker from '../components/DatePicker';

const STEPS = [
  { id: 1, title: 'Employee', description: 'Verify your identity', icon: User },
  { id: 2, title: 'Items', description: 'Select equipment', icon: Package },
  { id: 3, title: 'Dates', description: 'Choose duration', icon: Calendar },
  { id: 4, title: 'Review', description: 'Confirm & submit', icon: ClipboardCheck },
];

export default function BorrowPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Employee data
  const [nik, setNik] = useState('');
  const [employee, setEmployee] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  // Step 2: Selected items
  const [selectedItems, setSelectedItems] = useState([]);

  // Step 3: Dates
  const [borrowDate, setBorrowDate] = useState('');
  const [returnDate, setReturnDate] = useState('');

  // Step 4: Notes
  const [notes, setNotes] = useState('');

  // Employee lookup
  const handleLookup = async () => {
    if (!nik.trim()) {
      setLookupError('Please enter your NIK');
      return;
    }
    setLookupLoading(true);
    setLookupError('');
    setEmployee(null);
    try {
      const res = await employeesAPI.getByNik(nik.trim());
      setEmployee(res.data);
    } catch (err) {
      setLookupError(err.message || 'Employee not found. Please check your NIK.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleNikKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLookup();
    }
  };

  // Navigation
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!employee;
      case 2:
        return selectedItems.length > 0;
      case 3:
        return !!borrowDate && !!returnDate;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Submit
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        nik: employee.nik,
        borrow_date: borrowDate,
        return_date: returnDate,
        items: selectedItems.map((si) => ({
          item_id: si.item_id,
          quantity: si.quantity,
        })),
        notes: notes.trim() || undefined,
      };
      const res = await borrowingAPI.create(payload);
      const txId = res.data?.transaction_id || res.data?.id;
      toast.success('Equipment borrowed successfully!');
      navigate(`/confirmation/${txId}`);
    } catch (err) {
      toast.error(err.message || 'Failed to submit borrowing request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Borrow Equipment</h1>
        <p className="mt-1 text-sm text-gray-500">Fill out the form to borrow IT equipment</p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                      ${isCompleted
                        ? 'bg-primary-600 border-primary-600'
                        : isActive
                          ? 'bg-primary-50 border-primary-600'
                          : 'bg-white border-gray-200'
                      }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    ) : (
                      <Icon
                        className={`w-5 h-5 sm:w-6 sm:h-6 ${
                          isActive ? 'text-primary-600' : 'text-gray-400'
                        }`}
                      />
                    )}
                  </div>
                  <div className="mt-2 text-center hidden sm:block">
                    <p
                      className={`text-xs font-semibold ${
                        isActive ? 'text-primary-700' : isCompleted ? 'text-primary-600' : 'text-gray-400'
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
                  </div>
                </div>

                {/* Connector Line */}
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors duration-300 ${
                      currentStep > step.id ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        {/* Mobile Step Label */}
        <div className="sm:hidden mt-3 text-center">
          <p className="text-sm font-semibold text-primary-700">
            Step {currentStep}: {STEPS[currentStep - 1].title}
          </p>
          <p className="text-xs text-gray-400">{STEPS[currentStep - 1].description}</p>
        </div>
      </div>

      {/* Step Content */}
      <div className="card p-6 sm:p-8">
        {/* Step 1: Employee Lookup */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Employee Verification</h2>
            <p className="text-sm text-gray-500 mb-6">Enter your NIK to look up your employee details</p>

            <div className="space-y-4">
              <div>
                <label className="label">NIK (Employee ID)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nik}
                    onChange={(e) => {
                      setNik(e.target.value);
                      setLookupError('');
                    }}
                    onKeyDown={handleNikKeyDown}
                    placeholder="Enter your NIK..."
                    className="input-field flex-1"
                    autoFocus
                  />
                  <button
                    onClick={handleLookup}
                    disabled={lookupLoading || !nik.trim()}
                    className="btn-primary whitespace-nowrap"
                  >
                    {lookupLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-1.5" />
                        Lookup
                      </>
                    )}
                  </button>
                </div>
                {lookupError && (
                  <p className="mt-2 text-sm text-red-600">{lookupError}</p>
                )}
              </div>

              {/* Employee Info Card */}
              {employee && (
                <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-700">Employee Verified</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">NIK</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{employee.nik}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Name</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{employee.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Department</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{employee.department}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{employee.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Item Selection */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Select Equipment</h2>
            <p className="text-sm text-gray-500 mb-6">Choose the items you need to borrow</p>
            <ItemSelector selectedItems={selectedItems} onItemsChange={setSelectedItems} />
          </div>
        )}

        {/* Step 3: Date Selection */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Borrowing Period</h2>
            <p className="text-sm text-gray-500 mb-6">Set your borrow and return dates</p>
            <DatePicker
              borrowDate={borrowDate}
              returnDate={returnDate}
              onBorrowDateChange={setBorrowDate}
              onReturnDateChange={setReturnDate}
            />
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {currentStep === 4 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Review & Submit</h2>
            <p className="text-sm text-gray-500 mb-6">Please review all details before submitting</p>

            <div className="space-y-4">
              {/* Employee Summary */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                  <User className="w-4 h-4" /> Employee
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">NIK:</span>{' '}
                    <span className="font-medium">{employee?.nik}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Name:</span>{' '}
                    <span className="font-medium">{employee?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Department:</span>{' '}
                    <span className="font-medium">{employee?.department}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>{' '}
                    <span className="font-medium">{employee?.email}</span>
                  </div>
                </div>
              </div>

              {/* Items Summary */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4" /> Items ({selectedItems.length})
                </h3>
                <div className="space-y-2">
                  {selectedItems.map((item) => (
                    <div key={item.item_id} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.item_name}</span>
                      <span className="font-semibold text-gray-900">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dates Summary */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4" /> Borrowing Period
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">From:</span>{' '}
                    <span className="font-medium">{borrowDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">To:</span>{' '}
                    <span className="font-medium">{returnDate}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="label flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" /> Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any additional notes or remarks..."
                  className="input-field resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`btn-secondary ${
              currentStep === 1 ? 'invisible' : ''
            }`}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back
          </button>

          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="btn-primary"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <ClipboardCheck className="w-4 h-4 mr-1.5" />
                  Submit Borrow Request
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
