import { getSupabaseClient } from '@/template';
import {
  Patient,
  Claim,
  Appointment,
  MOCK_PATIENTS,
  MOCK_CLAIMS,
  MOCK_APPOINTMENTS,
} from '@/constants/mockData';

const db = () => getSupabaseClient();

// ─── User Profile ──────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  fullName?: string;
  role: 'Admin' | 'Biller' | 'Coder' | 'Provider';
  isActive: boolean;
  phone?: string;
}

function mapUserProfile(row: any): UserProfile {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    fullName: row.full_name,
    role: row.role ?? 'Biller',
    isActive: row.is_active ?? true,
    phone: row.phone,
  };
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await db().from('user_profiles').select('*').eq('id', userId).single();
  if (error || !data) return null;
  return mapUserProfile(data);
}

export async function fetchAllUsers(): Promise<UserProfile[]> {
  const { data, error } = await db().from('user_profiles').select('*').order('email');
  if (error || !data) return [];
  return data.map(mapUserProfile);
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<boolean> {
  const row: any = {};
  if (updates.fullName !== undefined) row.full_name = updates.fullName;
  if (updates.role !== undefined) row.role = updates.role;
  if (updates.isActive !== undefined) row.is_active = updates.isActive;
  if (updates.phone !== undefined) row.phone = updates.phone;
  const { error } = await db().from('user_profiles').update(row).eq('id', userId);
  return !error;
}

// ─── Patients ─────────────────────────────────────────────────────────────────
function mapPatient(row: any): Patient {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    dob: row.dob,
    gender: row.gender,
    phone: row.phone ?? '',
    email: row.email ?? '',
    address: row.address ?? '',
    city: row.city ?? '',
    state: row.state ?? '',
    zip: row.zip ?? '',
    ssn: row.ssn ?? '',
    balance: row.balance ?? 0,
    lastVisit: row.last_visit ?? '',
    providerId: row.provider_id ?? 'p1',
    status: row.status ?? 'Active',
    primaryInsurance: row.primary_insurance ?? {
      company: '',
      memberId: '',
      groupNumber: '',
      planType: 'PPO',
      copay: 0,
      deductible: 0,
      eligibilityStatus: 'Pending',
    },
    secondaryInsurance: row.secondary_insurance ?? undefined,
  };
}

function patientToRow(p: Patient) {
  return {
    id: p.id,
    first_name: p.firstName,
    last_name: p.lastName,
    dob: p.dob,
    gender: p.gender,
    phone: p.phone,
    email: p.email,
    address: p.address,
    city: p.city,
    state: p.state,
    zip: p.zip,
    ssn: p.ssn,
    balance: p.balance,
    last_visit: p.lastVisit,
    provider_id: p.providerId,
    status: p.status,
    primary_insurance: p.primaryInsurance,
    secondary_insurance: p.secondaryInsurance ?? null,
  };
}

export async function fetchPatients(): Promise<Patient[]> {
  const { data, error } = await db()
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(mapPatient);
}

export async function insertPatient(p: Patient): Promise<boolean> {
  const { error } = await db().from('patients').upsert(patientToRow(p));
  return !error;
}

export async function patchPatient(id: string, updates: Partial<Patient>): Promise<boolean> {
  const row: any = { updated_at: new Date().toISOString() };
  if (updates.firstName !== undefined) row.first_name = updates.firstName;
  if (updates.lastName !== undefined) row.last_name = updates.lastName;
  if (updates.balance !== undefined) row.balance = updates.balance;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.lastVisit !== undefined) row.last_visit = updates.lastVisit;
  if (updates.primaryInsurance !== undefined) row.primary_insurance = updates.primaryInsurance;
  const { error } = await db().from('patients').update(row).eq('id', id);
  return !error;
}

// ─── Claims ───────────────────────────────────────────────────────────────────
function mapClaim(row: any): Claim {
  return {
    id: row.id,
    claimNumber: row.claim_number,
    patientId: row.patient_id,
    patientName: row.patient_name,
    serviceDate: row.service_date,
    submittedDate: row.submitted_date,
    paidDate: row.paid_date,
    providerId: row.provider_id ?? 'p1',
    providerName: row.provider_name ?? '',
    dos: row.dos ?? '',
    cptCodes: row.cpt_codes ?? [],
    icdCodes: row.icd_codes ?? [],
    totalCharge: row.total_charge ?? 0,
    allowedAmount: row.allowed_amount ?? 0,
    paidAmount: row.paid_amount ?? 0,
    adjustments: row.adjustments ?? 0,
    patientBalance: row.patient_balance ?? 0,
    status: row.status ?? 'Draft',
    insuranceCompany: row.insurance_company ?? '',
    denialReason: row.denial_reason,
    notes: row.notes,
  };
}

