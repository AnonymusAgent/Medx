import React, { createContext, useState, ReactNode } from 'react';
import {
  MOCK_PATIENTS,
  MOCK_CLAIMS,
  MOCK_APPOINTMENTS,
  MOCK_CURRENT_USER,
  Patient,
  Claim,
  Appointment,
} from '@/constants/mockData';

interface AppContextType {
  currentUser: typeof MOCK_CURRENT_USER;
  patients: Patient[];
  claims: Claim[];
  appointments: Appointment[];
  addPatient: (p: Patient) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  addClaim: (c: Claim) => void;
  updateClaim: (id: string, updates: Partial<Claim>) => void;
  addAppointment: (a: Appointment) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [claims, setClaims] = useState<Claim[]>(MOCK_CLAIMS);
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);

  const addPatient = (p: Patient) => setPatients(prev => [p, ...prev]);
  const updatePatient = (id: string, updates: Partial<Patient>) =>
    setPatients(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));

  const addClaim = (c: Claim) => setClaims(prev => [c, ...prev]);
  const updateClaim = (id: string, updates: Partial<Claim>) =>
    setClaims(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));

  const addAppointment = (a: Appointment) => setAppointments(prev => [a, ...prev]);
  const updateAppointment = (id: string, updates: Partial<Appointment>) =>
    setAppointments(prev => prev.map(a => (a.id === id ? { ...a, ...updates } : a)));

  return (
    <AppContext.Provider
      value={{
        currentUser: MOCK_CURRENT_USER,
        patients,
        claims,
        appointments,
        addPatient,
        updatePatient,
        addClaim,
        updateClaim,
        addAppointment,
        updateAppointment,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
