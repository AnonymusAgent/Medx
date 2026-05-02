export type ClaimStatus = 'Draft' | 'Pending' | 'Submitted' | 'Paid' | 'Denied' | 'Partial';
export type AppointmentStatus = 'Scheduled' | 'Checked In' | 'Completed' | 'Cancelled' | 'No Show';
export type UserRole = 'Admin' | 'Biller' | 'Coder' | 'Provider';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: 'M' | 'F' | 'Other';
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  ssn: string;
  primaryInsurance: Insurance;
  secondaryInsurance?: Insurance;
  balance: number;
  lastVisit: string;
  providerId: string;
  status: 'Active' | 'Inactive';
}

export interface Insurance {
  company: string;
  memberId: string;
  groupNumber: string;
  planType: 'HMO' | 'PPO' | 'EPO' | 'Medicare' | 'Medicaid' | 'Other';
  copay: number;
  deductible: number;
  eligibilityStatus: 'Verified' | 'Pending' | 'Inactive';
}

export interface Claim {
  id: string;
  claimNumber: string;
  patientId: string;
  patientName: string;
  serviceDate: string;
  submittedDate?: string;
  paidDate?: string;
  providerId: string;
  providerName: string;
  dos: string;
  cptCodes: CPTCode[];
  icdCodes: string[];
  totalCharge: number;
  allowedAmount: number;
  paidAmount: number;
  adjustments: number;
  patientBalance: number;
  status: ClaimStatus;
  insuranceCompany: string;
  denialReason?: string;
  notes?: string;
}

export interface CPTCode {
  code: string;
  description: string;
  units: number;
  charge: number;
  modifier?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  date: string;
  time: string;
  duration: number; // minutes
  type: string;
  status: AppointmentStatus;
  notes?: string;
  room?: string;
}

export interface Provider {
  id: string;
  name: string;
  specialty: string;
  npi: string;
  color: string;
}

export const MOCK_CURRENT_USER = {
  id: 'u1',
  name: 'Sarah Mitchell',
  role: 'Admin' as UserRole,
  email: 'sarah.mitchell@medpractice.com',
  avatar: 'SM',
  practiceName: 'Sunrise Medical Group',
};