function claimToRow(c: Claim) {
  return {
    id: c.id,
    claim_number: c.claimNumber,
    patient_id: c.patientId,
    patient_name: c.patientName,
    service_date: c.serviceDate,
    submitted_date: c.submittedDate ?? null,
    paid_date: c.paidDate ?? null,
    provider_id: c.providerId,
    provider_name: c.providerName,
    dos: c.dos,
    cpt_codes: c.cptCodes,
    icd_codes: c.icdCodes,
    total_charge: c.totalCharge,
    allowed_amount: c.allowedAmount,
    paid_amount: c.paidAmount,
    adjustments: c.adjustments,
    patient_balance: c.patientBalance,
    status: c.status,
    insurance_company: c.insuranceCompany,
    denial_reason: c.denialReason ?? null,
    notes: c.notes ?? null,
  };
}

export async function fetchClaims(): Promise<Claim[]> {
  const { data, error } = await db()
    .from('claims')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(mapClaim);
}

export async function insertClaim(c: Claim): Promise<boolean> {
  const { error } = await db().from('claims').upsert(claimToRow(c));
  return !error;
}

export async function patchClaim(id: string, updates: Partial<Claim>): Promise<boolean> {
  const row: any = { updated_at: new Date().toISOString() };
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.paidAmount !== undefined) row.paid_amount = updates.paidAmount;
  if (updates.allowedAmount !== undefined) row.allowed_amount = updates.allowedAmount;
  if (updates.adjustments !== undefined) row.adjustments = updates.adjustments;
  if (updates.patientBalance !== undefined) row.patient_balance = updates.patientBalance;
  if (updates.paidDate !== undefined) row.paid_date = updates.paidDate;
  if (updates.submittedDate !== undefined) row.submitted_date = updates.submittedDate;
  if (updates.denialReason !== undefined) row.denial_reason = updates.denialReason;
  if (updates.providerId !== undefined) row.provider_id = updates.providerId;
  if (updates.providerName !== undefined) row.provider_name = updates.providerName;
  if (updates.cptCodes !== undefined) row.cpt_codes = updates.cptCodes;
  if (updates.icdCodes !== undefined) row.icd_codes = updates.icdCodes;
  if (updates.totalCharge !== undefined) row.total_charge = updates.totalCharge;
  const { error } = await db().from('claims').update(row).eq('id', id);
  return !error;
}

// ─── Appointments ─────────────────────────────────────────────────────────────
function mapAppointment(row: any): Appointment {
  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: row.patient_name,
    providerId: row.provider_id ?? 'p1',
    providerName: row.provider_name ?? '',
    date: row.date,
    time: row.time,
    duration: row.duration ?? 30,
    type: row.type ?? '',
    status: row.status ?? 'Scheduled',
    notes: row.notes,
    room: row.room,
  };
}

function appointmentToRow(a: Appointment) {
  return {
    id: a.id,
    patient_id: a.patientId,
    patient_name: a.patientName,
    provider_id: a.providerId,
    provider_name: a.providerName,
    date: a.date,
    time: a.time,
    duration: a.duration,
    type: a.type,
    status: a.status,
    notes: a.notes ?? null,
    room: a.room ?? null,
  };
}

export async function fetchAppointments(): Promise<Appointment[]> {
  const { data, error } = await db()
    .from('appointments')
    .select('*')
    .order('date', { ascending: false });
  if (error || !data) return [];
  return data.map(mapAppointment);
}

export async function insertAppointment(a: Appointment): Promise<boolean> {
  const { error } = await db().from('appointments').upsert(appointmentToRow(a));
  return !error;
}

export async function patchAppointment(
  id: string,
  updates: Partial<Appointment>
): Promise<boolean> {
  const row: any = { updated_at: new Date().toISOString() };
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.notes !== undefined) row.notes = updates.notes;
  if (updates.room !== undefined) row.room = updates.room;
  const { error } = await db().from('appointments').update(row).eq('id', id);
  return !error;
}

// ─── AR Followups ─────────────────────────────────────────────────────────────
export interface ContactEntry {
  date: string;
  notes: string;
  addedBy?: string;
}

export interface ARFollowup {
  id: string;
  claimId: string;
  claimNumber: string;
  patientName: string;
  insuranceCompany: string;
  amount: number;
  agingBucket: string;
  daysOutstanding: number;
  status: 'Open' | 'Resolved' | 'In Appeal' | 'Written Off';
  appealStatus: string;
  followUpDate?: string;
  payerRep?: string;
  contactLog: ContactEntry[];
  createdAt: string;
  updatedAt: string;
}

