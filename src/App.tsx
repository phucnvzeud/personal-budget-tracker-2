import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Calendar } from './components/Calendar';
import { AuthPage } from './components/auth/AuthPage';
import { FinancialEntryForm } from './components/FinancialEntryForm';
import { useFinancialData } from './hooks/useFinancialData';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinancialEntry, CalendarViewType, RecurringPayment } from './types';
import { RecurringPayments } from './components/RecurringPayments';
import './App.css';

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Main app component (without auth context)
const AppContent: React.FC = () => {
  const [view, setView] = useState<CalendarViewType>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinancialEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    addEntry,
    updateEntry,
    deleteEntry,
    recurringPayments,
    addRecurringPayment,
    updateRecurringPayment,
    deleteRecurringPayment,
    monthData,
    yearData,
  } = useFinancialData(currentDate);

  const handleAddEntry = (entry: Omit<FinancialEntry, 'id'>) => {
    try {
      addEntry(entry);
      setShowEntryForm(false);
      setEditingEntry(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add entry');
    }
  };

  const handleUpdateEntry = (entry: FinancialEntry) => {
    try {
      updateEntry(entry);
      setEditingEntry(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update entry');
    }
  };

  const handleDeleteEntry = (id: string) => {
    try {
      deleteEntry(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
    }
  };

  const handleUpdateRecurringPayment = (updatedPayment: RecurringPayment) => {
    updateRecurringPayment(updatedPayment);
  };

  return (
    <div className="app">
      <Header title="Personal Budget Tracker" />
      
      <main className="app-main">
        {error && <div className="error">{error}</div>}
        
        {monthData && yearData ? (
          <>
            <button onClick={() => setShowEntryForm(true)}>Add New Entry</button>
            
            <Calendar
              view={view}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              monthData={monthData}
              yearData={yearData}
              onAddEntry={handleAddEntry}
              onUpdateEntry={handleUpdateEntry}
              onDeleteEntry={handleDeleteEntry}
              onViewChange={setView}
            />

            {showEntryForm && (
              <FinancialEntryForm
                entry={editingEntry}
                onSave={handleAddEntry}
                onCancel={() => {
                  setShowEntryForm(false);
                  setEditingEntry(null);
                }}
              />
            )}

            <RecurringPayments
              recurringPayments={recurringPayments}
              onAddRecurringPayment={addRecurringPayment}
              onUpdateRecurringPayment={handleUpdateRecurringPayment}
              onDeleteRecurringPayment={deleteRecurringPayment}
            />
          </>
        ) : (
          <div className="loading">Loading calendar data...</div>
        )}
      </main>
      
      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Personal Budget Tracker</p>
      </footer>
    </div>
  );
};

// Root component with providers
const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <AppContent />
              </ProtectedRoute>
            } 
          />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App; 