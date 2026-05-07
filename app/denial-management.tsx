import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';

interface DenialChecklist {
  step: string;
  done: boolean;
}

interface DenialCorrection {
  claimId: string;
  checklist: DenialChecklist[];
  notes: string;
  corrected: boolean;
}

const DENIAL_CHECKLISTS: Record<string, DenialChecklist[]> = {
  'CO-4': [
    { step: 'Review diagnosis code(s) for compatibility with procedure', done: false },
    { step: 'Confirm procedure was medically necessary for stated diagnosis', done: false },
    { step: 'Update ICD-10 code to accurately reflect the service', done: false },
    { step: 'Add supporting diagnosis codes if applicable', done: false },
    { step: 'Resubmit with corrected diagnosis code', done: false },
  ],
  'CO-11': [
    { step: 'Verify procedure code matches the documented diagnosis', done: false },
    { step: 'Review LCD/NCD coverage for the payer', done: false },
    { step: 'Obtain and attach medical necessity documentation', done: false },
    { step: 'Consider adding modifier -KX if Medicare', done: false },
    { step: 'Resubmit with documentation attached', done: false },
  ],
  'CO-18': [
    { step: 'Identify the original claim that was already paid', done: false },
    { step: 'Verify no duplicate exists in system', done: false },
    { step: 'Check if same service, same DOS, same provider', done: false },
    { step: 'If legitimate re-bill, include corrected claim indicator', done: false },
    { step: 'Contact payer if service was genuinely different', done: false },
  ],
  'CO-22': [
    { step: 'Identify the primary/coordination of benefits payer', done: false },
    { step: 'Obtain primary payer EOB', done: false },
    { step: 'Bill primary payer first and wait for EOB', done: false },
    { step: 'Submit with primary EOB as secondary claim', done: false },
    { step: 'Update patient insurance coordination in system', done: false },
  ],
  'CO-29': [
    { step: 'Verify date claim was originally submitted', done: false },
    { step: 'Check payer timely filing limit (usually 90-365 days)', done: false },
    { step: 'Gather proof of original timely submission', done: false },
    { step: 'Submit appeal with proof of timely filing', done: false },
    { step: 'If no proof, write off and update processes', done: false },
  ],
  'CO-45': [
    { step: 'Verify billed amount against contracted fee schedule', done: false },
    { step: 'Confirm contractual adjustment is correct', done: false },
    { step: 'Post contractual adjustment per contract terms', done: false },
    { step: 'Bill patient for any remaining copay/coinsurance', done: false },
    { step: 'No resubmission needed — post payment', done: false },
  ],
  'CO-97': [
    { step: 'Identify the inclusive service or bundled procedure', done: false },
    { step: 'Review CCI edits for the bundled code pair', done: false },
    { step: 'Determine if unbundling modifier applies (modifier 59 / XE/XP/XS/XU)', done: false },
    { step: 'Add appropriate modifier if services were distinct', done: false },
    { step: 'Resubmit with modifier or write off if bundled', done: false },
  ],
  'PR-1': [
    { step: 'Confirm patient deductible has not been met per EOB', done: false },
    { step: 'Calculate deductible amount accurately', done: false },
    { step: 'Generate patient statement for deductible amount', done: false },
    { step: 'Send statement to patient within 30 days', done: false },
    { step: 'Set up payment plan if balance is significant', done: false },
  ],
  'DEFAULT': [
    { step: 'Review the full denial reason from EOB/ERA', done: false },
    { step: 'Research payer-specific policy for this denial', done: false },
    { step: 'Determine if additional documentation is needed', done: false },
    { step: 'Correct the identified issue', done: false },
    { step: 'Resubmit or appeal within timely filing limit', done: false },
  ],
};

function extractDenialCode(denialReason?: string): string {
  if (!denialReason) return 'DEFAULT';
  const match = denialReason.match(/(CO|PR|OA)-\d+/);
  const code = match ? match[0] : 'DEFAULT';
  return DENIAL_CHECKLISTS[code] ? code : 'DEFAULT';
}

function getDenialCodeLabel(code: string): string {
  const labels: Record<string, string> = {
    'CO-4': 'Diagnosis-Procedure Inconsistency',
    'CO-11': 'Medical Necessity',
    'CO-18': 'Duplicate Claim',
    'CO-22': 'Coordination of Benefits',
    'CO-29': 'Timely Filing',
    'CO-45': 'Contractual Adjustment',
    'CO-97': 'Bundled/Inclusive Service',
    'PR-1': 'Patient Deductible',
    'DEFAULT': 'General Denial',
  };
  return labels[code] ?? code;
}

