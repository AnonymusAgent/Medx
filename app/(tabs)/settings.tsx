import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Switch,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { useAlert, useAuth } from '@/template';
import { useApp } from '@/hooks/useApp';
import { MOCK_CURRENT_USER, MOCK_PROVIDERS } from '@/constants/mockData';
import { fetchAllUsers, updateUserProfile, UserProfile } from '@/services/supabaseService';
import { useRouter } from 'expo-router';

type SettingsSection =
  | 'main'
  | 'practice'
  | 'users'
  | 'billing'
  | 'payers'
  | 'clearinghouse'
  | 'notifications'
  | 'security'
  | 'codes'
  | 'about';

interface SettingRowProps {
  icon: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

function SettingRow({ icon, label, subtitle, onPress, rightElement, danger }: SettingRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.settingRow, pressed && onPress ? styles.settingRowPressed : null]}
    >
      <MaterialIcons name={icon as any} size={20} color={danger ? Colors.danger : Colors.primary} />
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, danger && { color: Colors.danger }]}>{label}</Text>
        {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
      </View>
      {rightElement ?? (onPress ? <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} /> : null)}
    </Pressable>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionCardTitle}>{title}</Text>
      <View style={styles.sectionCardBody}>{children}</View>
    </View>
  );
}

// ── Live Admin Users Panel ──────────────────────────────────────────────────────
function UsersSection({ onBack }: { onBack: () => void }) {
  const { showAlert } = useAlert();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const ROLE_OPTIONS: UserProfile['role'][] = ['Admin', 'Biller', 'Coder', 'Provider'];
  const ROLE_COLORS: Record<string, string> = {
    Admin: Colors.danger, Biller: Colors.primary, Coder: Colors.info, Provider: Colors.success,
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (_) {
      showAlert('Error', 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, []);

  const handleRoleChange = async (userId: string, role: UserProfile['role']) => {
    setSavingId(userId);
    try {
      await updateUserProfile(userId, { role });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    } catch (_) {
      showAlert('Error', 'Failed to update role.');
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    setSavingId(userId);
    try {
      await updateUserProfile(userId, { isActive });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive } : u));
    } catch (_) {
      showAlert('Error', 'Failed to update status.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <View style={styles.root}>
      <SubHeader title="Users & Roles" onBack={onBack} rightAction={
        <Pressable onPress={loadUsers} style={{ padding: 4 }}>
          <MaterialIcons name="refresh" size={20} color="#fff" />
        </Pressable>
      } />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Role Permission Reference */}
        <SectionCard title="Role Permissions">
          {[
            { role: 'Admin', perms: 'Full access — all modules, settings, reports, user management', color: Colors.danger },
            { role: 'Biller', perms: 'Claims, payments, AR follow-up, patient billing, reports', color: Colors.primary },
            { role: 'Coder', perms: 'Charge entry, CPT/ICD coding, code library, read-only reports', color: Colors.info },
            { role: 'Provider', perms: 'Schedule, SOAP notes, patient records (read-only billing)', color: Colors.success },
          ].map(r => (
            <View key={r.role} style={styles.roleRow}>
              <View style={[styles.roleChip, { backgroundColor: r.color + '20' }]}>
                <Text style={[styles.roleChipText, { color: r.color }]}>{r.role}</Text>
              </View>
              <Text style={styles.rolePerms}>{r.perms}</Text>
            </View>
          ))}
        </SectionCard>

        {/* Live Staff List */}
        <Text style={styles.groupLabel}>Staff Members</Text>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="people" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No registered users yet.</Text>
            <Text style={styles.emptySubText}>Users will appear here after they create an account.</Text>
          </View>
        ) : (
          users.map(user => {
            const roleColor = ROLE_COLORS[user.role] ?? Colors.primary;
            const initials = (user.fullName ?? user.email)
              .split(/[\s@]/).filter(Boolean).slice(0, 2)
              .map(w => w[0]?.toUpperCase() ?? '').join('');
            const isSaving = savingId === user.id;

            return (
              <View key={user.id} style={styles.userCard}>
                {/* User Identity */}
                <View style={styles.userCardTop}>
                  <View style={[styles.userAvatar, { backgroundColor: roleColor }]}>
                    <Text style={styles.userAvatarText}>{initials || '?'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName2}>{user.fullName ?? 'No Name'}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                  </View>
                  {isSaving ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <View style={[
                      styles.activeToggleWrap,
                      { backgroundColor: user.isActive ? Colors.successLight : Colors.dangerLight }
                    ]}>
                      <Text style={[styles.activeToggleLabel, { color: user.isActive ? Colors.success : Colors.danger }]}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Text>
                      <Switch
                        value={user.isActive}
                        onValueChange={v => handleToggleActive(user.id, v)}
                        trackColor={{ true: Colors.success, false: Colors.border }}
                        thumbColor="#fff"
                        style={{ transform: [{ scale: 0.8 }] }}
                      />
                    </View>
                  )}
                </View>

                {/* Role Selector */}
                <View style={styles.roleSelector}>
                  <Text style={styles.roleSelectorLabel}>Role:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                    <View style={styles.roleOptions}>
                      {ROLE_OPTIONS.map(role => (
                        <Pressable
                          key={role}
                          onPress={() => handleRoleChange(user.id, role)}
                          disabled={isSaving}
                          style={[
                            styles.roleOption,
                            user.role === role && {
                              backgroundColor: ROLE_COLORS[role],
                              borderColor: ROLE_COLORS[role],
                            },
                          ]}
                        >
                          <Text style={[
                            styles.roleOptionText,
                            user.role === role && { color: '#fff' },
                          ]}>{role}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { logout } = useAuth();
  const { currentUser } = useApp();
  const router = useRouter();
  const [section, setSection] = useState<SettingsSection>('main');

  // Toggle states
  const [notifAppt, setNotifAppt] = useState(true);
  const [notifClaim, setNotifClaim] = useState(true);
  const [notifDenial, setNotifDenial] = useState(true);
  const [notifAR, setNotifAR] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSMS, setNotifSMS] = useState(false);
  const [notifPush, setNotifPush] = useState(true);
  const [notifNoShow, setNotifNoShow] = useState(true);
  const [notifPayment, setNotifPayment] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(true);
  const [auditLog, setAuditLog] = useState(true);
  const [autoScrub, setAutoScrub] = useState(true);
  const [autoEligibility, setAutoEligibility] = useState(false);
  const [era835, setEra835] = useState(true);

  // Form states for practice
  const [practiceName, setPracticeName] = useState('Sunrise Medical Group');
  const [npi, setNpi] = useState('1234567890');
  const [taxId, setTaxId] = useState('75-1234567');
  const [address, setAddress] = useState('500 Medical Center Blvd');
  const [city, setCity] = useState('Houston');
  const [state, setState] = useState('TX');
  const [zip, setZip] = useState('77001');
  const [phone, setPhone] = useState('(713) 555-0100');
  const [email, setEmail] = useState('billing@sunrisemedical.com');

  const handleBack = () => setSection('main');
  const handleSave = (name: string) => showAlert('Saved', `${name} settings have been saved successfully.`);

  const handleLogout = () => {
    showAlert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => { await logout(); } },
    ]);
  };

  const MAIN_MENU = [
    {
      group: 'Practice',
      items: [
        { icon: 'business', label: 'Practice Information', subtitle: 'Name, NPI, Tax ID, address', section: 'practice' as SettingsSection },
        { icon: 'people', label: 'Users & Roles', subtitle: 'Manage staff access and permissions', section: 'users' as SettingsSection },
      ],
    },
    {
      group: 'Billing Configuration',
      items: [
        { icon: 'settings', label: 'Billing Settings', subtitle: 'Defaults, fee schedule, modifiers', section: 'billing' as SettingsSection },
        { icon: 'library-books', label: 'Code Library', subtitle: 'CPT, ICD-10, HCPCS management', section: 'codes' as SettingsSection },
        { icon: 'business-center', label: 'Insurance Payers', subtitle: 'Payer IDs, contracts, fee schedules', section: 'payers' as SettingsSection },
        { icon: 'swap-horiz', label: 'Clearinghouse', subtitle: 'EDI/ERA configuration', section: 'clearinghouse' as SettingsSection },
      ],
    },
    {
      group: 'Preferences',
      items: [
        { icon: 'notifications', label: 'Notifications', subtitle: 'Alerts and reminders', section: 'notifications' as SettingsSection },
        { icon: 'security', label: 'Security & HIPAA', subtitle: '2FA, audit logs, session policies', section: 'security' as SettingsSection },
      ],
    },
    {
      group: 'System',
      items: [
        { icon: 'info', label: 'About MedBillPro', subtitle: 'Version, license, support', section: 'about' as SettingsSection },
      ],
    },
  ];

  if (section === 'users') return <UsersSection onBack={handleBack} />;

  if (section === 'main') {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSub}>System Configuration</Text>
          </View>
          <View style={styles.userBadge}>
            <Text style={styles.userBadgeText}>{currentUser.avatar}</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* User Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{currentUser.avatar}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{currentUser.name}</Text>
              <Text style={styles.profileRole}>{currentUser.role} · {currentUser.practiceName}</Text>
              <Text style={styles.profileEmail}>{currentUser.email}</Text>
            </View>
            <Pressable
              style={styles.editProfileBtn}
              onPress={() => showAlert('Edit Profile', 'Update your name and phone in the Users section.')}
            >
              <MaterialIcons name="edit" size={16} color={Colors.primary} />
            </Pressable>
          </View>

          {MAIN_MENU.map(group => (
            <View key={group.group}>
              <Text style={styles.groupLabel}>{group.group}</Text>
              <View style={styles.menuCard}>
                {group.items.map((item, i) => (
                  <Pressable
                    key={item.section}
                    onPress={() => setSection(item.section)}
                    style={({ pressed }) => [
                      styles.menuRow,
                      pressed && styles.menuRowPressed,
                      i < group.items.length - 1 && styles.menuRowBorder,
                    ]}
                  >
                    <View style={styles.menuIcon}>
                      <MaterialIcons name={item.icon as any} size={20} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                      <Text style={styles.menuSub}>{item.subtitle}</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <MaterialIcons name="logout" size={18} color={Colors.danger} />
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>

          <Text style={styles.versionText}>MedBillPro v1.0.0 · Build 2026.05.07</Text>
          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    );
  }

  // ===== PRACTICE INFORMATION =====
  if (section === 'practice') {
    return (
      <View style={styles.root}>
        <SubHeader title="Practice Information" onBack={handleBack} onSave={() => handleSave('Practice Information')} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <SectionCard title="Basic Information">
            <FormField label="Practice Name" value={practiceName} onChangeText={setPracticeName} />
            <FormField label="Group NPI" value={npi} onChangeText={setNpi} keyboardType="numeric" />
            <FormField label="Tax ID / EIN" value={taxId} onChangeText={setTaxId} />
            <FormField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <FormField label="Billing Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </SectionCard>
          <SectionCard title="Address">
            <FormField label="Street Address" value={address} onChangeText={setAddress} />
            <View style={styles.formRow}>
              <View style={{ flex: 2 }}>
                <FormField label="City" value={city} onChangeText={setCity} />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="State" value={state} onChangeText={setState} autoCapitalize="characters" maxLength={2} />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="ZIP" value={zip} onChangeText={setZip} keyboardType="numeric" maxLength={5} />
              </View>
            </View>
          </SectionCard>
          <SectionCard title="Providers">
            {MOCK_PROVIDERS.map(p => (
              <View key={p.id} style={styles.providerRow}>
                <View style={[styles.providerDotSmall, { backgroundColor: p.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.providerName}>{p.name}</Text>
                  <Text style={styles.providerSpec}>{p.specialty} · NPI: {p.npi}</Text>
                </View>
                <Pressable style={styles.providerEditBtn} onPress={() => showAlert(p.name, `Edit ${p.name}`)}>
                  <MaterialIcons name="edit" size={16} color={Colors.primary} />
                </Pressable>
              </View>
            ))}
            <Pressable style={styles.addProviderBtn} onPress={() => showAlert('Add Provider', 'Enter provider details to add them to the system.')}>
              <MaterialIcons name="person-add" size={16} color={Colors.primary} />
              <Text style={styles.addProviderText}>Add Provider</Text>
            </Pressable>
          </SectionCard>
          <SaveButton onPress={() => handleSave('Practice Information')} />
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    );
  }

  // ===== BILLING SETTINGS =====
  if (section === 'billing') {
    return (
      <View style={styles.root}>
        <SubHeader title="Billing Settings" onBack={handleBack} onSave={() => handleSave('Billing Settings')} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <SectionCard title="Claim Defaults">
            <SettingRow icon="local-hospital" label="Place of Service" subtitle="11 – Office" onPress={() => showAlert('POS', 'Select default place of service code.')} />
            <SettingRow icon="assignment-turned-in" label="Claim Type" subtitle="CMS-1500 (Professional)" onPress={() => {}} />
            <SettingRow icon="label" label="Default Rendering Provider" subtitle="Dr. James Wilson" onPress={() => {}} />
            <SettingRow icon="timer" label="Timely Filing Limit" subtitle="365 days (most payers)" onPress={() => {}} />
          </SectionCard>
          <SectionCard title="Automation">
            <SettingRow icon="verified" label="Auto Claim Scrubbing" subtitle="Validate claims before submission" rightElement={<Switch value={autoScrub} onValueChange={setAutoScrub} trackColor={{ true: Colors.primary }} />} />
            <SettingRow icon="assignment-ind" label="Auto Eligibility Check" subtitle="Verify on appointment creation" rightElement={<Switch value={autoEligibility} onValueChange={setAutoEligibility} trackColor={{ true: Colors.primary }} />} />
            <SettingRow icon="sync" label="ERA/835 Auto-Posting" subtitle="Auto-post ERA payments when received" rightElement={<Switch value={era835} onValueChange={setEra835} trackColor={{ true: Colors.primary }} />} />
          </SectionCard>
          <SectionCard title="Fee Schedule">
            <SettingRow icon="attach-money" label="Fee Schedule Name" subtitle="2026 Physician Fee Schedule" onPress={() => {}} />
            <SettingRow icon="trending-up" label="Markup Percentage" subtitle="0% (billed at fee schedule)" onPress={() => {}} />
            <SettingRow icon="upload-file" label="Import Fee Schedule" subtitle="Upload CSV/Excel file" onPress={() => showAlert('Import', 'Fee schedule import available.')} />
          </SectionCard>
          <SectionCard title="Payment Posting">
            <SettingRow icon="account-balance-wallet" label="Adjustment Reason Codes" subtitle="CO, PR, OA codes configured" onPress={() => {}} />
            <SettingRow icon="receipt" label="Patient Statement Settings" subtitle="Monthly, email + mail" onPress={() => {}} />
            <SettingRow icon="warning" label="Collections Threshold" subtitle="Balance > $200 after 90 days" onPress={() => {}} />
          </SectionCard>
          <SaveButton onPress={() => handleSave('Billing Settings')} />
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    );
  }

  // ===== CODE LIBRARY =====
  if (section === 'codes') {
    return (
      <View style={styles.root}>
        <SubHeader title="Code Library" onBack={handleBack} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.kpiRow3}>
            {[{ label: 'CPT Codes', value: '10', color: Colors.primary }, { label: 'ICD-10', value: '8', color: Colors.info }, { label: 'HCPCS', value: '4', color: Colors.success }].map(k => (
              <View key={k.label} style={styles.miniKpi}>
                <Text style={[styles.miniKpiVal, { color: k.color }]}>{k.value}</Text>
                <Text style={styles.miniKpiLabel}>{k.label}</Text>
              </View>
            ))}
          </View>
          <SectionCard title="Code Sets">
            <SettingRow icon="local-hospital" label="CPT Codes" subtitle="10 procedure codes configured" onPress={() => showAlert('CPT Library', 'Full CPT library management available.')} />
            <SettingRow icon="healing" label="ICD-10 Codes" subtitle="8 diagnosis codes in use" onPress={() => showAlert('ICD-10 Library', 'Full ICD-10 library available.')} />
            <SettingRow icon="medication" label="HCPCS Codes" subtitle="4 supply/DME codes" onPress={() => showAlert('HCPCS Library', 'HCPCS code management available.')} />
            <SettingRow icon="extension" label="Modifiers" subtitle="25, 59, GT, 95, GX configured" onPress={() => {}} />
          </SectionCard>
          <SectionCard title="Code Updates">
            <SettingRow icon="update" label="Last Updated" subtitle="April 1, 2026 — 2026 code year" />
            <SettingRow icon="cloud-download" label="Download Annual Updates" subtitle="CMS annual code set update" onPress={() => showAlert('Update Codes', 'Code set update available.')} />
            <SettingRow icon="upload-file" label="Import Custom Codes" subtitle="Upload practice-specific codes" onPress={() => showAlert('Import', 'Custom code import available.')} />
          </SectionCard>
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    );
  }

  // ===== INSURANCE PAYERS =====
  if (section === 'payers') {
    const PAYERS = [
      { name: 'BlueCross BlueShield', payerId: 'BCBSTX', contract: 'PPO Network', status: 'Active' },
      { name: 'Aetna', payerId: 'AETNA', contract: 'Commercial', status: 'Active' },
      { name: 'United Healthcare', payerId: 'UHC001', contract: 'Choice Plus', status: 'Active' },
      { name: 'Medicare', payerId: 'MCARE', contract: 'Part B', status: 'Active' },
      { name: 'Cigna', payerId: 'CIGNA', contract: 'Open Access', status: 'Active' },
      { name: 'Medicaid Texas', payerId: 'TXMED', contract: 'STAR', status: 'Active' },
    ];
    return (
      <View style={styles.root}>
        <SubHeader title="Insurance Payers" onBack={handleBack} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <SectionCard title={`Contracted Payers (${PAYERS.length})`}>
            {PAYERS.map(p => (
              <Pressable key={p.payerId} style={({ pressed }) => [styles.payerRow, pressed && styles.menuRowPressed]}
                onPress={() => showAlert(p.name, `Payer ID: ${p.payerId}\nContract: ${p.contract}`)}>
                <View style={styles.payerIcon}><MaterialIcons name="business" size={18} color={Colors.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payerName2}>{p.name}</Text>
                  <Text style={styles.payerMeta2}>ID: {p.payerId} · {p.contract}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: Colors.successLight }]}>
                  <Text style={[styles.statusBadgeText, { color: Colors.success }]}>{p.status}</Text>
                </View>
              </Pressable>
            ))}
          </SectionCard>
          <Pressable style={styles.primaryActionBtn} onPress={() => showAlert('Add Payer', 'Add new insurance payer.')}>
            <MaterialIcons name="add" size={18} color="#fff" />
            <Text style={styles.primaryActionText}>Add Insurance Payer</Text>
          </Pressable>
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    );
  }

  // ===== CLEARINGHOUSE =====
  if (section === 'clearinghouse') {
    return (
      <View style={styles.root}>
        <SubHeader title="Clearinghouse" onBack={handleBack} onSave={() => handleSave('Clearinghouse')} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.statusBanner, { backgroundColor: Colors.successLight }]}>
            <MaterialIcons name="check-circle" size={20} color={Colors.success} />
            <View>
              <Text style={styles.statusBannerTitle}>Clearinghouse Connected</Text>
              <Text style={styles.statusBannerSub}>Availity · Last sync: Today 6:42 AM</Text>
            </View>
          </View>
          <SectionCard title="EDI Configuration">
            <SettingRow icon="swap-horiz" label="Clearinghouse" subtitle="Availity Real-Time Network" onPress={() => {}} />
            <SettingRow icon="vpn-key" label="Submitter ID" subtitle="SMGHL001" onPress={() => {}} />
            <SettingRow icon="receipt-long" label="Transaction Set" subtitle="837P (Professional Claims)" onPress={() => {}} />
            <SettingRow icon="sync" label="Sync Frequency" subtitle="Every 4 hours / on submit" onPress={() => {}} />
          </SectionCard>
          <SectionCard title="ERA / Remittance">
            <SettingRow icon="payments" label="ERA Enrollment" subtitle="Enrolled with 6 payers" onPress={() => {}} />
            <SettingRow icon="file-download" label="835 Download Path" subtitle="Auto-import and post" onPress={() => {}} />
            <SettingRow icon="description" label="277 Acknowledgment" subtitle="Claim status acknowledgments" onPress={() => {}} />
          </SectionCard>
          <SectionCard title="Submission Logs">
            {[
              { date: '2026-05-07', batch: 'Batch #4815', claims: 12, status: 'Accepted' },
              { date: '2026-05-06', batch: 'Batch #4814', claims: 14, status: 'Accepted' },
              { date: '2026-05-05', batch: 'Batch #4813', claims: 8, status: 'Rejected' },
            ].map(log => (
              <View key={log.batch} style={styles.logRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logBatch}>{log.batch}</Text>
                  <Text style={styles.logMeta}>{log.date} · {log.claims} claims</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: log.status === 'Accepted' ? Colors.successLight : Colors.dangerLight }]}>
                  <Text style={[styles.statusBadgeText, { color: log.status === 'Accepted' ? Colors.success : Colors.danger }]}>{log.status}</Text>
                </View>
              </View>
            ))}
          </SectionCard>
          <SaveButton onPress={() => handleSave('Clearinghouse')} />
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    );
  }

  // ===== NOTIFICATIONS =====
  if (section === 'notifications') {
    return (
      <View style={styles.root}>
        <SubHeader title="Notifications" onBack={handleBack} onSave={() => handleSave('Notifications')} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.statusBanner, { backgroundColor: Colors.primaryLight }]}>
            <MaterialIcons name="notifications-active" size={20} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusBannerTitle, { color: Colors.primaryDark }]}>Notifications Active</Text>
              <Text style={styles.statusBannerSub}>In-app, email, and push alerts are enabled</Text>
            </View>
          </View>

          <SectionCard title="Delivery Methods">
            <SettingRow icon="notifications" label="Push Notifications" subtitle="In-app alerts on device" rightElement={<Switch value={notifPush} onValueChange={setNotifPush} trackColor={{ true: Colors.primary }} />} />
            <SettingRow icon="email" label="Email Notifications" subtitle="billing@sunrisemedical.com" rightElement={<Switch value={notifEmail} onValueChange={setNotifEmail} trackColor={{ true: Colors.primary }} />} />
            <SettingRow icon="sms" label="SMS Notifications" subtitle="Text message alerts" rightElement={<Switch value={notifSMS} onValueChange={setNotifSMS} trackColor={{ true: Colors.primary }} />} />
          </SectionCard>

          <SectionCard title="Billing Alerts">
            <SettingRow icon="cancel" label="Denial Received" subtitle="Notify when claim is denied" rightElement={<Switch value={notifDenial} onValueChange={setNotifDenial} trackColor={{ true: Colors.primary }} />} />
            <SettingRow icon="receipt-long" label="Claim Status Updates" subtitle="Accepted, rejected, paid" rightElement={<Switch value={notifClaim} onValueChange={setNotifClaim} trackColor={{ true: Colors.primary }} />} />
            <SettingRow icon="hourglass-bottom" label="AR Aging Threshold" subtitle="Alert when 90+ days AR rises" rightElement={<Switch value={notifAR} onValueChange={setNotifAR} trackColor={{ true: Colors.primary }} />} />
            <SettingRow icon="payments" label="Payment Posted" subtitle="ERA/check payment received" rightElement={<Switch value={notifPayment} onValueChange={setNotifPayment} trackColor={{ true: Colors.primary }} />} />
          </SectionCard>

          <SectionCard title="Schedule Alerts">
            <SettingRow icon="event" label="Appointment Reminders" subtitle="24h and 1h before appointment" rightElement={<Switch value={notifAppt} onValueChange={setNotifAppt} trackColor={{ true: Colors.primary }} />} />
            <SettingRow icon="event-busy" label="No Show Alerts" subtitle="Flag unchecked-in patients" rightElement={<Switch value={notifNoShow} onValueChange={setNotifNoShow} trackColor={{ true: Colors.primary }} />} />
          </SectionCard>

          <SectionCard title="Scheduled Reports">
            <SettingRow icon="schedule" label="Daily Summary" subtitle="8:00 AM — daily billing snapshot" onPress={() => showAlert('Daily Summary', 'Configure delivery time and recipients.')} />
            <SettingRow icon="bar-chart" label="Weekly AR Report" subtitle="Every Monday — aging summary" onPress={() => showAlert('Weekly AR', 'Configure weekly AR report settings.')} />
            <SettingRow icon="summarize" label="Monthly Financial Report" subtitle="1st of month — full P&L" onPress={() => showAlert('Monthly Report', 'Configure monthly financial report.')} />
          </SectionCard>

          <SaveButton onPress={() => handleSave('Notifications')} />
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    );
  }

  // ===== SECURITY & HIPAA =====
  if (section === 'security') {
    return (
      <View style={styles.root}>
        <SubHeader title="Security & HIPAA" onBack={handleBack} onSave={() => handleSave('Security')} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.statusBanner, { backgroundColor: Colors.primaryLight }]}>
            <MaterialIcons name="verified-user" size={20} color={Colors.primary} />
            <View>
              <Text style={[styles.statusBannerTitle, { color: Colors.primaryDark }]}>HIPAA Compliant Mode Active</Text>
              <Text style={styles.statusBannerSub}>All PHI is encrypted at rest and in transit</Text>
            </View>
          </View>
          <SectionCard title="Authentication">
            <SettingRow icon="lock" label="Two-Factor Authentication" subtitle="Require OTP on every login" rightElement={<Switch value={twoFactor} onValueChange={setTwoFactor} trackColor={{ true: Colors.primary }} />} />
            <SettingRow icon="timer" label="Session Timeout" subtitle="Auto-logout after 15 min idle" rightElement={<Switch value={sessionTimeout} onValueChange={setSessionTimeout} trackColor={{ true: Colors.primary }} />} />
            <SettingRow icon="password" label="Password Policy" subtitle="Min 6 chars required" onPress={() => {}} />
          </SectionCard>
          <SectionCard title="HIPAA Controls">
            <SettingRow icon="history" label="Audit Logs" subtitle="Track all PHI access and changes" rightElement={<Switch value={auditLog} onValueChange={setAuditLog} trackColor={{ true: Colors.primary }} />} />
            <SettingRow icon="visibility-off" label="Minimum Necessary Access" subtitle="Role-based PHI access controls" onPress={() => {}} />
            <SettingRow icon="delete-forever" label="Data Retention Policy" subtitle="7 years per HIPAA requirements" onPress={() => {}} />
            <SettingRow icon="description" label="Business Associate Agreements" subtitle="3 BAAs on file" onPress={() => showAlert('BAAs', 'Business associate agreement management.')} />
          </SectionCard>
          <SectionCard title="Data Security">
            <SettingRow icon="encrypted" label="Encryption Standard" subtitle="AES-256 at rest · TLS 1.3 in transit" />
            <SettingRow icon="backup" label="Data Backup" subtitle="Daily automated backup — 30 day retention" onPress={() => {}} />
            <SettingRow icon="download" label="Export My Data" subtitle="Download HIPAA-compliant data export" onPress={() => showAlert('Export', 'Data export will be sent to your email.')} />
          </SectionCard>
          <Pressable style={[styles.primaryActionBtn, { backgroundColor: Colors.danger }]}
            onPress={() => showAlert('Revoke All Sessions', 'This will log out all devices immediately.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Revoke All', style: 'destructive' },
            ])}>
            <MaterialIcons name="logout" size={18} color="#fff" />
            <Text style={styles.primaryActionText}>Revoke All Active Sessions</Text>
          </Pressable>
          <SaveButton onPress={() => handleSave('Security')} />
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    );
  }

  // ===== ABOUT =====
  if (section === 'about') {
    return (
      <View style={styles.root}>
        <SubHeader title="About MedBillPro" onBack={handleBack} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.aboutHero}>
            <View style={styles.aboutIcon}><MaterialIcons name="local-hospital" size={40} color="#fff" /></View>
            <Text style={styles.aboutAppName}>MedBillPro</Text>
            <Text style={styles.aboutVersion}>Version 1.0.0 · Build 2026.05.07</Text>
            <Text style={styles.aboutTagline}>Complete Medical Billing & Practice Management</Text>
          </View>
          <SectionCard title="Application">
            <SettingRow icon="info" label="Version" subtitle="1.0.0 (Build 2026.05.07)" />
            <SettingRow icon="update" label="Last Updated" subtitle="May 7, 2026" />
            <SettingRow icon="gavel" label="License" subtitle="Professional SaaS License" />
            <SettingRow icon="code" label="Platform" subtitle="React Native · Expo SDK 52" />
          </SectionCard>
          <SectionCard title="Support">
            <SettingRow icon="help" label="Help Center" subtitle="Documentation and tutorials" onPress={() => showAlert('Help', 'Visit help.medbillpro.com for docs.')} />
            <SettingRow icon="support-agent" label="Contact Support" subtitle="support@medbillpro.com" onPress={() => showAlert('Support', 'support@medbillpro.com\n(800) 555-BILL')} />
            <SettingRow icon="bug-report" label="Report a Bug" subtitle="Submit issue to our team" onPress={() => showAlert('Bug Report', 'Bug reports are sent to engineering.')} />
          </SectionCard>
          <SectionCard title="Legal">
            <SettingRow icon="policy" label="Privacy Policy" subtitle="HIPAA-compliant data practices" onPress={() => showAlert('Privacy', 'Full policy at medbillpro.com/privacy')} />
            <SettingRow icon="description" label="Terms of Service" subtitle="Last updated: January 2026" onPress={() => showAlert('Terms', 'Full terms at medbillpro.com/terms')} />
            <SettingRow icon="security" label="HIPAA Compliance Statement" subtitle="45 CFR Parts 160 and 164" onPress={() => showAlert('HIPAA', 'MedBillPro is fully HIPAA compliant.')} />
          </SectionCard>
          <Text style={styles.copyright}>© 2026 MedBillPro. All rights reserved.{'\n'}HIPAA Compliant · SOC 2 Type II Certified</Text>
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    );
  }

  return null;
}

