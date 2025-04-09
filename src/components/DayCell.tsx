import React, { useState } from 'react';
import { format, isToday } from 'date-fns';
import { DayData, FinancialEntry } from '../types';
import './DayCell.css';

interface DayCellProps {
  dayData: DayData;
  onAddEntry: (entry: Omit<FinancialEntry, 'id'>) => void;
  onUpdateEntry: (entry: FinancialEntry) => void;
  onDeleteEntry: (id: string) => void;
}

export const DayCell: React.FC<DayCellProps> = ({ dayData, onAddEntry, onUpdateEntry, onDeleteEntry }) => {
  const [showForm, setShowForm] = useState(false);
  const [showRunningBalance, setShowRunningBalance] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinancialEntry | null>(null);
  const [newEntry, setNewEntry] = useState<{
    amount: string;
    description: string;
    type: 'income' | 'expense';
  }>({
    amount: '',
    description: '',
    type: 'expense'
  });

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newEntry.amount);
    if (isNaN(amount) || amount <= 0) return;

    onAddEntry({
      date: dayData.date,
      amount,
      description: newEntry.description,
      type: newEntry.type
    });

    // Reset form
    setNewEntry({
      amount: '',
      description: '',
      type: 'expense'
    });
    setShowForm(false);
  };

  const handleEditEntry = (entry: FinancialEntry) => {
    setEditingEntry(entry);
    setNewEntry({
      amount: entry.amount.toString(),
      description: entry.description,
      type: entry.type
    });
    setShowForm(true);
  };

  const handleUpdateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingEntry) return;
    
    const amount = parseFloat(newEntry.amount);
    if (isNaN(amount) || amount <= 0) return;
    
    onUpdateEntry({
      ...editingEntry,
      amount,
      description: newEntry.description,
      type: newEntry.type
    });
    
    // Reset form
    setNewEntry({
      amount: '',
      description: '',
      type: 'expense'
    });
    setEditingEntry(null);
    setShowForm(false);
  };

  const cancelForm = () => {
    setNewEntry({
      amount: '',
      description: '',
      type: 'expense'
    });
    setEditingEntry(null);
    setShowForm(false);
  };

  const isCurrentDay = isToday(dayData.date);
  const dayClasses = `day-cell ${dayData.dailyBalance >= 0 ? 'positive' : 'negative'} ${isCurrentDay ? 'current-day' : ''}`;
  
  return (
    <div className={dayClasses}>
      <div className="day-header">
        <span className="day-number">{format(dayData.date, 'd')}</span>
      </div>
      
      <div className="day-content">
        {dayData.entries.map((entry) => (
          <div 
            key={entry.id} 
            className={`entry ${entry.type === 'income' ? 'income' : 'expense'}`}
          >
            <span className="entry-content">
              ${entry.amount.toFixed(2)} {entry.description}
            </span>
            <div className="entry-actions">
              <button
                className="entry-action edit"
                onClick={() => handleEditEntry(entry)}
                title="Edit"
              >
                ✎
              </button>
              <button
                className="entry-action delete"
                onClick={() => onDeleteEntry(entry.id)}
                title="Delete"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="day-footer">
        <div className="day-totals">
          <div className="expense-total">-${dayData.totalExpenses.toFixed(2)}</div>
          <div className="income-total">+${dayData.totalIncome.toFixed(2)}</div>
        </div>
        
        <div 
          className={`day-balance ${dayData.dailyBalance >= 0 ? 'positive' : 'negative'}`}
          onClick={() => setShowRunningBalance(!showRunningBalance)}
        >
          {showRunningBalance 
            ? `Running: ${dayData.runningBalance >= 0 ? '+' : ''}$${dayData.runningBalance.toFixed(2)}`
            : `${dayData.dailyBalance >= 0 ? '+' : ''}$${dayData.dailyBalance.toFixed(2)}`}
        </div>
      </div>
      
      {!showForm ? (
        <div className="add-entry-button" onClick={() => setShowForm(true)}>
          +
        </div>
      ) : (
        <form className="entry-form" onSubmit={editingEntry ? handleUpdateEntry : handleAddEntry}>
          <select
            value={newEntry.type}
            onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value as 'income' | 'expense' })}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          
          <input
            type="number"
            placeholder="Amount"
            value={newEntry.amount}
            onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
            step="0.01"
            min="0.01"
            required
          />
          
          <input
            type="text"
            placeholder="Description"
            value={newEntry.description}
            onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
          />
          
          <div className="form-actions">
            <button type="submit">{editingEntry ? 'Update' : 'Add'}</button>
            <button type="button" onClick={cancelForm}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}; 