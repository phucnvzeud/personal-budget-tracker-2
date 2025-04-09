import React, { useState } from 'react';
import { RecurringPayment, RecurringScheduleType } from '../types';
import { format } from 'date-fns';
import './RecurringPayments.css';

interface RecurringPaymentsProps {
  recurringPayments: RecurringPayment[];
  onAddRecurringPayment: (payment: Omit<RecurringPayment, 'id'>) => void;
  onUpdateRecurringPayment: (payment: RecurringPayment) => void;
  onDeleteRecurringPayment: (id: string) => void;
}

export const RecurringPayments: React.FC<RecurringPaymentsProps> = ({
  recurringPayments,
  onAddRecurringPayment,
  onUpdateRecurringPayment,
  onDeleteRecurringPayment,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPayment, setNewPayment] = useState<Omit<RecurringPayment, 'id'>>({
    description: '',
    amount: 0,
    type: 'expense',
    scheduleType: 'specific-date',
    frequency: 'monthly',
    dayOfMonth: 1,
    startDate: new Date(),
    validFrom: new Date(),
    isActive: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddRecurringPayment(newPayment);
    setNewPayment({
      description: '',
      amount: 0,
      type: 'expense',
      scheduleType: 'specific-date',
      frequency: 'monthly',
      dayOfMonth: 1,
      startDate: new Date(),
      validFrom: new Date(),
      isActive: true,
    });
    setShowAddForm(false);
  };

  // Helper to format the schedule information in a human-readable way
  const formatSchedule = (payment: RecurringPayment): string => {
    let scheduleText = '';
    
    switch (payment.scheduleType) {
      case 'specific-date':
        if (payment.frequency === 'monthly' && payment.dayOfMonth) {
          scheduleText = `Every month on the ${payment.dayOfMonth}${getDaySuffix(payment.dayOfMonth)}`;
        } else if (payment.frequency === 'yearly' && payment.dayOfMonth) {
          const date = new Date(payment.startDate);
          scheduleText = `Every year on ${format(date, 'MMMM')} ${payment.dayOfMonth}${getDaySuffix(payment.dayOfMonth)}`;
        }
        break;
      case 'weekdays-only':
        scheduleText = 'Every weekday (Monday to Friday)';
        break;
      case 'weekends-only':
        scheduleText = 'Every weekend (Saturday and Sunday)';
        break;
      case 'custom-range':
        scheduleText = `From ${format(payment.startDate, 'MMM dd, yyyy')}`;
        if (payment.endDate) {
          scheduleText += ` to ${format(payment.endDate, 'MMM dd, yyyy')}`;
        }
        break;
    }

    // Add frequency if not implied by the schedule type
    if (!scheduleText.includes('Every') && payment.frequency) {
      scheduleText = `${capitalizeFirstLetter(payment.frequency)}, ${scheduleText}`;
    }

    return scheduleText;
  };

  // Helper to get day suffix (1st, 2nd, 3rd, etc.)
  const getDaySuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const capitalizeFirstLetter = (string: string): string => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return (
    <div className="recurring-payments">
      <h2>Recurring Payments & Income</h2>
      <button onClick={() => setShowAddForm(!showAddForm)} className="add-button">
        {showAddForm ? 'Cancel' : 'Add New Recurring Payment/Income'}
      </button>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="recurring-payment-form">
          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <input
              type="text"
              id="description"
              value={newPayment.description}
              onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="amount">Amount:</label>
            <input
              type="number"
              id="amount"
              value={newPayment.amount}
              onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) })}
              required
              step="0.01"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="type">Type:</label>
            <select
              id="type"
              value={newPayment.type}
              onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value as 'income' | 'expense' })}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="scheduleType">Schedule Type:</label>
            <select
              id="scheduleType"
              value={newPayment.scheduleType}
              onChange={(e) => setNewPayment({ 
                ...newPayment, 
                scheduleType: e.target.value as RecurringScheduleType 
              })}
            >
              <option value="specific-date">Specific Date Each Month/Year</option>
              <option value="weekdays-only">Weekdays Only (Mon-Fri)</option>
              <option value="weekends-only">Weekends Only (Sat-Sun)</option>
              <option value="custom-range">Custom Date Range</option>
            </select>
          </div>
          
          {newPayment.scheduleType === 'specific-date' && (
            <>
              <div className="form-group">
                <label htmlFor="frequency">Frequency:</label>
                <select
                  id="frequency"
                  value={newPayment.frequency}
                  onChange={(e) => setNewPayment({ 
                    ...newPayment, 
                    frequency: e.target.value as RecurringPayment['frequency'] 
                  })}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="dayOfMonth">Day of Month:</label>
                <input
                  type="number"
                  id="dayOfMonth"
                  min="1"
                  max="31"
                  value={newPayment.dayOfMonth}
                  onChange={(e) => setNewPayment({ 
                    ...newPayment, 
                    dayOfMonth: parseInt(e.target.value) 
                  })}
                  required
                />
              </div>
            </>
          )}
          
          {newPayment.scheduleType === 'custom-range' && (
            <>
              <div className="form-group">
                <label htmlFor="frequency">Frequency:</label>
                <select
                  id="frequency"
                  value={newPayment.frequency}
                  onChange={(e) => setNewPayment({ 
                    ...newPayment, 
                    frequency: e.target.value as RecurringPayment['frequency'] 
                  })}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate">Start Date:</label>
                  <input
                    type="date"
                    id="startDate"
                    value={format(newPayment.startDate, 'yyyy-MM-dd')}
                    onChange={(e) => setNewPayment({ 
                      ...newPayment, 
                      startDate: new Date(e.target.value) 
                    })}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="endDate">End Date (Optional):</label>
                  <input
                    type="date"
                    id="endDate"
                    value={newPayment.endDate ? format(newPayment.endDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setNewPayment({ 
                      ...newPayment, 
                      endDate: e.target.value ? new Date(e.target.value) : undefined 
                    })}
                  />
                </div>
              </div>
            </>
          )}
          
          <div className="validity-section">
            <h3>Validity Period</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="validFrom">Valid From:</label>
                <input
                  type="date"
                  id="validFrom"
                  value={format(newPayment.validFrom, 'yyyy-MM-dd')}
                  onChange={(e) => setNewPayment({ 
                    ...newPayment, 
                    validFrom: new Date(e.target.value) 
                  })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="validUntil">Valid Until (Optional):</label>
                <input
                  type="date"
                  id="validUntil"
                  value={newPayment.validUntil ? format(newPayment.validUntil, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setNewPayment({ 
                    ...newPayment, 
                    validUntil: e.target.value ? new Date(e.target.value) : undefined 
                  })}
                />
              </div>
            </div>
          </div>
          
          <button type="submit" className="submit-button">Add Recurring Payment/Income</button>
        </form>
      )}

      <div className="recurring-payments-list">
        {recurringPayments.length === 0 ? (
          <p className="no-payments">No recurring payments or income added yet.</p>
        ) : (
          recurringPayments.map((payment) => (
            <div key={payment.id} className={`recurring-payment-item ${payment.type}`}>
              <div className="payment-info">
                <h3>{payment.description}</h3>
                <p className="amount">
                  <span className={payment.type === 'income' ? 'income-amount' : 'expense-amount'}>
                    ${payment.amount.toFixed(2)}
                  </span> 
                  <span className="type-badge">{payment.type}</span>
                </p>
                <p className="schedule">{formatSchedule(payment)}</p>
                <p className="validity">
                  Valid from {format(payment.validFrom, 'MMM dd, yyyy')}
                  {payment.validUntil && ` until ${format(payment.validUntil, 'MMM dd, yyyy')}`}
                </p>
                <p className="status">Status: <span className={payment.isActive ? 'active' : 'inactive'}>
                  {payment.isActive ? 'Active' : 'Inactive'}
                </span></p>
              </div>
              <div className="payment-actions">
                <button 
                  onClick={() => onUpdateRecurringPayment({
                    ...payment,
                    isActive: !payment.isActive
                  })}
                  className={payment.isActive ? 'deactivate-button' : 'activate-button'}
                >
                  {payment.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this recurring payment?')) {
                      onDeleteRecurringPayment(payment.id);
                    }
                  }}
                  className="delete-button"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 