function SubHeader({ title, onBack, onSave, rightAction }: { title: string; onBack: () => void; onSave?: () => void; rightAction?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[subStyles.header, { paddingTop: insets.top + Spacing.sm }]}>
      <Pressable onPress={onBack} hitSlop={8} style={subStyles.backBtn}>
        <MaterialIcons name="arrow-back" size={22} color="#fff" />
      </Pressable>
      <Text style={subStyles.title}>{title}</Text>
      {rightAction ? rightAction : onSave ? (
        <Pressable onPress={onSave} style={subStyles.saveBtn}>
          <Text style={subStyles.saveBtnText}>Save</Text>
        </Pressable>
      ) : (
        <View style={{ width: 48 }} />
      )}
    </View>
  );
}

function FormField({ label, value, onChangeText, keyboardType, autoCapitalize, maxLength }: {
  label: string; value: string; onChangeText: (v: string) => void;
  keyboardType?: any; autoCapitalize?: any; maxLength?: number;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={fieldStyles.input} value={value} onChangeText={onChangeText}
        keyboardType={keyboardType} autoCapitalize={autoCapitalize}
        maxLength={maxLength} placeholderTextColor={Colors.textMuted}
      />
    </View>
  );
}

function SaveButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={saveStyles.btn} onPress={onPress}>
      <MaterialIcons name="save" size={18} color="#fff" />
      <Text style={saveStyles.text}>Save Changes</Text>
    </Pressable>
  );
}