export const MOCK_PROVIDERS: Provider[] = [
  { id: 'p1', name: 'Dr. James Wilson', specialty: 'Family Medicine', npi: '1234567890', color: '#1A56DB' },
  { id: 'p2', name: 'Dr. Emily Chen', specialty: 'Internal Medicine', npi: '0987654321', color: '#0E9F6E' },
  { id: 'p3', name: 'Dr. Robert Torres', specialty: 'Cardiology', npi: '1122334455', color: '#E02424' },
  { id: 'p4', name: 'Dr. Aisha Patel', specialty: 'Pediatrics', npi: '5544332211', color: '#FF8800' },
];

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'pt001',
    firstName: 'Michael',
    lastName: 'Johnson',
    dob: '1968-04-15',
    gender: 'M',
    phone: '(555) 234-5678',
    email: 'mjohnson@email.com',
    address: '1234 Oak Street',
    city: 'Houston',
    state: 'TX',
    zip: '77001',
    ssn: '***-**-1234',
    balance: 145.50,
    lastVisit: '2026-04-10',
    providerId: 'p1',
    status: 'Active',
    primaryInsurance: {
      company: 'BlueCross BlueShield',
      memberId: 'XMJ234567',
      groupNumber: 'GRP-55201',
      planType: 'PPO',
      copay: 30,
      deductible: 1500,
      eligibilityStatus: 'Verified',
    },
  },
  {
    id: 'pt002',
    firstName: 'Linda',
    lastName: 'Rodriguez',
    dob: '1975-11-22',
    gender: 'F',
    phone: '(555) 345-6789',
    email: 'lrodriguez@email.com',
    address: '5678 Maple Ave',
    city: 'Dallas',
    state: 'TX',
    zip: '75201',
    ssn: '***-**-5678',
    balance: 0,
    lastVisit: '2026-04-18',
    providerId: 'p2',
    status: 'Active',
    primaryInsurance: {
      company: 'Aetna',
      memberId: 'AET789012',
      groupNumber: 'GRP-33102',
      planType: 'HMO',
      copay: 20,
      deductible: 2000,
      eligibilityStatus: 'Verified',
    },
    secondaryInsurance: {
      company: 'Medicare',
      memberId: 'MCARE-LR-789',
      groupNumber: 'N/A',
      planType: 'Medicare',
      copay: 0,
      deductible: 240,
      eligibilityStatus: 'Verified',
    },
  },
  {
    id: 'pt003',
    firstName: 'David',
    lastName: 'Kim',
    dob: '1990-07-08',
    gender: 'M',
    phone: '(555) 456-7890',
    email: 'dkim@email.com',
    address: '910 Pine Lane',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    ssn: '***-**-9012',
    balance: 320.00,
    lastVisit: '2026-03-25',
    providerId: 'p3',
    status: 'Active',
    primaryInsurance: {
      company: 'United Healthcare',
      memberId: 'UHC456123',
      groupNumber: 'GRP-88401',
      planType: 'EPO',
      copay: 40,
      deductible: 3000,
      eligibilityStatus: 'Pending',
    },
  },
  {
    id: 'pt004',
    firstName: 'Jennifer',
    lastName: 'Martinez',
    dob: '1982-02-14',
    gender: 'F',
    phone: '(555) 567-8901',
    email: 'jmartinez@email.com',
    address: '2345 Elm Blvd',
    city: 'San Antonio',
    state: 'TX',
    zip: '78201',
    ssn: '***-**-3456',
    balance: 75.00,
    lastVisit: '2026-04-20',
    providerId: 'p1',
    status: 'Active',
    primaryInsurance: {
      company: 'Cigna',
      memberId: 'CIG654321',
      groupNumber: 'GRP-22003',
      planType: 'PPO',
      copay: 25,
      deductible: 1000,
      eligibilityStatus: 'Verified',
    },
  },
  {
    id: 'pt005',
    firstName: 'Robert',
    lastName: 'Thompson',
    dob: '1955-09-30',
    gender: 'M',
    phone: '(555) 678-9012',
    email: 'rthompson@email.com',
    address: '3456 Birch Court',
    city: 'Houston',
    state: 'TX',
    zip: '77002',
    ssn: '***-**-7890',
    balance: 0,
    lastVisit: '2026-04-22',
    providerId: 'p2',
    status: 'Active',
    primaryInsurance: {
      company: 'Medicare',
      memberId: 'MCARE-RT-456',
      groupNumber: 'N/A',
      planType: 'Medicare',
      copay: 0,
      deductible: 240,
      eligibilityStatus: 'Verified',
    },
  },
  {
    id: 'pt006',
    firstName: 'Sarah',
    lastName: 'Williams',
    dob: '1998-05-17',
    gender: 'F',
    phone: '(555) 789-0123',
    email: 'swilliams@email.com',
    address: '789 Cedar Dr',
    city: 'Plano',
    state: 'TX',
    zip: '75023',
    ssn: '***-**-2345',
    balance: 200.00,
    lastVisit: '2026-02-28',
    providerId: 'p4',
    status: 'Inactive',
    primaryInsurance: {
      company: 'Medicaid',
      memberId: 'MCD-SW-123',
      groupNumber: 'N/A',
      planType: 'Medicaid',
      copay: 0,
      deductible: 0,
      eligibilityStatus: 'Inactive',
    },
  },
];

