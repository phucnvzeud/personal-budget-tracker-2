import React, { useState, useEffect } from 'react';
import {
  format,
  addMonths,
  subMonths,
  addYears,
  subYears,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  getDay,
  addDays,
  setMonth,
  addDays as addDaysToDate
} from 'date-fns';
import { DayCell } from './DayCell';
import { YearView } from './YearView';
import { DailyView } from './DailyView';
import { MonthData, FinancialEntry, CalendarViewType, YearData } from '../types';
import './Calendar.css';

interface CalendarProps {
  monthData: MonthData;
  yearData: YearData;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onAddEntry: (entry: Omit<FinancialEntry, 'id'>) => void;
  onUpdateEntry: (entry: FinancialEntry) => void;
  onDeleteEntry: (id: string) => void;
  view: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
}

export const Calendar: React.FC<CalendarProps> = ({
  monthData,
  yearData,
  currentDate,
  onDateChange,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  view,
  onViewChange
}) => {
  const [renderError, setRenderError] = useState<string | null>(null);

  // Debug logging
  useEffect(() => {
    console.log('Calendar component mounted with monthData:', monthData);
    console.log('Calendar view:', view);
  }, [monthData, view]);

  const handlePrevMonth = () => {
    onDateChange(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    onDateChange(addMonths(currentDate, 1));
  };

  const handlePrevYear = () => {
    onDateChange(subYears(currentDate, 1));
  };

  const handleNextYear = () => {
    onDateChange(addYears(currentDate, 1));
  };

  const handleMonthClick = (month: number) => {
    onDateChange(setMonth(currentDate, month));
    onViewChange('month');
  };

  const renderYearView = () => {
    try {
      return (
        <div>
          <div className="calendar-header">
            <button onClick={handlePrevYear}>&lt;</button>
            <h2>{yearData.year}</h2>
            <button onClick={handleNextYear}>&gt;</button>
          </div>
          
          <YearView yearData={yearData} onMonthClick={handleMonthClick} />
        </div>
      );
    } catch (error) {
      console.error('Error rendering year view:', error);
      setRenderError('Failed to render year view');
      return <div className="error-message">Failed to render year view. Please try again.</div>;
    }
  };

  const renderMonthlyView = () => {
    try {
      if (!monthData || !monthData.days) {
        return <div className="error-message">No calendar data available</div>;
      }

      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const startDate = monthStart;
      const endDate = monthEnd;

      const dateFormat = 'MMMM yyyy';
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      
      // Calculate day offset based on the day of the week the month starts
      const startDayOfWeek = getDay(monthStart);
      const placeholderDays = Array.from({ length: startDayOfWeek }, (_, i) => addDays(monthStart, -1 * (startDayOfWeek - i)));
      
      // Calculate remaining days to fill grid
      const endDayOfWeek = getDay(monthEnd);
      const remainingDays = 6 - endDayOfWeek;
      const appendDays = Array.from({ length: remainingDays }, (_, i) => addDays(monthEnd, i + 1));
      
      // Combine all days
      const allDays = [...placeholderDays, ...days, ...appendDays];
      
      // Create weeks
      const weeks: Date[][] = [];
      let week: Date[] = [];
      
      allDays.forEach((day, i) => {
        if (i % 7 === 0 && i > 0) {
          weeks.push(week);
          week = [];
        }
        week.push(day);
        if (i === allDays.length - 1) {
          weeks.push(week);
        }
      });

      return (
        <div className="calendar-container">
          <div className="calendar-header">
            <button onClick={handlePrevMonth}>&lt; Prev</button>
            <h2>{format(currentDate, dateFormat)}</h2>
            <button onClick={handleNextMonth}>Next &gt;</button>
          </div>
          
          <div className="weekdays">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>
          
          <div className="calendar-grid">
            {weeks.map((week, weekIndex) => (
              <div key={`week-${weekIndex}`} className="week">
                {week.map((day: Date) => {
                  const formattedDate = format(day, 'yyyy-MM-dd');
                  const dayData = monthData.days[formattedDate];
                  
                  // Use a placeholder for days outside current month
                  if (!isSameMonth(day, currentDate)) {
                    return <div key={formattedDate} className="day-cell-placeholder"></div>;
                  }
                  
                  // If dayData is not available for this date, create a default one
                  if (!dayData) {
                    console.warn(`Missing day data for ${formattedDate}`);
                    return <div key={formattedDate} className="day-cell-placeholder"></div>;
                  }
                  
                  return (
                    <DayCell
                      key={formattedDate}
                      dayData={dayData}
                      onAddEntry={onAddEntry}
                      onUpdateEntry={onUpdateEntry}
                      onDeleteEntry={onDeleteEntry}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          
          <div className="monthly-summary">
            <div className="summary-item">
              <div className="summary-label">Total Income:</div>
              <div className="summary-value income">${monthData.totalIncome.toFixed(2)}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Total Expenses:</div>
              <div className="summary-value expense">${monthData.totalExpenses.toFixed(2)}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Monthly Balance:</div>
              <div className={`summary-value ${monthData.monthlyBalance >= 0 ? 'income' : 'expense'}`}>
                ${monthData.monthlyBalance.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering monthly view:', error);
      setRenderError('Failed to render monthly calendar view');
      return <div className="error-message">Failed to render calendar. Please try again.</div>;
    }
  };

  const renderWeeklyView = () => {
    // For simplicity, we're just showing a message
    // In a real app, you would implement the weekly view
    return <div className="placeholder-view">Weekly view will be implemented here</div>;
  };

  const renderDailyView = () => {
    try {
      const formattedDate = format(currentDate, 'yyyy-MM-dd');
      const dayData = monthData.days[formattedDate] || {
        date: currentDate,
        entries: [],
        totalIncome: 0,
        totalExpenses: 0,
        dailyBalance: 0,
        runningBalance: 0
      };

      return (
        <div className="daily-view-container">
          <div className="daily-navigation">
            <button onClick={() => onDateChange(addDaysToDate(currentDate, -1))}>
              &lt; Previous Day
            </button>
            <button onClick={() => onDateChange(new Date())}>
              Today
            </button>
            <button onClick={() => onDateChange(addDaysToDate(currentDate, 1))}>
              Next Day &gt;
            </button>
          </div>
          <DailyView
            dayData={dayData}
            onAddEntry={onAddEntry}
            onUpdateEntry={onUpdateEntry}
            onDeleteEntry={onDeleteEntry}
          />
        </div>
      );
    } catch (error) {
      console.error('Error rendering daily view:', error);
      setRenderError('Failed to render daily view');
      return <div className="error-message">Failed to render daily view. Please try again.</div>;
    }
  };

  return (
    <div className="calendar-container">
      {renderError ? (
        <div className="error-message">{renderError}</div>
      ) : (
        <>
          <div className="view-selector">
            <button 
              className={view === 'year' ? 'active' : ''} 
              onClick={() => onViewChange('year')}
            >
              Year
            </button>
            <button 
              className={view === 'month' ? 'active' : ''} 
              onClick={() => onViewChange('month')}
            >
              Month
            </button>
            <button 
              className={view === 'week' ? 'active' : ''} 
              onClick={() => onViewChange('week')}
            >
              Week
            </button>
            <button 
              className={view === 'day' ? 'active' : ''} 
              onClick={() => onViewChange('day')}
            >
              Day
            </button>
          </div>
          
          {view === 'year' ? renderYearView() : view === 'month' ? renderMonthlyView() : view === 'week' ? renderWeeklyView() : renderDailyView()}
        </>
      )}
    </div>
  );
}; 