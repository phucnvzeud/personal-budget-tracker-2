import React from 'react';
import { YearData } from '../types';
import './YearView.css';

interface YearViewProps {
  yearData: YearData;
  onMonthClick: (month: number) => void;
}

// Month names for the display
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const YearView: React.FC<YearViewProps> = ({ yearData, onMonthClick }) => {
  // Calculate maximum values for visualization scaling
  const maxIncome = Math.max(...yearData.months.map(month => month.totalIncome));
  const maxExpense = Math.max(...yearData.months.map(month => month.totalExpenses));
  const maxValue = Math.max(maxIncome, maxExpense, 1); // Ensure we don't divide by zero
  
  return (
    <div className="year-view">
      <h2 className="year-title">{yearData.year} Overview</h2>
      
      <div className="year-summary">
        <div className="year-summary-item">
          <div className="summary-label">Total Income:</div>
          <div className="summary-value income">${yearData.totalIncome.toFixed(2)}</div>
        </div>
        <div className="year-summary-item">
          <div className="summary-label">Total Expenses:</div>
          <div className="summary-value expense">${yearData.totalExpenses.toFixed(2)}</div>
        </div>
        <div className="year-summary-item">
          <div className="summary-label">Yearly Balance:</div>
          <div className={`summary-value ${yearData.yearlyBalance >= 0 ? 'income' : 'expense'}`}>
            ${yearData.yearlyBalance.toFixed(2)}
          </div>
        </div>
      </div>
      
      <div className="month-grid">
        {yearData.months.map((month) => (
          <div
            key={month.month}
            className={`month-card ${month.monthlyBalance >= 0 ? 'positive' : 'negative'}`}
            onClick={() => onMonthClick(month.month)}
          >
            <div className="month-header">
              <h3 className="month-name">{MONTH_NAMES[month.month]}</h3>
            </div>
            
            <div className="month-chart">
              <div className="chart-bar income-bar" style={{ 
                height: `${(month.totalIncome / maxValue) * 100}%`,
                opacity: month.totalIncome > 0 ? 1 : 0.2
              }}></div>
              <div className="chart-bar expense-bar" style={{ 
                height: `${(month.totalExpenses / maxValue) * 100}%`,
                opacity: month.totalExpenses > 0 ? 1 : 0.2
              }}></div>
            </div>
            
            <div className="month-data">
              <div className="month-income">
                <small>Income</small>
                <div>${month.totalIncome.toFixed(2)}</div>
              </div>
              <div className="month-expenses">
                <small>Expenses</small>
                <div>${month.totalExpenses.toFixed(2)}</div>
              </div>
            </div>
            
            <div className={`month-balance ${month.monthlyBalance >= 0 ? 'positive' : 'negative'}`}>
              <small>Balance</small>
              <div>${Math.abs(month.monthlyBalance).toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 