function mapARFollowup(row: any): ARFollowup {
  return {
    id: row.id,
    claimId: row.claim_id,
    claimNumber: row.claim_number,
    patientName: row.patient_name,
    insuranceCompany: row.insurance_company ?? '',
    amount: row.amount ?? 0,
    agingBucket: row.aging_bucket,
    daysOutstanding: row.days_outstanding ?? 0,
    status: row.status ?? 'Open',
    appealStatus: row.appeal_status ?? 'Not Appealed',
    followUpDate: row.follow_up_date,
    payerRep: row.payer_rep,
    contactLog: row.contact_log ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchARFollowups(): Promise<ARFollowup[]> {
  const { data, error } = await db()
    .from('ar_followups')
    .select('*')
    .order('days_outstanding', { ascending: false });
  if (error || !data) return [];
  return data.map(mapARFollowup);
}

export async function upsertARFollowup(
  f: Omit<ARFollowup, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<ARFollowup | null> {
  const row: any = {
    claim_id: f.claimId,
    claim_number: f.claimNumber,
    patient_name: f.patientName,
    insurance_company: f.insuranceCompany,
    amount: f.amount,
    aging_bucket: f.agingBucket,
    days_outstanding: f.daysOutstanding,
    status: f.status,
    appeal_status: f.appealStatus,
    follow_up_date: f.followUpDate ?? null,
    payer_rep: f.payerRep ?? null,
    contact_log: f.contactLog,
  };
  if (f.id) row.id = f.id;

  const { data, error } = await db().from('ar_followups').upsert(row).select().single();
  if (error || !data) return null;
  return mapARFollowup(data);
}

export async function patchARFollowup(
  id: string,
  updates: Partial<ARFollowup>
): Promise<boolean> {
  const row: any = { updated_at: new Date().toISOString() };
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.appealStatus !== undefined) row.appeal_status = updates.appealStatus;
  if (updates.followUpDate !== undefined) row.follow_up_date = updates.followUpDate;
  if (updates.payerRep !== undefined) row.payer_rep = updates.payerRep;
  if (updates.contactLog !== undefined) row.contact_log = updates.contactLog;
  const { error } = await db().from('ar_followups').update(row).eq('id', id);
  return !error;
}

// ─── Eligibility ──────────────────────────────────────────────────────────────
export interface EligibilityResult {
  id: string;
  patientId: string;
  patientName: string;
  insuranceCompany: string;
  memberId: string;
  checkDate: string;
  eligibilityStatus: 'Active' | 'Inactive' | 'Pending';
  planType: string;
  deductible: number;
  deductibleMet: number;
  copay: number;
  outOfPocketMax: number;
  outOfPocketMet: number;
  coverageStart: string;
  coverageEnd: string;
  inNetwork: boolean;
  coinsurance: number;
}

function mapEligibility(row: any): EligibilityResult {
  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: row.patient_name,
    insuranceCompany: row.insurance_company,
    memberId: row.member_id ?? '',
    checkDate: row.check_date,
    eligibilityStatus: row.eligibility_status ?? 'Active',
    planType: row.plan_type ?? 'PPO',
    deductible: row.deductible ?? 0,
    deductibleMet: row.deductible_met ?? 0,
    copay: row.copay ?? 0,
    outOfPocketMax: row.out_of_pocket_max ?? 0,
    outOfPocketMet: row.out_of_pocket_met ?? 0,
    coverageStart: row.coverage_start ?? '',
    coverageEnd: row.coverage_end ?? '',
    inNetwork: row.in_network ?? true,
    coinsurance: row.coinsurance ?? 20,
  };
}

export async function fetchEligibilityHistory(patientId?: string): Promise<EligibilityResult[]> {
  let q = db()
    .from('eligibility_checks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  if (patientId) q = q.eq('patient_id', patientId);
  const { data, error } = await q;
  if (error || !data) return [];
  return data.map(mapEligibility);
}

export async function saveEligibilityCheck(
  r: Omit<EligibilityResult, 'id'>
): Promise<EligibilityResult | null> {
  const { data, error } = await db()
    .from('eligibility_checks')
    .insert({
      patient_id: r.patientId,
      patient_name: r.patientName,
      insurance_company: r.insuranceCompany,
      member_id: r.memberId,
      check_date: r.checkDate,
      eligibility_status: r.eligibilityStatus,
      plan_type: r.planType,
      deductible: r.deductible,
      deductible_met: r.deductibleMet,
      copay: r.copay,
      out_of_pocket_max: r.outOfPocketMax,
      out_of_pocket_met: r.outOfPocketMet,
      coverage_start: r.coverageStart,
      coverage_end: r.coverageEnd,
      in_network: r.inNetwork,
      coinsurance: r.coinsurance,
    })
    .select()
    .single();
  if (error || !data) return null;
  return mapEligibility(data);
}

// ─── Seed Mock Data ───────────────────────────────────────────────────────────
export async function seedMockDataIfEmpty(): Promise<void> {
  try {
    const { data } = await db().from('patients').select('id').limit(1);
    if (data && data.length > 0) return;
    await db().from('patients').upsert(MOCK_PATIENTS.map(patientToRow));
    await db().from('claims').upsert(MOCK_CLAIMS.map(claimToRow));
    await db().from('appointments').upsert(MOCK_APPOINTMENTS.map(appointmentToRow));
  } catch (_) {}
}