export const MOCK_CLAIMS: Claim[] = [
  {
    id: 'cl001',
    claimNumber: 'CLM-2026-00541',
    patientId: 'pt001',
    patientName: 'Michael Johnson',
    serviceDate: '2026-04-10',
    submittedDate: '2026-04-12',
    paidDate: '2026-04-20',
    providerId: 'p1',
    providerName: 'Dr. James Wilson',
    dos: '2026-04-10',
    cptCodes: [
      { code: '99213', description: 'Office Visit – Established Patient, Low Complexity', units: 1, charge: 180.00 },
      { code: '93000', description: 'Electrocardiogram, routine ECG', units: 1, charge: 75.00 },
    ],
    icdCodes: ['I10', 'Z87.39'],
    totalCharge: 255.00,
    allowedAmount: 210.00,
    paidAmount: 180.00,
    adjustments: 45.00,
    patientBalance: 30.00,
    status: 'Paid',
    insuranceCompany: 'BlueCross BlueShield',
  },
  {
    id: 'cl002',
    claimNumber: 'CLM-2026-00542',
    patientId: 'pt002',
    patientName: 'Linda Rodriguez',
    serviceDate: '2026-04-18',
    submittedDate: '2026-04-19',
    providerId: 'p2',
    providerName: 'Dr. Emily Chen',
    dos: '2026-04-18',
    cptCodes: [
      { code: '99214', description: 'Office Visit – Established Patient, Moderate Complexity', units: 1, charge: 230.00 },
      { code: '85025', description: 'Complete Blood Count with Differential', units: 1, charge: 45.00 },
    ],
    icdCodes: ['E11.9', 'Z79.4'],
    totalCharge: 275.00,
    allowedAmount: 0,
    paidAmount: 0,
    adjustments: 0,
    patientBalance: 0,
    status: 'Submitted',
    insuranceCompany: 'Aetna',
  },
  {
    id: 'cl003',
    claimNumber: 'CLM-2026-00535',
    patientId: 'pt003',
    patientName: 'David Kim',
    serviceDate: '2026-03-25',
    submittedDate: '2026-03-27',
    providerId: 'p3',
    providerName: 'Dr. Robert Torres',
    dos: '2026-03-25',
    cptCodes: [
      { code: '93306', description: 'Echocardiography, Complete', units: 1, charge: 850.00 },
      { code: '99215', description: 'Office Visit – Established Patient, High Complexity', units: 1, charge: 310.00 },
    ],
    icdCodes: ['I25.10', 'I48.0'],
    totalCharge: 1160.00,
    allowedAmount: 920.00,
    paidAmount: 600.00,
    adjustments: 240.00,
    patientBalance: 320.00,
    status: 'Denied',
    insuranceCompany: 'United Healthcare',
    denialReason: 'CO-4: The service is inconsistent with the diagnosis.',
  },
  {
    id: 'cl004',
    claimNumber: 'CLM-2026-00543',
    patientId: 'pt004',
    patientName: 'Jennifer Martinez',
    serviceDate: '2026-04-20',
    providerId: 'p1',
    providerName: 'Dr. James Wilson',
    dos: '2026-04-20',
    cptCodes: [
      { code: '99203', description: 'Office Visit – New Patient, Low Complexity', units: 1, charge: 175.00 },
    ],
    icdCodes: ['M54.5'],
    totalCharge: 175.00,
    allowedAmount: 0,
    paidAmount: 0,
    adjustments: 0,
    patientBalance: 0,
    status: 'Draft',
    insuranceCompany: 'Cigna',
  },
  {
    id: 'cl005',
    claimNumber: 'CLM-2026-00538',
    patientId: 'pt005',
    patientName: 'Robert Thompson',
    serviceDate: '2026-04-15',
    submittedDate: '2026-04-16',
    paidDate: '2026-04-24',
    providerId: 'p2',
    providerName: 'Dr. Emily Chen',
    dos: '2026-04-15',
    cptCodes: [
      { code: '99213', description: 'Office Visit – Established Patient, Low Complexity', units: 1, charge: 165.00 },
      { code: '71046', description: 'X-Ray Chest, 2 Views', units: 1, charge: 120.00 },
    ],
    icdCodes: ['J18.9'],
    totalCharge: 285.00,
    allowedAmount: 255.00,
    paidAmount: 255.00,
    adjustments: 30.00,
    patientBalance: 0,
    status: 'Paid',
    insuranceCompany: 'Medicare',
  },
  {
    id: 'cl006',
    claimNumber: 'CLM-2026-00539',
    patientId: 'pt001',
    patientName: 'Michael Johnson',
    serviceDate: '2026-04-08',
    submittedDate: '2026-04-10',
    paidDate: '2026-04-18',
    providerId: 'p1',
    providerName: 'Dr. James Wilson',
    dos: '2026-04-08',
    cptCodes: [
      { code: '99212', description: 'Office Visit – Established Patient, Straightforward', units: 1, charge: 120.00 },
    ],
    icdCodes: ['J06.9'],
    totalCharge: 120.00,
    allowedAmount: 105.00,
    paidAmount: 75.00,
    adjustments: 30.00,
    patientBalance: 30.00,
    status: 'Partial',
    insuranceCompany: 'BlueCross BlueShield',
  },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt001',
    patientId: 'pt001',
    patientName: 'Michael Johnson',
    providerId: 'p1',
    providerName: 'Dr. James Wilson',
    date: '2026-04-26',
    time: '09:00 AM',
    duration: 30,
    type: 'Follow-up',
    status: 'Scheduled',
    room: 'Exam 1',
  },
  {
    id: 'apt002',
    patientId: 'pt002',
    patientName: 'Linda Rodriguez',
    providerId: 'p2',
    providerName: 'Dr. Emily Chen',
    date: '2026-04-26',
    time: '09:30 AM',
    duration: 45,
    type: 'Chronic Care',
    status: 'Checked In',
    room: 'Exam 3',
  },
  {
    id: 'apt003',
    patientId: 'pt004',
    patientName: 'Jennifer Martinez',
    providerId: 'p1',
    providerName: 'Dr. James Wilson',
    date: '2026-04-26',
    time: '10:00 AM',
    duration: 30,
    type: 'New Patient',
    status: 'Scheduled',
    room: 'Exam 2',
  },
  {
    id: 'apt004',
    patientId: 'pt003',
    patientName: 'David Kim',
    providerId: 'p3',
    providerName: 'Dr. Robert Torres',
    date: '2026-04-26',
    time: '11:00 AM',
    duration: 60,
    type: 'Cardiac Eval',
    status: 'Scheduled',
    room: 'Cardiology Suite',
  },
  {
    id: 'apt005',
    patientId: 'pt005',
    patientName: 'Robert Thompson',
    providerId: 'p2',
    providerName: 'Dr. Emily Chen',
    date: '2026-04-26',
    time: '02:00 PM',
    duration: 30,
    type: 'Follow-up',
    status: 'Completed',
    room: 'Exam 3',
  },
  {
    id: 'apt006',
    patientId: 'pt006',
    patientName: 'Sarah Williams',
    providerId: 'p4',
    providerName: 'Dr. Aisha Patel',
    date: '2026-04-25',
    time: '03:00 PM',
    duration: 30,
    type: 'Wellness Visit',
    status: 'No Show',
  },
];