export default function DenialManagementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { claims, updateClaim } = useApp();
  const { showAlert } = useAlert();

  const deniedClaims = useMemo(() =>
    claims.filter(c => c.status === 'Denied'),
    [claims]
  );

  const [corrections, setCorrections] = useState<Record<string, DenialCorrection>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resubmitting, setResubmitting] = useState<string | null>(null);

  const getCorrection = (claimId: string, denialReason?: string): DenialCorrection => {
    if (corrections[claimId]) return corrections[claimId];
    const code = extractDenialCode(denialReason);
    return {
      claimId,
      checklist: DENIAL_CHECKLISTS[code]?.map(item => ({ ...item })) ?? [],
      notes: '',
      corrected: false,
    };
  };

  const toggleStep = (claimId: string, stepIdx: number, denialReason?: string) => {
    const current = getCorrection(claimId, denialReason);
    const newChecklist = current.checklist.map((item, i) =>
      i === stepIdx ? { ...item, done: !item.done } : item
    );
    setCorrections(prev => ({
      ...prev,
      [claimId]: { ...current, checklist: newChecklist },
    }));
  };

  const updateNotes = (claimId: string, notes: string, denialReason?: string) => {
    const current = getCorrection(claimId, denialReason);
    setCorrections(prev => ({
      ...prev,
      [claimId]: { ...current, notes },
    }));
  };

  const handleResubmit = async (claimId: string, denialReason?: string) => {
    const correction = getCorrection(claimId, denialReason);
    const doneCount = correction.checklist.filter(s => s.done).length;
    const total = correction.checklist.length;

    if (doneCount < Math.ceil(total / 2)) {
      showAlert(
        'Incomplete Checklist',
        `Please complete at least ${Math.ceil(total / 2)} of ${total} correction steps before resubmitting.`
      );
      return;
    }

    showAlert(
      'Resubmit Claim',
      `Mark claim as corrected and route back to billing queue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resubmit',
          onPress: async () => {
            setResubmitting(claimId);
            try {
              await updateClaim(claimId, {
                status: 'Pending',
                denialReason: undefined,
                submittedDate: new Date().toISOString().slice(0, 10),
              });
              setCorrections(prev => ({
                ...prev,
                [claimId]: { ...getCorrection(claimId, denialReason), corrected: true },
              }));
              setExpanded(null);
              showAlert('Resubmitted', 'Claim has been moved to Pending status for resubmission.');
            } finally {
              setResubmitting(null);
            }
          },
        },
      ]
    );
  };

  const handleWriteOff = (claimId: string) => {
    showAlert(
      'Write Off Claim',
      'Mark this claim as written off? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Write Off',
          style: 'destructive',
          onPress: async () => {
            await updateClaim(claimId, { status: 'Partial', notes: 'Written off after denial' });
            showAlert('Written Off', 'Claim has been written off.');
          },
        },
      ]
    );
  };

  const totalDeniedAmount = deniedClaims.reduce((s, c) => s + c.totalCharge, 0);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Denial Management</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Summary Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerStat}>
          <Text style={styles.bannerStatVal}>{deniedClaims.length}</Text>
          <Text style={styles.bannerStatLabel}>Denied Claims</Text>
        </View>
        <View style={styles.bannerDivider} />
        <View style={styles.bannerStat}>
          <Text style={[styles.bannerStatVal, { color: Colors.danger }]}>
            ${totalDeniedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Text>
          <Text style={styles.bannerStatLabel}>At Risk</Text>
        </View>
        <View style={styles.bannerDivider} />
        <View style={styles.bannerStat}>
          <Text style={[styles.bannerStatVal, { color: Colors.success }]}>
            {Object.values(corrections).filter(c => c.corrected).length}
          </Text>
          <Text style={styles.bannerStatLabel}>Corrected</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {deniedClaims.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="check-circle" size={64} color={Colors.success} />
            <Text style={styles.emptyTitle}>No Denied Claims</Text>
            <Text style={styles.emptySub}>All claims are processing or paid.</Text>
          </View>
        ) : (
          deniedClaims.map(claim => {
            const code = extractDenialCode(claim.denialReason);
            const correction = getCorrection(claim.id, claim.denialReason);
            const isOpen = expanded === claim.id;
            const doneCount = correction.checklist.filter(s => s.done).length;
            const progress = correction.checklist.length > 0
              ? doneCount / correction.checklist.length
              : 0;
            const isResubmitting = resubmitting === claim.id;

            return (
              <View key={claim.id} style={styles.denialCard}>
                {/* Card Top */}
                <View style={styles.cardHeader}>
                  <View style={styles.codeTag}>
                    <Text style={styles.codeTagText}>{code}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardPatient}>{claim.patientName}</Text>
                    <Text style={styles.cardNum}>{claim.claimNumber} · {claim.dos}</Text>
                    <Text style={styles.cardCodeLabel}>{getDenialCodeLabel(code)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.cardAmount}>${claim.totalCharge.toFixed(2)}</Text>
                    <Text style={styles.cardIns}>{claim.insuranceCompany}</Text>
                  </View>
                </View>

                {/* Denial Reason */}
                {claim.denialReason && (
                  <View style={styles.denialReasonRow}>
                    <MaterialIcons name="error-outline" size={14} color={Colors.danger} />
                    <Text style={styles.denialReasonText} numberOfLines={2}>{claim.denialReason}</Text>
                  </View>
                )}

                {/* Progress */}
                <View style={styles.progressRow}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
                  </View>
                  <Text style={styles.progressText}>{doneCount}/{correction.checklist.length} steps</Text>
                </View>

                {/* Expand Toggle */}
                <Pressable style={styles.expandBtn} onPress={() => setExpanded(isOpen ? null : claim.id)}>
                  <MaterialIcons name={isOpen ? 'expand-less' : 'checklist'} size={16} color={Colors.primary} />
                  <Text style={styles.expandBtnText}>
                    {isOpen ? 'Collapse' : 'View Correction Checklist'}
                  </Text>
                </Pressable>

                {/* Expanded Section */}
                {isOpen && (
                  <View style={styles.expandedSection}>
                    <Text style={styles.checklistTitle}>Correction Steps</Text>
                    {correction.checklist.map((step, i) => (
                      <Pressable
                        key={i}
                        style={styles.checkItem}
                        onPress={() => toggleStep(claim.id, i, claim.denialReason)}
                      >
                        <View style={[styles.checkbox, step.done && styles.checkboxDone]}>
                          {step.done && <MaterialIcons name="check" size={14} color="#fff" />}
                        </View>
                        <Text style={[styles.checkItemText, step.done && styles.checkItemTextDone]}>
                          {step.step}
                        </Text>
                      </Pressable>
                    ))}

                    {/* Notes */}
                    <Text style={styles.notesLabel}>Correction Notes</Text>
                    <TextInput
                      style={styles.notesInput}
                      value={correction.notes}
                      onChangeText={v => updateNotes(claim.id, v, claim.denialReason)}
                      placeholder="Document corrective actions taken, reference numbers, contacts..."
                      placeholderTextColor={Colors.textMuted}
                      multiline
                      textAlignVertical="top"
                    />

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                      <Pressable
                        style={[styles.writeOffBtn]}
                        onPress={() => handleWriteOff(claim.id)}
                      >
                        <MaterialIcons name="delete-sweep" size={16} color={Colors.danger} />
                        <Text style={styles.writeOffText}>Write Off</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.resubmitBtn, isResubmitting && { opacity: 0.6 }]}
                        onPress={() => handleResubmit(claim.id, claim.denialReason)}
                        disabled={isResubmitting}
                      >
                        {isResubmitting ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <MaterialIcons name="send" size={16} color="#fff" />
                            <Text style={styles.resubmitText}>Resubmit to Billing Queue</Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 32 }} />
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

  banner: {
    backgroundColor: Colors.navBg, flexDirection: 'row', paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md, alignItems: 'center',
  },
  bannerStat: { flex: 1, alignItems: 'center' },
  bannerStatVal: { fontSize: FontSize.xxl, fontWeight: '800', color: '#fff' },
  bannerStatLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  bannerDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)' },

  scroll: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.sm },

  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  emptySub: { fontSize: FontSize.sm, color: Colors.textMuted },

  denialCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden',
    borderLeftWidth: 4, borderLeftColor: Colors.danger, ...Shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: Spacing.md,
  },
  codeTag: {
    backgroundColor: Colors.dangerLight, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.sm, alignSelf: 'flex-start',
  },
  codeTagText: { fontSize: FontSize.xs, fontWeight: '800', color: Colors.danger },
  cardPatient: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  cardNum: { fontSize: FontSize.xs, color: Colors.primary, marginTop: 1 },
  cardCodeLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  cardAmount: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  cardIns: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  denialReasonRow: {
    flexDirection: 'row', gap: 6, alignItems: 'flex-start',
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    backgroundColor: Colors.dangerLight, padding: Spacing.sm, borderRadius: Radius.sm,
  },
  denialReasonText: { flex: 1, fontSize: FontSize.xs, color: Colors.danger, lineHeight: 18 },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  progressTrack: { flex: 1, height: 6, backgroundColor: Colors.divider, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: Colors.success, borderRadius: 3 },
  progressText: { fontSize: FontSize.xs, color: Colors.textMuted, minWidth: 52 },

  expandBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, padding: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  expandBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primary },

  expandedSection: { padding: Spacing.md, gap: 10, borderTopWidth: 1, borderTopColor: Colors.divider },

  checklistTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  checkItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center', marginTop: 1, flexShrink: 0,
  },
  checkboxDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  checkItemText: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 22 },
  checkItemTextDone: { textDecorationLine: 'line-through', color: Colors.textMuted },

  notesLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  notesInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    padding: Spacing.sm, minHeight: 80, fontSize: FontSize.sm, color: Colors.textPrimary,
    backgroundColor: Colors.surfaceAlt,
  },

  actionRow: { flexDirection: 'row', gap: 10 },
  writeOffBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.dangerLight, borderRadius: Radius.md,
    paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: Colors.danger + '40',
  },
  writeOffText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.danger },
  resubmitBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 12, gap: 6, ...Shadow.sm,
  },
  resubmitText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },
});
