import React, { useState, useEffect } from 'react';
import { FinancialEntry } from '../types';
import { format } from 'date-fns';
import './FinancialEntryForm.css';

interface FinancialEntryFormProps {
  entry: FinancialEntry | null;
  onSave: (entry: Omit<FinancialEntry, 'id'>) => void;
  onCancel: () => void;
}

export const FinancialEntryForm: React.FC<FinancialEntryFormProps> = ({
  entry,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Omit<FinancialEntry, 'id'>>({
    date: new Date(),
    amount: 0,
    description: '',
    type: 'expense',
  });

  useEffect(() => {
    if (entry) {
      setFormData({
        date: entry.date,
        amount: entry.amount,
        description: entry.description,
        type: entry.type,
      });
    }
  }, [entry]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="financial-entry-form-container">
      <form onSubmit={handleSubmit} className="financial-entry-form">
        <h2>{entry ? 'Edit Entry' : 'Add New Entry'}</h2>
        
        <div className="form-group">
          <label htmlFor="date">Date:</label>
          <input
            type="date"
            id="date"
            value={format(formData.date, 'yyyy-MM-dd')}
            onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">Type:</label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
            required
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount:</label>
          <input
            type="number"
            id="amount"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
            required
            min="0"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <input
            type="text"
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button type="submit">Save</button>
        </div>
      </form>
    </div>
  );
}; 