export const DASHBOARD_METRICS = {
  totalRevenue: 128450.75,
  collectionRate: 87.3,
  pendingClaims: 23,
  denialRate: 8.2,
  arOver90: 14200.00,
  avgDaysToPayment: 18,
  todayAppointments: 12,
  totalPatients: 1847,
  claimsThisMonth: 156,
  chargesThisMonth: 58320.00,
  paymentsThisMonth: 49800.00,
  adjustmentsThisMonth: 4100.00,
};

export const AR_AGING = [
  { bucket: '0-30 days', amount: 28400, count: 45, percentage: 35 },
  { bucket: '31-60 days', amount: 18200, count: 29, percentage: 22 },
  { bucket: '61-90 days', amount: 12100, count: 18, percentage: 15 },
  { bucket: '91-120 days', amount: 9800, count: 14, percentage: 12 },
  { bucket: '120+ days', amount: 13200, count: 19, percentage: 16 },
];

export const CPT_SUGGESTIONS = [
  { code: '99213', description: 'Office Visit – Est. Patient, Low Complexity', charge: 180.00 },
  { code: '99214', description: 'Office Visit – Est. Patient, Moderate Complexity', charge: 230.00 },
  { code: '99215', description: 'Office Visit – Est. Patient, High Complexity', charge: 310.00 },
  { code: '99203', description: 'Office Visit – New Patient, Low Complexity', charge: 175.00 },
  { code: '99204', description: 'Office Visit – New Patient, Moderate Complexity', charge: 260.00 },
  { code: '93000', description: 'Electrocardiogram, Routine ECG', charge: 75.00 },
  { code: '85025', description: 'Complete Blood Count with Differential', charge: 45.00 },
  { code: '71046', description: 'X-Ray Chest, 2 Views', charge: 120.00 },
  { code: '93306', description: 'Echocardiography, Complete', charge: 850.00 },
  { code: '36415', description: 'Routine Venipuncture', charge: 25.00 },
];

export const ICD10_SUGGESTIONS = [
  { code: 'I10', description: 'Essential (primary) hypertension' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
  { code: 'M54.5', description: 'Low back pain' },
  { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified' },
  { code: 'I25.10', description: 'Atherosclerotic heart disease of native coronary artery' },
  { code: 'J18.9', description: 'Pneumonia, unspecified organism' },
  { code: 'I48.0', description: 'Paroxysmal atrial fibrillation' },
  { code: 'Z87.39', description: 'Personal history of other endocrine, nutritional, metabolic diseases' },
];
