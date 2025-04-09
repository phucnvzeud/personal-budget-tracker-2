export type FinancialEntry = {
  id: string;
  date: Date;
  amount: number;
  description: string;
  type: 'income' | 'expense';
};

export type RecurringScheduleType = 
  | 'specific-date'    // Repeats on a specific date each month (e.g., 15th)
  | 'weekdays-only'    // Monday through Friday
  | 'weekends-only'    // Saturday and Sunday
  | 'custom-range';    // Custom date range

export type RecurringPayment = {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  
  // Schedule information
  scheduleType: RecurringScheduleType;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  
  // For specific date (e.g., "15th of each month")
  dayOfMonth?: number; // 1-31 for monthly payments on specific date
  
  // Date range information
  startDate: Date;     // When the recurring payment begins
  endDate?: Date;      // Optional end date
  
  // Validity period
  validFrom: Date;     // When the payment/income starts being valid
  validUntil?: Date;   // When the payment/income is no longer valid
  
  isActive: boolean;   // Whether this recurring payment is active
};

export type DayData = {
  date: Date;
  entries: FinancialEntry[];
  totalIncome: number;
  totalExpenses: number;
  dailyBalance: number;
  runningBalance: number;
};

export type MonthData = {
  days: Record<string, DayData>;
  totalIncome: number;
  totalExpenses: number;
  monthlyBalance: number;
};

export type MonthSummary = {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  monthlyBalance: number;
};

export type YearData = {
  year: number;
  months: MonthSummary[];
  totalIncome: number;
  totalExpenses: number;
  yearlyBalance: number;
};

export type CalendarViewType = 'day' | 'week' | 'month' | 'year'; 