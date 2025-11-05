"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

interface MonthYearContextType {
  selectedMonth: number;
  selectedYear: number;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
}

const MonthYearContext = createContext<MonthYearContextType | undefined>(undefined);

export function useMonthYear() {
  const context = useContext(MonthYearContext);
  if (context === undefined) {
    throw new Error('useMonthYear must be used within a MonthYearProvider');
  }
  return context;
}

interface MonthYearProviderProps {
  children: ReactNode;
}

export function MonthYearProvider({ children }: MonthYearProviderProps) {
  // Set default to current month and year - this will only run once on mount
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // Current month (1-12)
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const value = {
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
  };

  return (
    <MonthYearContext.Provider value={value}>
      {children}
    </MonthYearContext.Provider>
  );
}