import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import {
  saveEligibilityCheck,
  fetchEligibilityHistory,
  EligibilityResult,
} from '@/services/supabaseService';

function simulateEligibility(patient: ReturnType<typeof useApp>['patients'][0]): Omit<EligibilityResult, 'id'> {
  const ins = patient.primaryInsurance;
  const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const deductibleMet = random(0, ins.deductible);
  const oop = ins.deductible * 3;
  const oopMet = deductibleMet + random(0, 200);
  const isInactive = ins.eligibilityStatus === 'Inactive';

  return {
    patientId: patient.id,
    patientName: `${patient.firstName} ${patient.lastName}`,
    insuranceCompany: ins.company,
    memberId: ins.memberId,
    checkDate: new Date().toISOString().slice(0, 10),
    eligibilityStatus: isInactive ? 'Inactive' : 'Active',
    planType: ins.planType,
    deductible: ins.deductible,
    deductibleMet,
    copay: ins.copay,
    outOfPocketMax: oop,
    outOfPocketMet: oopMet,
    coverageStart: `${new Date().getFullYear()}-01-01`,
    coverageEnd: `${new Date().getFullYear()}-12-31`,
    inNetwork: !isInactive,
    coinsurance: 20,
  };
}

export default function EligibilityScreen() {
  const { patientId } = useLocalSearchParams<{ patientId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { patients } = useApp();
  const { showAlert } = useAlert();

  const [selectedPatientId, setSelectedPatientId] = useState(patientId ?? '');
  const [showPatientPicker, setShowPatientPicker] = useState(!patientId);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [history, setHistory] = useState<EligibilityResult[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  useEffect(() => {
    if (selectedPatientId) loadHistory(selectedPatientId);
  }, [selectedPatientId]);

  const loadHistory = async (pid: string) => {
    setHistoryLoading(true);
    try {
      const data = await fetchEligibilityHistory(pid);
      setHistory(data);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCheck = async () => {
    if (!selectedPatient) {
      showAlert('Select Patient', 'Please select a patient first.');
      return;
    }
    setChecking(true);
    setResult(null);
    try {
      // Simulate API delay
      await new Promise(r => setTimeout(r, 1800));
      const simulated = simulateEligibility(selectedPatient);
      const saved = await saveEligibilityCheck(simulated);
      const displayed = saved ?? ({ ...simulated, id: 'local' } as EligibilityResult);
      setResult(displayed);
      setHistory(prev => [displayed, ...prev]);
    } catch (_) {
      showAlert('Error', 'Eligibility check failed. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const StatusIcon = ({ active }: { active: boolean }) => (
    <MaterialIcons
      name={active ? 'check-circle' : 'cancel'}
      size={18}
      color={active ? Colors.success : Colors.danger}
    />
  );

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Eligibility Verification</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Patient Selector */}
        <Text style={styles.sectionTitle}>Patient</Text>
        <Pressable
          style={styles.patientSelector}
          onPress={() => setShowPatientPicker(v => !v)}
        >
          <MaterialIcons name="person" size={20} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            {selectedPatient ? (
              <>
                <Text style={styles.patSelName}>
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </Text>
                <Text style={styles.patSelSub}>
                  {selectedPatient.primaryInsurance.company} · {selectedPatient.primaryInsurance.memberId}
                </Text>
              </>
            ) : (
              <Text style={styles.patSelPlaceholder}>Select a patient…</Text>
            )}
          </View>
          <MaterialIcons
            name={showPatientPicker ? 'expand-less' : 'expand-more'}
            size={22}
            color={Colors.textMuted}
          />
        </Pressable>

        {showPatientPicker && (
          <View style={styles.patientList}>
            {patients
              .filter(p => p.status === 'Active')
              .map(p => (
                <Pressable
                  key={p.id}
                  style={[
                    styles.patientOption,
                    selectedPatientId === p.id && styles.patientOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedPatientId(p.id);
                    setShowPatientPicker(false);
                    setResult(null);
                  }}
                >
                  <View style={styles.patOptionAvatar}>
                    <Text style={styles.patOptionAvatarText}>
                      {p.firstName[0]}
                      {p.lastName[0]}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patOptionName}>
                      {p.firstName} {p.lastName}
                    </Text>
                    <Text style={styles.patOptionIns}>{p.primaryInsurance.company}</Text>
                  </View>
                  <View
                    style={[
                      styles.eligBadge,
                      {
                        backgroundColor:
                          p.primaryInsurance.eligibilityStatus === 'Verified'
                            ? Colors.successLight
                            : p.primaryInsurance.eligibilityStatus === 'Inactive'
                            ? Colors.dangerLight
                            : Colors.warningLight,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.eligBadgeText,
                        {
                          color:
                            p.primaryInsurance.eligibilityStatus === 'Verified'
                              ? Colors.success
                              : p.primaryInsurance.eligibilityStatus === 'Inactive'
                              ? Colors.danger
                              : Colors.warning,
                        },
                      ]}
                    >
                      {p.primaryInsurance.eligibilityStatus}
                    </Text>
                  </View>
                </Pressable>
              ))}
          </View>
        )}

        {/* Insurance Preview */}
        {selectedPatient && !result && (
          <View style={styles.insuranceCard}>
            <View style={styles.insHeader}>
              <MaterialIcons name="health-and-safety" size={20} color={Colors.primary} />
              <Text style={styles.insTitle}>Primary Insurance</Text>
            </View>
            {[
              { label: 'Company', value: selectedPatient.primaryInsurance.company },
              { label: 'Member ID', value: selectedPatient.primaryInsurance.memberId },
              { label: 'Group #', value: selectedPatient.primaryInsurance.groupNumber },
              { label: 'Plan Type', value: selectedPatient.primaryInsurance.planType },
              { label: 'Copay', value: `$${selectedPatient.primaryInsurance.copay}` },
              {
                label: 'Deductible',
                value: `$${selectedPatient.primaryInsurance.deductible.toLocaleString()}`,
              },
            ].map(row => (
              <View key={row.label} style={styles.insRow}>
                <Text style={styles.insLabel}>{row.label}</Text>
                <Text style={styles.insValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Check Button */}
        {selectedPatient && (
          <Pressable
            style={[styles.checkBtn, checking && { opacity: 0.7 }]}
            onPress={handleCheck}
            disabled={checking}
          >
            {checking ? (
              <View style={styles.checkingRow}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.checkBtnText}>Checking eligibility…</Text>
              </View>
            ) : (
              <>
                <MaterialIcons name="verified" size={20} color="#fff" />
                <Text style={styles.checkBtnText}>Run Eligibility Check</Text>
              </>
            )}
          </Pressable>
        )}

        {/* Result Card */}
        {result && (
          <View style={styles.resultCard}>
            {/* Status Header */}
            <View
              style={[
                styles.resultHeader,
                {
                  backgroundColor:
                    result.eligibilityStatus === 'Active' ? Colors.success : Colors.danger,
                },
              ]}
            >
              <MaterialIcons
                name={result.eligibilityStatus === 'Active' ? 'verified-user' : 'gpp-bad'}
                size={28}
                color="#fff"
              />
              <View>
                <Text style={styles.resultStatusLabel}>Eligibility Status</Text>
                <Text style={styles.resultStatusValue}>{result.eligibilityStatus}</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.resultCheckDate}>Checked {result.checkDate}</Text>
                <Text style={styles.resultPlanType}>{result.planType}</Text>
              </View>
            </View>

            {/* Coverage Dates */}
            <View style={styles.coverageDates}>
              <View style={styles.coverageDateItem}>
                <Text style={styles.coverageDateLabel}>Coverage Start</Text>
                <Text style={styles.coverageDateValue}>{result.coverageStart}</Text>
              </View>
              <View style={styles.coverageDateDivider} />
              <View style={styles.coverageDateItem}>
                <Text style={styles.coverageDateLabel}>Coverage End</Text>
                <Text style={styles.coverageDateValue}>{result.coverageEnd}</Text>
              </View>
              <View style={styles.coverageDateDivider} />
              <View style={styles.coverageDateItem}>
                <Text style={styles.coverageDateLabel}>In-Network</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <StatusIcon active={result.inNetwork} />
                  <Text
                    style={[
                      styles.coverageDateValue,
                      { color: result.inNetwork ? Colors.success : Colors.danger },
                    ]}
                  >
                    {result.inNetwork ? 'Yes' : 'No'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Benefit Details */}
            <View style={styles.benefitGrid}>
              {/* Deductible */}
              <View style={styles.benefitCard}>
                <Text style={styles.benefitLabel}>Annual Deductible</Text>
                <Text style={styles.benefitTotal}>${result.deductible.toLocaleString()}</Text>
                <View style={styles.benefitBarTrack}>
                  <View
                    style={[
                      styles.benefitBarFill,
                      {
                        width: `${Math.min((result.deductibleMet / result.deductible) * 100, 100)}%` as any,
                        backgroundColor: Colors.primary,
                      },
                    ]}
                  />
                </View>
                <View style={styles.benefitSubRow}>
                  <Text style={styles.benefitSub}>
                    Met:{' '}
                    <Text style={{ color: Colors.primary, fontWeight: '700' }}>
                      ${result.deductibleMet.toLocaleString()}
                    </Text>
                  </Text>
                  <Text style={styles.benefitSub}>
                    Rem:{' '}
                    <Text style={{ color: Colors.success, fontWeight: '700' }}>
                      ${(result.deductible - result.deductibleMet).toLocaleString()}
                    </Text>
                  </Text>
                </View>
              </View>

              {/* OOP Max */}
              <View style={styles.benefitCard}>
                <Text style={styles.benefitLabel}>Out-of-Pocket Max</Text>
                <Text style={styles.benefitTotal}>${result.outOfPocketMax.toLocaleString()}</Text>
                <View style={styles.benefitBarTrack}>
                  <View
                    style={[
                      styles.benefitBarFill,
                      {
                        width: `${Math.min((result.outOfPocketMet / result.outOfPocketMax) * 100, 100)}%` as any,
                        backgroundColor: Colors.info,
                      },
                    ]}
                  />
                </View>
                <View style={styles.benefitSubRow}>
                  <Text style={styles.benefitSub}>
                    Met:{' '}
                    <Text style={{ color: Colors.info, fontWeight: '700' }}>
                      ${result.outOfPocketMet.toLocaleString()}
                    </Text>
                  </Text>
                  <Text style={styles.benefitSub}>
                    Rem:{' '}
                    <Text style={{ color: Colors.success, fontWeight: '700' }}>
                      $
                      {(result.outOfPocketMax - result.outOfPocketMet).toLocaleString()}
                    </Text>
                  </Text>
                </View>
              </View>
            </View>

            {/* Copay & Coinsurance */}
            <View style={styles.copayRow}>
              <View style={styles.copayCell}>
                <Text style={styles.copayLabel}>Copay</Text>
                <Text style={styles.copayValue}>${result.copay}</Text>
                <Text style={styles.copayNote}>per visit</Text>
              </View>
              <View style={styles.copayDivider} />
              <View style={styles.copayCell}>
                <Text style={styles.copayLabel}>Coinsurance</Text>
                <Text style={styles.copayValue}>{result.coinsurance}%</Text>
                <Text style={styles.copayNote}>after deductible</Text>
              </View>
              <View style={styles.copayDivider} />
              <View style={styles.copayCell}>
                <Text style={styles.copayLabel}>Member ID</Text>
                <Text style={[styles.copayValue, { fontSize: FontSize.sm }]}>{result.memberId}</Text>
                <Text style={styles.copayNote}>{result.insuranceCompany}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Eligibility History */}
        {history.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Check History</Text>
            {history.slice(0, 5).map(h => (
              <View key={h.id} style={styles.historyCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyDate}>{h.checkDate}</Text>
                  <Text style={styles.historyIns}>{h.insuranceCompany}</Text>
                </View>
                <View style={styles.historyRight}>
                  <View
                    style={[
                      styles.histStatusBadge,
                      {
                        backgroundColor:
                          h.eligibilityStatus === 'Active' ? Colors.successLight : Colors.dangerLight,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.histStatusText,
                        { color: h.eligibilityStatus === 'Active' ? Colors.success : Colors.danger },
                      ]}
                    >
                      {h.eligibilityStatus}
                    </Text>
                  </View>
                  <Text style={styles.historyMeta}>
                    Ded: ${h.deductibleMet.toFixed(0)} / ${h.deductible.toFixed(0)}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.navBg, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700', color: '#fff' },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginTop: 4 },

  patientSelector: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.primary + '50', ...Shadow.sm,
  },
  patSelName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  patSelSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  patSelPlaceholder: { fontSize: FontSize.sm, color: Colors.textMuted },

  patientList: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border, ...Shadow.md,
  },
  patientOption: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  patientOptionActive: { backgroundColor: Colors.primaryLight },
  patOptionAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  patOptionAvatarText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },
  patOptionName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  patOptionIns: { fontSize: FontSize.xs, color: Colors.textMuted },
  eligBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  eligBadgeText: { fontSize: 10, fontWeight: '700' },

  insuranceCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
    gap: 8, ...Shadow.sm,
  },
  insHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  insTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  insRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  insLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  insValue: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textPrimary },

  checkBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 18, gap: 10,
    ...Shadow.lg,
  },
  checkingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkBtnText: { fontSize: FontSize.lg, fontWeight: '800', color: '#fff' },

  resultCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, overflow: 'hidden',
    ...Shadow.lg,
  },
  resultHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: Spacing.md,
  },
  resultStatusLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)' },
  resultStatusValue: { fontSize: FontSize.xl, fontWeight: '800', color: '#fff' },
  resultCheckDate: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)' },
  resultPlanType: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },

  coverageDates: {
    flexDirection: 'row', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  coverageDateItem: { flex: 1, alignItems: 'center' },
  coverageDateLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  coverageDateValue: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },
  coverageDateDivider: { width: 1, backgroundColor: Colors.divider, marginHorizontal: 8 },

  benefitGrid: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md },
  benefitCard: {
    flex: 1, backgroundColor: Colors.background, borderRadius: Radius.lg, padding: Spacing.sm, gap: 4,
  },
  benefitLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600' },
  benefitTotal: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  benefitBarTrack: { height: 6, backgroundColor: Colors.divider, borderRadius: 3, overflow: 'hidden', marginVertical: 2 },
  benefitBarFill: { height: 6, borderRadius: 3 },
  benefitSubRow: { flexDirection: 'row', justifyContent: 'space-between' },
  benefitSub: { fontSize: 10, color: Colors.textMuted },

  copayRow: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  copayCell: { flex: 1, alignItems: 'center', padding: Spacing.md, gap: 2 },
  copayDivider: { width: 1, backgroundColor: Colors.divider },
  copayLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  copayValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  copayNote: { fontSize: 10, color: Colors.textMuted },

  historyCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.md, gap: 10, ...Shadow.sm,
  },
  historyDate: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  historyIns: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  historyRight: { alignItems: 'flex-end', gap: 4 },
  histStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  histStatusText: { fontSize: FontSize.xs, fontWeight: '700' },
  historyMeta: { fontSize: FontSize.xs, color: Colors.textMuted },
});
