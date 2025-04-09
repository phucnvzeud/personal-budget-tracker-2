import React, { useState } from 'react';
import { format, isToday } from 'date-fns';
import { DayData, FinancialEntry } from '../types';
import './DailyView.css';

interface DailyViewProps {
  dayData: DayData;
  onAddEntry: (entry: Omit<FinancialEntry, 'id'>) => void;
  onUpdateEntry: (entry: FinancialEntry) => void;
  onDeleteEntry: (id: string) => void;
}

export const DailyView: React.FC<DailyViewProps> = ({
  dayData,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry
}) => {
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [newEntry, setNewEntry] = useState<Omit<FinancialEntry, 'id'>>({
    date: dayData.date,
    amount: 0,
    description: '',
    type: 'expense'
  });
  const [isRunningBalance, setIsRunningBalance] = useState(false);

  const handleAddEntry = () => {
    if (!newEntry.description || newEntry.amount <= 0) {
      alert('Please enter a description and a valid amount');
      return;
    }
    
    onAddEntry({
      ...newEntry,
      date: dayData.date
    });
    
    setShowEntryForm(false);
    setNewEntry({
      date: dayData.date,
      amount: 0,
      description: '',
      type: 'expense'
    });
  };

  const handleEntryTypeChange = (type: 'income' | 'expense') => {
    setNewEntry({ ...newEntry, type });
  };

  const toggleBalanceView = () => {
    setIsRunningBalance(!isRunningBalance);
  };

  return (
    <div className="daily-view">
      <div className="daily-header">
        <h2>{format(dayData.date, 'EEEE, MMMM d, yyyy')}</h2>
        {isToday(dayData.date) && <span className="today-badge">Today</span>}
      </div>

      <div className="daily-summary">
        <div className="summary-card income">
          <div className="summary-label">Income</div>
          <div className="summary-value">${dayData.totalIncome.toFixed(2)}</div>
        </div>
        <div className="summary-card expense">
          <div className="summary-label">Expenses</div>
          <div className="summary-value">${dayData.totalExpenses.toFixed(2)}</div>
        </div>
        <div className="summary-card balance" onClick={toggleBalanceView}>
          <div className="summary-label">{isRunningBalance ? 'Running Balance' : 'Daily Balance'}</div>
          <div className={`summary-value ${
            (isRunningBalance ? dayData.runningBalance : dayData.dailyBalance) >= 0 
              ? 'positive' 
              : 'negative'
          }`}>
            ${Math.abs(isRunningBalance ? dayData.runningBalance : dayData.dailyBalance).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="quick-add-section">
        <div className="quick-add-buttons">
          <button
            className="quick-add-button income"
            onClick={() => {
              handleEntryTypeChange('income');
              setShowEntryForm(true);
            }}
          >
            + Income
          </button>
          <button
            className="quick-add-button expense"
            onClick={() => {
              handleEntryTypeChange('expense');
              setShowEntryForm(true);
            }}
          >
            + Expense
          </button>
        </div>

        {showEntryForm && (
          <div className="entry-form">
            <div className="form-header">
              <h3>Add {newEntry.type === 'income' ? 'Income' : 'Expense'}</h3>
              <button className="close-button" onClick={() => setShowEntryForm(false)}>×</button>
            </div>
            <div className="form-group">
              <label htmlFor="amount">Amount:</label>
              <input
                type="number"
                id="amount"
                placeholder="Amount"
                value={newEntry.amount || ''}
                onChange={(e) => setNewEntry({ ...newEntry, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description:</label>
              <input
                type="text"
                id="description"
                placeholder="Description"
                value={newEntry.description}
                onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button onClick={() => setShowEntryForm(false)} className="cancel-button">Cancel</button>
              <button onClick={handleAddEntry} className="add-button">Add {newEntry.type}</button>
            </div>
          </div>
        )}
      </div>

      <div className="entries-section">
        <div className="section-header">
          <h3>Entries</h3>
        </div>

        <div className="entries-list">
          {dayData.entries.length === 0 ? (
            <div className="no-entries">No entries for this day</div>
          ) : (
            dayData.entries.map((entry) => (
              <div key={entry.id} className={`entry ${entry.type}`}>
                <div className="entry-content">
                  <div className="entry-description">{entry.description}</div>
                  <div className="entry-amount">${entry.amount.toFixed(2)}</div>
                </div>
                <div className="entry-actions">
                  <button
                    className="edit-button"
                    onClick={() => {
                      const newDescription = prompt('New description:', entry.description);
                      if (newDescription !== null) {
                        onUpdateEntry({ ...entry, description: newDescription });
                      }
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this entry?')) {
                        onDeleteEntry(entry.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}; 