const subStyles = StyleSheet.create({
  header: {
    backgroundColor: Colors.navBg, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: { padding: 4, width: 40 },
  title: { fontSize: FontSize.lg, fontWeight: '700', color: '#fff', flex: 1, textAlign: 'center' },
  saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.sm, width: 60, alignItems: 'center' },
  saveBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },
});

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  label: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: FontSize.sm,
    color: Colors.textPrimary, backgroundColor: Colors.surfaceAlt,
  },
});

const saveStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 16, gap: 8, marginTop: 8, ...Shadow.md,
  },
  text: { fontSize: FontSize.base, fontWeight: '700', color: '#fff' },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.navBg, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  userBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  userBadgeText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.sm },

  profileCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md, ...Shadow.sm,
  },
  profileAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  profileAvatarText: { fontSize: FontSize.xl, fontWeight: '700', color: '#fff' },
  profileName: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  profileRole: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 1 },
  profileEmail: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  editProfileBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },

  groupLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 8, marginBottom: 4, paddingHorizontal: 4 },
  menuCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: 12 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.divider },
  menuRowPressed: { backgroundColor: Colors.primaryLight },
  menuIcon: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  menuSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.dangerLight, borderRadius: Radius.lg, paddingVertical: 16, gap: 8, marginTop: 8,
    borderWidth: 1, borderColor: Colors.danger + '40',
  },
  logoutText: { fontSize: FontSize.base, fontWeight: '700', color: Colors.danger },
  versionText: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 8 },

  sectionCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  sectionCardTitle: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: 8 },
  sectionCardBody: { borderTopWidth: 1, borderTopColor: Colors.divider },

  settingRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  settingRowPressed: { backgroundColor: Colors.primaryLight },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textPrimary },
  settingSubtitle: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },

  formRow: { flexDirection: 'row', gap: 8 },

  providerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.divider, paddingHorizontal: Spacing.md },
  providerDotSmall: { width: 10, height: 10, borderRadius: 5 },
  providerName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  providerSpec: { fontSize: FontSize.xs, color: Colors.textMuted },
  providerEditBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  addProviderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.divider },
  addProviderText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primary },

  kpiRow3: { flexDirection: 'row', gap: Spacing.sm },
  miniKpi: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.sm, alignItems: 'center', ...Shadow.sm },
  miniKpiVal: { fontSize: FontSize.xxl, fontWeight: '800' },
  miniKpiLabel: { fontSize: FontSize.xs, color: Colors.textMuted },

  roleRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.divider, paddingHorizontal: Spacing.md },
  roleChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, minWidth: 56, alignItems: 'center' },
  roleChipText: { fontSize: FontSize.xs, fontWeight: '700' },
  rolePerms: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },

  // Live users panel
  loadingWrap: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  loadingText: { fontSize: FontSize.sm, color: Colors.textMuted },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', gap: 8, ...Shadow.sm },
  emptyText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  emptySubText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },

  userCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  userCardTop: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  userAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  userAvatarText: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },
  userName2: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  userEmail: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  activeToggleWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full,
  },
  activeToggleLabel: { fontSize: FontSize.xs, fontWeight: '700' },

  roleSelector: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
  },
  roleSelectorLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted },
  roleOptions: { flexDirection: 'row', gap: 6 },
  roleOption: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceAlt,
  },
  roleOptionText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary },

  primaryActionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 16, gap: 8, marginTop: 4, ...Shadow.md,
  },
  primaryActionText: { fontSize: FontSize.base, fontWeight: '700', color: '#fff' },

  payerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider, paddingHorizontal: Spacing.md },
  payerIcon: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  payerName2: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  payerMeta2: { fontSize: FontSize.xs, color: Colors.textMuted },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  statusBadgeText: { fontSize: FontSize.xs, fontWeight: '600' },

  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.sm },
  statusBannerTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primaryDark },
  statusBannerSub: { fontSize: FontSize.xs, color: Colors.textMuted },

  logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.divider, paddingHorizontal: Spacing.md },
  logBatch: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  logMeta: { fontSize: FontSize.xs, color: Colors.textMuted },

  aboutHero: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', gap: 8, ...Shadow.sm },
  aboutIcon: { width: 80, height: 80, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', ...Shadow.md },
  aboutAppName: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  aboutVersion: { fontSize: FontSize.sm, color: Colors.textMuted },
  aboutTagline: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  copyright: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 20 },
});
