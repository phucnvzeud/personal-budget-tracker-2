import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FinancialEntry, 
  RecurringPayment
} from '../types';
import { v4 as uuidv4 } from 'uuid';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isAfter, 
  isBefore, 
  isSameDay, 
  isWeekend,
  getDate
} from 'date-fns';
import { useAuth } from '../context/AuthContext';

const ENTRIES_STORAGE_KEY = 'personal-budget-tracker-entries';
const RECURRING_PAYMENTS_STORAGE_KEY = 'personal-budget-tracker-recurring-payments';

// Helper function to safely handle date serialization
const dateReviver = (key: string, value: any) => {
  if (key === 'date' || key === 'startDate' || key === 'endDate') {
    return new Date(value);
  }
  return value;
};

export const useFinancialData = (currentDate: Date = new Date()) => {
  const { currentUser } = useAuth();
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);

  // Get storage key for the current user
  const getStorageKey = useCallback((key: string) => {
    return currentUser 
      ? `${key}-${currentUser.id}`
      : key;
  }, [currentUser]);

  // Load entries from localStorage
  useEffect(() => {
    const savedEntries = localStorage.getItem(getStorageKey(ENTRIES_STORAGE_KEY));
    if (savedEntries) {
      const parsedEntries = JSON.parse(savedEntries, dateReviver);
      setEntries(parsedEntries.map((entry: any) => ({
        ...entry,
        date: new Date(entry.date)
      })));
    }
  }, [getStorageKey]);

  // Save entries to localStorage
  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem(getStorageKey(ENTRIES_STORAGE_KEY), JSON.stringify(entries));
    } else {
      // If there are no entries, remove the item from localStorage
      localStorage.removeItem(getStorageKey(ENTRIES_STORAGE_KEY));
    }
  }, [entries, getStorageKey]);

  // Load recurring payments from localStorage
  useEffect(() => {
    const savedRecurringPayments = localStorage.getItem(getStorageKey(RECURRING_PAYMENTS_STORAGE_KEY));
    if (savedRecurringPayments) {
      const parsedPayments = JSON.parse(savedRecurringPayments, dateReviver);
      setRecurringPayments(parsedPayments.map((payment: any) => ({
        ...payment,
        startDate: new Date(payment.startDate),
        endDate: payment.endDate ? new Date(payment.endDate) : undefined,
        validFrom: new Date(payment.validFrom),
        validUntil: payment.validUntil ? new Date(payment.validUntil) : undefined
      })));
    }
  }, [getStorageKey]);

  // Save recurring payments to localStorage
  useEffect(() => {
    if (recurringPayments.length > 0) {
      localStorage.setItem(getStorageKey(RECURRING_PAYMENTS_STORAGE_KEY), JSON.stringify(recurringPayments));
    } else {
      // If there are no recurring payments, remove the item from localStorage
      localStorage.removeItem(getStorageKey(RECURRING_PAYMENTS_STORAGE_KEY));
    }
  }, [recurringPayments, getStorageKey]);

  // Process recurring payments and generate entries
  useEffect(() => {
    const processRecurringPayments = () => {
      // Current actual date (today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Selected month in the UI (might be different from current month)
      const selectedMonthStart = startOfMonth(currentDate);
      const selectedMonthEnd = endOfMonth(currentDate);
      
      // Consider a period of up to 30 days in the past from today (for historical data)
      const pastProcessingDate = new Date(today);
      pastProcessingDate.setDate(pastProcessingDate.getDate() - 30);
      
      // The start of processing should be the earlier of:
      // 1. 30 days before today (for recent past entries)
      // 2. The start of the selected month (for viewing past/future months)
      const startDate = new Date(Math.min(pastProcessingDate.getTime(), selectedMonthStart.getTime()));
      
      // The end of processing should be the later of:
      // 1. The end of the current actual month (for immediate visibility)
      // 2. The end of the selected month (for viewing past/future months)
      const endDate = new Date(
        Math.max(
          endOfMonth(today).getTime(),
          selectedMonthEnd.getTime()
        )
      );
      
      // Prepare new entries generated from recurring payments
      const newEntries: FinancialEntry[] = [];

      // Loop through all recurring payments
      recurringPayments.forEach(payment => {
        if (!payment.isActive) return;

        // Check if the payment is valid during any part of our processing window
        const paymentEndDate = payment.validUntil || new Date(9999, 11, 31); // If no end date, use far future
        
        // If the payment's validity period doesn't overlap with our processing period, skip it
        if (isAfter(payment.validFrom, endDate) || isBefore(paymentEndDate, startDate)) {
          return;
        }

        // Get dates to process based on schedule type
        let datesToProcess: Date[] = [];
        
        // Define start date for processing (max of payment's start date or our processing window start)
        const processingStart = new Date(Math.max(payment.startDate.getTime(), startDate.getTime()));
        
        // Define end date for processing (min of payment's end date or processing window end)
        const processingEnd = payment.endDate && isBefore(payment.endDate, endDate) 
          ? payment.endDate 
          : endDate;

        // Don't process if the processing period is invalid
        if (isAfter(processingStart, processingEnd)) return;

        // Get candidate dates based on schedule type
        switch (payment.scheduleType) {
          case 'specific-date':
            // For monthly payments on a specific day of month
            if (payment.frequency === 'monthly' && payment.dayOfMonth) {
              // Get all days in the processing range
              const allDays = eachDayOfInterval({ start: processingStart, end: processingEnd });
              // Filter for days that match the day of month
              datesToProcess = allDays.filter(date => getDate(date) === payment.dayOfMonth);
            } 
            // For yearly payments on a specific day of a specific month
            else if (payment.frequency === 'yearly' && payment.dayOfMonth) {
              // Get all days in the processing range
              const allDays = eachDayOfInterval({ start: processingStart, end: processingEnd });
              // Filter for days that match both the month and day
              datesToProcess = allDays.filter(date => 
                getDate(date) === payment.dayOfMonth &&
                date.getMonth() === payment.startDate.getMonth()
              );
            }
            break;
            
          case 'weekdays-only':
            // Get all weekdays within the processing window
            datesToProcess = eachDayOfInterval({ start: processingStart, end: processingEnd })
              .filter(date => !isWeekend(date));
            break;
            
          case 'weekends-only':
            // Get all weekend days within the processing window
            datesToProcess = eachDayOfInterval({ start: processingStart, end: processingEnd })
              .filter(date => isWeekend(date));
            break;
            
          case 'custom-range':
            // Get all dates within the custom range
            datesToProcess = eachDayOfInterval({ start: processingStart, end: processingEnd });
            
            // Apply frequency filtering
            switch (payment.frequency) {
              case 'daily':
                // All days are included, so no additional filtering
                break;
                
              case 'weekly':
                // Keep only days whose day of week matches the original start date
                datesToProcess = datesToProcess.filter(date => 
                  date.getDay() === payment.startDate.getDay()
                );
                break;
                
              case 'monthly':
                // Keep only days whose day of month matches the original start date
                datesToProcess = datesToProcess.filter(date => 
                  getDate(date) === getDate(payment.startDate)
                );
                break;
                
              case 'yearly':
                // Keep only days whose day and month match the original start date
                datesToProcess = datesToProcess.filter(date => 
                  getDate(date) === getDate(payment.startDate) && 
                  date.getMonth() === payment.startDate.getMonth()
                );
                break;
            }
            break;
        }

        // Create entries for each date to process
        datesToProcess.forEach(date => {
          // Check if an entry for this recurring payment already exists on this date
          const entryExists = entries.some(entry => 
            isSameDay(entry.date, date) && 
            entry.description === `[Recurring] ${payment.description}`
          );

          if (!entryExists) {
            // Create a new entry for this recurring payment
            newEntries.push({
              id: uuidv4(),
              date: new Date(date),
              amount: payment.amount,
              description: `[Recurring] ${payment.description}`,
              type: payment.type
            });
          }
        });
      });

      // Add new entries if any were generated
      if (newEntries.length > 0) {
        setEntries(prevEntries => [...prevEntries, ...newEntries]);
      }
    };

    // Process recurring payments
    if (recurringPayments.length > 0) {
      processRecurringPayments();
    }
  }, [recurringPayments, entries, currentDate]);

  // Calculate month data
  const monthData = useMemo(() => {
    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

    const days = daysInMonth.reduce((acc, day) => {
      const formattedDate = format(day, 'yyyy-MM-dd');
      const dayEntries = entries.filter(entry => isSameDay(entry.date, day));
      
      const totalIncome = dayEntries
        .filter(entry => entry.type === 'income')
        .reduce((sum, entry) => sum + entry.amount, 0);
      
      const totalExpenses = dayEntries
        .filter(entry => entry.type === 'expense')
        .reduce((sum, entry) => sum + entry.amount, 0);

      acc[formattedDate] = {
        date: day,
        entries: dayEntries,
        totalIncome,
        totalExpenses,
        dailyBalance: totalIncome - totalExpenses,
        runningBalance: 0, // Calculated after all days are processed
      };

      return acc;
    }, {} as Record<string, any>);

    // Calculate running balance
    let runningBalance = 0;
    for (const day of daysInMonth) {
      const formattedDate = format(day, 'yyyy-MM-dd');
      runningBalance += days[formattedDate].dailyBalance;
      days[formattedDate].runningBalance = runningBalance;
    }

    // Calculate total income, expenses, and balance for the month
    const totalIncome = Object.values(days).reduce(
      (sum, day: any) => sum + day.totalIncome,
      0
    );
    const totalExpenses = Object.values(days).reduce(
      (sum, day: any) => sum + day.totalExpenses,
      0
    );

    return {
      days,
      totalIncome,
      totalExpenses,
      monthlyBalance: totalIncome - totalExpenses,
    };
  }, [currentDate, entries]);

  // Calculate year data
  const yearData = useMemo(() => {
    const year = currentDate.getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => i);

    const monthSummaries = months.map(month => {
      const monthEntries = entries.filter(entry => 
        entry.date.getFullYear() === year && 
        entry.date.getMonth() === month
      );

      const totalIncome = monthEntries
        .filter(entry => entry.type === 'income')
        .reduce((sum, entry) => sum + entry.amount, 0);
      
      const totalExpenses = monthEntries
        .filter(entry => entry.type === 'expense')
        .reduce((sum, entry) => sum + entry.amount, 0);

      return {
        month,
        year,
        totalIncome,
        totalExpenses,
        monthlyBalance: totalIncome - totalExpenses,
      };
    });

    const totalIncome = monthSummaries.reduce(
      (sum, month) => sum + month.totalIncome,
      0
    );
    const totalExpenses = monthSummaries.reduce(
      (sum, month) => sum + month.totalExpenses,
      0
    );

    return {
      year,
      months: monthSummaries,
      totalIncome,
      totalExpenses,
      yearlyBalance: totalIncome - totalExpenses,
    };
  }, [currentDate, entries]);

  // Add a new financial entry
  const addEntry = (entry: Omit<FinancialEntry, 'id'>) => {
    const newEntry = {
      ...entry,
      id: uuidv4(),
    };
    setEntries(prevEntries => [...prevEntries, newEntry]);
  };

  // Update an existing financial entry
  const updateEntry = (updatedEntry: FinancialEntry) => {
    setEntries(prevEntries =>
      prevEntries.map(entry => 
        entry.id === updatedEntry.id ? updatedEntry : entry
      )
    );
  };

  // Delete a financial entry
  const deleteEntry = (id: string) => {
    setEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
  };

  // Add a new recurring payment
  const addRecurringPayment = (payment: Omit<RecurringPayment, 'id'>) => {
    const newPayment = {
      ...payment,
      id: uuidv4(),
    };
    
    // Immediately process this new payment to create entries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Selected month in the UI
    const selectedMonthStart = startOfMonth(currentDate);
    const selectedMonthEnd = endOfMonth(currentDate);
    
    // The end date should be the later of today's month end or the selected month end
    const endDate = new Date(
      Math.max(
        endOfMonth(today).getTime(),
        selectedMonthEnd.getTime()
      )
    );
    
    let datesToProcess: Date[] = [];
    
    if (newPayment.isActive) {
      // Get the earlier of the selected month start or today (for processing)
      const startDate = new Date(Math.min(today.getTime(), selectedMonthStart.getTime()));
      
      // Check if the payment schedule is valid 
      const processingStart = new Date(Math.max(newPayment.startDate.getTime(), startDate.getTime()));
      const processingEnd = newPayment.endDate && isBefore(newPayment.endDate, endDate) 
        ? newPayment.endDate 
        : endDate;
      
      if (!isAfter(processingStart, processingEnd)) {
        // Get dates based on schedule type
        switch (newPayment.scheduleType) {
          case 'specific-date':
            if (newPayment.frequency === 'monthly' && newPayment.dayOfMonth) {
              const allDays = eachDayOfInterval({ start: processingStart, end: processingEnd });
              datesToProcess = allDays.filter(date => getDate(date) === newPayment.dayOfMonth);
            } else if (newPayment.frequency === 'yearly' && newPayment.dayOfMonth) {
              const allDays = eachDayOfInterval({ start: processingStart, end: processingEnd });
              datesToProcess = allDays.filter(date => 
                getDate(date) === newPayment.dayOfMonth &&
                date.getMonth() === newPayment.startDate.getMonth()
              );
            }
            break;
          case 'weekdays-only':
            datesToProcess = eachDayOfInterval({ start: processingStart, end: processingEnd })
              .filter(date => !isWeekend(date));
            break;
          case 'weekends-only':
            datesToProcess = eachDayOfInterval({ start: processingStart, end: processingEnd })
              .filter(date => isWeekend(date));
            break;
          case 'custom-range':
            datesToProcess = eachDayOfInterval({ start: processingStart, end: processingEnd });
            
            switch (newPayment.frequency) {
              case 'daily':
                break;
              case 'weekly':
                datesToProcess = datesToProcess.filter(date => 
                  date.getDay() === newPayment.startDate.getDay()
                );
                break;
              case 'monthly':
                datesToProcess = datesToProcess.filter(date => 
                  getDate(date) === getDate(newPayment.startDate)
                );
                break;
              case 'yearly':
                datesToProcess = datesToProcess.filter(date => 
                  getDate(date) === getDate(newPayment.startDate) && 
                  date.getMonth() === newPayment.startDate.getMonth()
                );
                break;
            }
            break;
        }
        
        // Create entries for dates
        const newEntries: FinancialEntry[] = datesToProcess.map(date => ({
          id: uuidv4(),
          date: new Date(date),
          amount: newPayment.amount,
          description: `[Recurring] ${newPayment.description}`,
          type: newPayment.type
        }));
        
        if (newEntries.length > 0) {
          setEntries(prevEntries => [...prevEntries, ...newEntries]);
        }
      }
    }
    
    setRecurringPayments(prevPayments => [...prevPayments, newPayment]);
  };

  // Update an existing recurring payment
  const updateRecurringPayment = (updatedPayment: RecurringPayment) => {
    // Get the existing payment to compare descriptions
    const existingPayment = recurringPayments.find(p => p.id === updatedPayment.id);
    if (!existingPayment) return;

    // First, remove all existing entries for this recurring payment
    setEntries(prevEntries => 
      prevEntries.filter(entry => 
        !entry.description.startsWith(`[Recurring] ${existingPayment.description}`)
      )
    );

    // Update the recurring payment
    setRecurringPayments(prevPayments =>
      prevPayments.map(payment =>
        payment.id === updatedPayment.id ? updatedPayment : payment
      )
    );

    // If the payment is active, process it immediately to create new entries
    if (updatedPayment.isActive) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const selectedMonthStart = startOfMonth(currentDate);
      const selectedMonthEnd = endOfMonth(currentDate);
      
      const endDate = new Date(
        Math.max(
          endOfMonth(today).getTime(),
          selectedMonthEnd.getTime()
        )
      );
      
      let datesToProcess: Date[] = [];
      const startDate = new Date(Math.min(today.getTime(), selectedMonthStart.getTime()));
      
      const processingStart = new Date(Math.max(updatedPayment.startDate.getTime(), startDate.getTime()));
      const processingEnd = updatedPayment.endDate && isBefore(updatedPayment.endDate, endDate) 
        ? updatedPayment.endDate 
        : endDate;
      
      if (!isAfter(processingStart, processingEnd)) {
        switch (updatedPayment.scheduleType) {
          case 'specific-date':
            if (updatedPayment.frequency === 'monthly' && updatedPayment.dayOfMonth) {
              const allDays = eachDayOfInterval({ start: processingStart, end: processingEnd });
              datesToProcess = allDays.filter(date => getDate(date) === updatedPayment.dayOfMonth);
            } else if (updatedPayment.frequency === 'yearly' && updatedPayment.dayOfMonth) {
              const allDays = eachDayOfInterval({ start: processingStart, end: processingEnd });
              datesToProcess = allDays.filter(date => 
                getDate(date) === updatedPayment.dayOfMonth &&
                date.getMonth() === updatedPayment.startDate.getMonth()
              );
            }
            break;
          case 'weekdays-only':
            datesToProcess = eachDayOfInterval({ start: processingStart, end: processingEnd })
              .filter(date => !isWeekend(date));
            break;
          case 'weekends-only':
            datesToProcess = eachDayOfInterval({ start: processingStart, end: processingEnd })
              .filter(date => isWeekend(date));
            break;
          case 'custom-range':
            datesToProcess = eachDayOfInterval({ start: processingStart, end: processingEnd });
            
            switch (updatedPayment.frequency) {
              case 'daily':
                break;
              case 'weekly':
                datesToProcess = datesToProcess.filter(date => 
                  date.getDay() === updatedPayment.startDate.getDay()
                );
                break;
              case 'monthly':
                datesToProcess = datesToProcess.filter(date => 
                  getDate(date) === getDate(updatedPayment.startDate)
                );
                break;
              case 'yearly':
                datesToProcess = datesToProcess.filter(date => 
                  getDate(date) === getDate(updatedPayment.startDate) && 
                  date.getMonth() === updatedPayment.startDate.getMonth()
                );
                break;
            }
            break;
        }
        
        // Create new entries for the updated payment
        const newEntries: FinancialEntry[] = datesToProcess.map(date => ({
          id: uuidv4(),
          date: new Date(date),
          amount: updatedPayment.amount,
          description: `[Recurring] ${updatedPayment.description}`,
          type: updatedPayment.type
        }));
        
        if (newEntries.length > 0) {
          setEntries(prevEntries => [...prevEntries, ...newEntries]);
        }
      }
    }
  };

  // Delete a recurring payment
  const deleteRecurringPayment = (id: string) => {
    // Get the payment before deleting it
    const paymentToDelete = recurringPayments.find(payment => payment.id === id);
    
    if (paymentToDelete) {
      // Remove all entries associated with this recurring payment
      setEntries(prevEntries => {
        const updatedEntries = prevEntries.filter(entry => 
          !entry.description.startsWith(`[Recurring] ${paymentToDelete.description}`)
        );
        return updatedEntries;
      });
    }
    
    // Remove the recurring payment
    setRecurringPayments(prevPayments => {
      const updatedPayments = prevPayments.filter(payment => payment.id !== id);
      return updatedPayments;
    });
  };

  return {
    entries,
    addEntry,
    updateEntry,
    deleteEntry,
    recurringPayments,
    addRecurringPayment,
    updateRecurringPayment,
    deleteRecurringPayment,
    monthData,
    yearData,
  };
}; 