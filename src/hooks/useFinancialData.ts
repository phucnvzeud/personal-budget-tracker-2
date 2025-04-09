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
import axios from 'axios';

// Setup API base URL - will default to the current host
const API_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `${window.location.protocol}//${window.location.hostname}:${window.location.port}`
    : ''); // Empty string for same-origin requests in production

// Helper function to safely handle date serialization
const dateReviver = (key: string, value: any) => {
  if (key === 'date' || key === 'startDate' || key === 'endDate' || key === 'validFrom' || key === 'validUntil') {
    return new Date(value);
  }
  return value;
};

export const useFinancialData = (currentDate: Date = new Date()) => {
  const { currentUser, token } = useAuth();
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load entries from API
  useEffect(() => {
    const loadEntries = async () => {
      if (!currentUser || !token) {
        setEntries([]);
        return;
      }

      try {
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/api/entries`);
        
        // Convert string dates to Date objects
        const processedEntries = response.data.map((entry: any) => ({
          ...entry,
          id: entry._id || entry.id, // Handle MongoDB _id
          date: new Date(entry.date)
        }));
        
        setEntries(processedEntries);
        setError(null);
      } catch (err: any) {
        console.error('Error loading entries:', err);
        setError(err.message || 'Failed to load financial entries');
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();
  }, [currentUser, token]);

  // Load recurring payments from API
  useEffect(() => {
    const loadRecurringPayments = async () => {
      if (!currentUser || !token) {
        setRecurringPayments([]);
        return;
      }

      try {
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/api/recurring-payments`);
        
        // Convert string dates to Date objects
        const processedPayments = response.data.map((payment: any) => ({
          ...payment,
          id: payment._id || payment.id, // Handle MongoDB _id
          startDate: new Date(payment.startDate),
          endDate: payment.endDate ? new Date(payment.endDate) : undefined,
          validFrom: new Date(payment.validFrom),
          validUntil: payment.validUntil ? new Date(payment.validUntil) : undefined
        }));
        
        setRecurringPayments(processedPayments);
        setError(null);
      } catch (err: any) {
        console.error('Error loading recurring payments:', err);
        setError(err.message || 'Failed to load recurring payments');
      } finally {
        setIsLoading(false);
      }
    };

    loadRecurringPayments();
  }, [currentUser, token]);

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
        // First, save the entries to the API
        Promise.all(
          newEntries.map(entry => 
            axios.post(`${API_URL}/api/entries`, {
              date: entry.date,
              amount: entry.amount,
              description: entry.description,
              type: entry.type
            })
          )
        )
        .then(responses => {
          // Get the saved entries with their server-generated IDs
          const savedEntries = responses.map(response => ({
            ...response.data,
            id: response.data._id || response.data.id, // Handle MongoDB _id
            date: new Date(response.data.date)
          }));
          
          // Update the local state
          setEntries(prevEntries => [...prevEntries, ...savedEntries]);
        })
        .catch(err => {
          console.error('Failed to save generated recurring entries:', err);
          setError('Failed to save generated recurring entries');
        });
      }
    };

    // Process recurring payments
    if (recurringPayments.length > 0 && currentUser && token) {
      processRecurringPayments();
    }
  }, [recurringPayments, entries, currentDate, currentUser, token]);

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
  const addEntry = async (entry: Omit<FinancialEntry, 'id'>) => {
    if (!currentUser || !token) {
      setError('You must be logged in to add entries');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/api/entries`, entry);
      
      const newEntry = {
        ...response.data,
        id: response.data._id || response.data.id, // Handle MongoDB _id
        date: new Date(response.data.date)
      };
      
      setEntries(prevEntries => [...prevEntries, newEntry]);
      setError(null);
    } catch (err: any) {
      console.error('Error adding entry:', err);
      setError(err.message || 'Failed to add entry');
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing financial entry
  const updateEntry = async (updatedEntry: FinancialEntry) => {
    if (!currentUser || !token) {
      setError('You must be logged in to update entries');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Use the MongoDB _id format for the API call
      const entryId = updatedEntry._id || updatedEntry.id;
      const { _id, id, ...entryData } = updatedEntry; // Remove both id fields for the API
      
      const response = await axios.put(`${API_URL}/api/entries/${entryId}`, entryData);
      
      const savedEntry = {
        ...response.data,
        id: response.data._id || response.data.id, // Keep the id field for the frontend
        date: new Date(response.data.date)
      };
      
      setEntries(prevEntries =>
        prevEntries.map(entry => 
          entry.id === savedEntry.id ? savedEntry : entry
        )
      );
      
      setError(null);
    } catch (err: any) {
      console.error('Error updating entry:', err);
      setError(err.message || 'Failed to update entry');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a financial entry
  const deleteEntry = async (id: string) => {
    if (!currentUser || !token) {
      setError('You must be logged in to delete entries');
      return;
    }
    
    try {
      setIsLoading(true);
      await axios.delete(`${API_URL}/api/entries/${id}`);
      
      setEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
      setError(null);
    } catch (err: any) {
      console.error('Error deleting entry:', err);
      setError(err.message || 'Failed to delete entry');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a recurring payment
  const addRecurringPayment = async (payment: Omit<RecurringPayment, 'id'>) => {
    if (!currentUser || !token) {
      setError('You must be logged in to add recurring payments');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/api/recurring-payments`, payment);
      
      const newPayment = {
        ...response.data,
        id: response.data._id || response.data.id, // Handle MongoDB _id
        startDate: new Date(response.data.startDate),
        endDate: response.data.endDate ? new Date(response.data.endDate) : undefined,
        validFrom: new Date(response.data.validFrom),
        validUntil: response.data.validUntil ? new Date(response.data.validUntil) : undefined
      };
      
      setRecurringPayments(prevPayments => [...prevPayments, newPayment]);
      setError(null);
    } catch (err: any) {
      console.error('Error adding recurring payment:', err);
      setError(err.message || 'Failed to add recurring payment');
    } finally {
      setIsLoading(false);
    }
  };

  // Update a recurring payment
  const updateRecurringPayment = async (updatedPayment: RecurringPayment) => {
    if (!currentUser || !token) {
      setError('You must be logged in to update recurring payments');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Use the MongoDB _id format for the API call
      const paymentId = updatedPayment._id || updatedPayment.id;
      const { _id, id, ...paymentData } = updatedPayment; // Remove both id fields for the API
      
      const response = await axios.put(`${API_URL}/api/recurring-payments/${paymentId}`, paymentData);
      
      const savedPayment = {
        ...response.data,
        id: response.data._id || response.data.id, // Keep the id field for the frontend
        startDate: new Date(response.data.startDate),
        endDate: response.data.endDate ? new Date(response.data.endDate) : undefined,
        validFrom: new Date(response.data.validFrom),
        validUntil: response.data.validUntil ? new Date(response.data.validUntil) : undefined
      };
      
      setRecurringPayments(prevPayments =>
        prevPayments.map(payment => 
          payment.id === savedPayment.id ? savedPayment : payment
        )
      );
      
      setError(null);
    } catch (err: any) {
      console.error('Error updating recurring payment:', err);
      setError(err.message || 'Failed to update recurring payment');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a recurring payment
  const deleteRecurringPayment = async (id: string) => {
    if (!currentUser || !token) {
      setError('You must be logged in to delete recurring payments');
      return;
    }
    
    try {
      setIsLoading(true);
      await axios.delete(`${API_URL}/api/recurring-payments/${id}`);
      
      setRecurringPayments(prevPayments => prevPayments.filter(payment => payment.id !== id));
      setError(null);
    } catch (err: any) {
      console.error('Error deleting recurring payment:', err);
      setError(err.message || 'Failed to delete recurring payment');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    entries,
    recurringPayments,
    monthData,
    yearData,
    addEntry,
    updateEntry,
    deleteEntry,
    addRecurringPayment,
    updateRecurringPayment,
    deleteRecurringPayment,
    isLoading,
    error
  };
}; 