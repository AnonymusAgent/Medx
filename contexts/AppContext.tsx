import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from '@/template';
import {
  MOCK_PATIENTS,
  MOCK_CLAIMS,
  MOCK_APPOINTMENTS,
  MOCK_CURRENT_USER,
  Patient,
  Claim,
  Appointment,
} from '@/constants/mockData';
import {
  fetchPatients,
  insertPatient,
  patchPatient,
  fetchClaims,
  insertClaim,
  patchClaim,
  fetchAppointments,
  insertAppointment,
  patchAppointment,
  fetchUserProfile,
  UserProfile,
  seedMockDataIfEmpty,
} from '@/services/supabaseService';

interface CurrentUser {
  id: string;
  name: string;
  role: 'Admin' | 'Biller' | 'Coder' | 'Provider';
  email: string;
  avatar: string;
  practiceName: string;
}

interface AppContextType {
  currentUser: CurrentUser;
  userProfile: UserProfile | null;
  patients: Patient[];
  claims: Claim[];
  appointments: Appointment[];
  loading: boolean;
  addPatient: (p: Patient) => Promise<void>;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<void>;
  addClaim: (c: Claim) => Promise<void>;
  updateClaim: (id: string, updates: Partial<Claim>) => Promise<void>;
  addAppointment: (a: Appointment) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  refreshData: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [claims, setClaims] = useState<Claim[]>(MOCK_CLAIMS);
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      await seedMockDataIfEmpty();
      const [p, c, a, profile] = await Promise.all([
        fetchPatients(),
        fetchClaims(),
        fetchAppointments(),
        fetchUserProfile(user.id),
      ]);
      if (p.length > 0) setPatients(p);
      if (c.length > 0) setClaims(c);
      if (a.length > 0) setAppointments(a);
      if (profile) setUserProfile(profile);
    } catch (_) {
      // keep mock data as fallback
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setPatients(MOCK_PATIENTS);
      setClaims(MOCK_CLAIMS);
      setAppointments(MOCK_APPOINTMENTS);
      setUserProfile(null);
    }
  }, [user]);

  const addPatient = async (p: Patient) => {
    setPatients(prev => [p, ...prev]);
    if (user) await insertPatient(p);
  };

  const updatePatient = async (id: string, updates: Partial<Patient>) => {
    setPatients(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    if (user) await patchPatient(id, updates);
  };

  const addClaim = async (c: Claim) => {
    setClaims(prev => [c, ...prev]);
    if (user) await insertClaim(c);
  };

  const updateClaim = async (id: string, updates: Partial<Claim>) => {
    setClaims(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
    if (user) await patchClaim(id, updates);
  };

  const addAppointment = async (a: Appointment) => {
    setAppointments(prev => [a, ...prev]);
    if (user) await insertAppointment(a);
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    setAppointments(prev => prev.map(a => (a.id === id ? { ...a, ...updates } : a)));
    if (user) await patchAppointment(id, updates);
  };

  const displayName =
    userProfile?.fullName ??
    userProfile?.username ??
    user?.email?.split('@')[0] ??
    MOCK_CURRENT_USER.name;

  const currentUser: CurrentUser = user
    ? {
        id: user.id,
        name: displayName,
        role: (userProfile?.role ?? 'Biller') as CurrentUser['role'],
        email: user.email,
        avatar: displayName.substring(0, 2).toUpperCase(),
        practiceName: MOCK_CURRENT_USER.practiceName,
      }
    : MOCK_CURRENT_USER;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        userProfile,
        patients,
        claims,
        appointments,
        loading,
        addPatient,
        updatePatient,
        addClaim,
        updateClaim,
        addAppointment,
        updateAppointment,
        refreshData: loadData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
