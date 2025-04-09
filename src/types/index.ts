export interface FinancialEntry {
  id: string;
  date: Date;
  amount: number;
  description: string;
  type: 'income' | 'expense';
}

export interface RecurringPayment {
  id: string;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  startDate: Date;
  endDate?: Date;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  dayOfWeek?: number; // 0-6 for Sunday-Saturday
  dayOfMonth?: number; // 1-31
  isActive: boolean;
}

export interface DayData {
  date: Date;
  entries: FinancialEntry[];
  totalIncome: number;
  totalExpenses: number;
  dailyBalance: number;
  runningBalance: number;
}

export interface MonthData {
  days: Record<string, DayData>;
  totalIncome: number;
  totalExpenses: number;
  monthlyBalance: number;
}

export interface MonthSummary {
  month: number; // 0-11 (January-December)
  year: number;
  totalIncome: number;
  totalExpenses: number;
  monthlyBalance: number;
}

export interface YearData {
  year: number;
  months: MonthSummary[];
  totalIncome: number;
  totalExpenses: number;
  yearlyBalance: number;
}

export type CalendarViewType = 'year' | 'month' | 'week' | 'day'; 