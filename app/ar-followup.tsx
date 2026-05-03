import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import {
  fetchARFollowups,
  patchARFollowup,
  upsertARFollowup,
  ARFollowup,
  ContactEntry,
} from '@/services/supabaseService';
import { AR_AGING } from '@/constants/mockData';

const AGING_BUCKETS = ['All', '0-30', '31-60', '61-90', '91-120', '120+'];
const APPEAL_STATUSES = ['Not Appealed', 'Appeal Filed', 'Appeal Pending', 'Appeal Won', 'Appeal Denied'];
const FOLLOWUP_STATUSES = ['Open', 'Resolved', 'In Appeal', 'Written Off'] as const;

function getAgingBucket(days: number): string {
  if (days <= 30) return '0-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  if (days <= 120) return '91-120';
  return '120+';
}

function getBucketColor(bucket: string) {
  if (bucket === '0-30') return Colors.success;
  if (bucket === '31-60') return Colors.info;
  if (bucket === '61-90') return Colors.warning;
  return Colors.danger;
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / 86400000));
}

export default function ARFollowupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { claims, currentUser } = useApp();
  const { showAlert } = useAlert();

  const [followups, setFollowups] = useState<ARFollowup[]>([]);
  const [loading, setLoading] = useState(true);
  const [bucketFilter, setBucketFilter] = useState('All');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  // Per-card edit state
  const [noteInput, setNoteInput] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [appealStatus, setAppealStatus] = useState('Not Appealed');
  const [payerRep, setPayerRep] = useState('');
  const [cardStatus, setCardStatus] = useState<ARFollowup['status']>('Open');

  // Build follow-up records from unpaid/denied claims
  const arClaims = useMemo(() => {
    return claims
      .filter(c => ['Submitted', 'Denied', 'Partial', 'Pending'].includes(c.status))
      .map(c => {
        const refDate = c.submittedDate ?? c.dos ?? new Date().toISOString().slice(0, 10);
        const days = daysSince(refDate);
        return {
          claim: c,
          days,
          bucket: getAgingBucket(days),
        };
      })
      .sort((a, b) => b.days - a.days);
  }, [claims]);

  useEffect(() => {
    loadFollowups();
  }, []);

  const loadFollowups = async () => {
    setLoading(true);
    try {
      const data = await fetchARFollowups();
      setFollowups(data);
    } finally {
      setLoading(false);
    }
  };

  const getFollowup = (claimId: string) =>
    followups.find(f => f.claimId === claimId);

  const handleExpand = (claimId: string) => {
    if (expanded === claimId) {
      setExpanded(null);
      return;
    }
    const existing = getFollowup(claimId);
    setFollowUpDate(existing?.followUpDate ?? '');
    setAppealStatus(existing?.appealStatus ?? 'Not Appealed');
    setPayerRep(existing?.payerRep ?? '');
    setCardStatus(existing?.status ?? 'Open');
    setNoteInput('');
    setExpanded(claimId);
  };

  const handleSave = async (claimId: string) => {
    const c = claims.find(cl => cl.id === claimId);
    if (!c) return;

    const existing = getFollowup(claimId);
    const days = daysSince(c.submittedDate ?? c.dos ?? '');
    const bucket = getAgingBucket(days);

    const newEntry: ContactEntry | null = noteInput.trim()
      ? {
          date: new Date().toISOString().slice(0, 10),
          notes: noteInput.trim(),
          addedBy: currentUser.name,
        }
      : null;

    const updatedLog = [
      ...(existing?.contactLog ?? []),
      ...(newEntry ? [newEntry] : []),
    ];

    setSaving(claimId);
    try {
      const saved = await upsertARFollowup({
        id: existing?.id,
        claimId,
        claimNumber: c.claimNumber,
        patientName: c.patientName,
        insuranceCompany: c.insuranceCompany,
        amount: c.totalCharge - c.paidAmount,
        agingBucket: bucket,
        daysOutstanding: days,
        status: cardStatus,
        appealStatus,
        followUpDate,
        payerRep,
        contactLog: updatedLog,
      });
      if (saved) {
        setFollowups(prev => {
          const idx = prev.findIndex(f => f.claimId === claimId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next;
          }
          return [...prev, saved];
        });
        setNoteInput('');
        showAlert('Saved', 'Follow-up notes saved successfully.');
      }
    } finally {
      setSaving(null);
    }
  };

  const filtered = useMemo(() => {
    if (bucketFilter === 'All') return arClaims;
    return arClaims.filter(item => item.bucket === bucketFilter);
  }, [arClaims, bucketFilter]);

  const totalAR = arClaims.reduce(
    (s, item) => s + (item.claim.totalCharge - item.claim.paidAmount),
    0
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>AR Follow-up</Text>
        <Pressable onPress={loadFollowups} hitSlop={8}>
          <MaterialIcons name="refresh" size={22} color="rgba(255,255,255,0.6)" />
        </Pressable>
      </View>

      {/* Aging Summary Banner */}
      <View style={styles.banner}>
        <View>
          <Text style={styles.bannerLabel}>Total Outstanding AR</Text>
          <Text style={styles.bannerAmount}>${totalAR.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.bannerLabel}>{arClaims.length} open claims</Text>
          <Text style={[styles.bannerAmount, { fontSize: FontSize.lg, color: Colors.danger }]}>
            {arClaims.filter(i => i.days > 90).length} over 90 days
          </Text>
        </View>
      </View>

      {/* Bucket Filters */}
      <View style={styles.bucketBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bucketContent}
        >
          {AGING_BUCKETS.map(b => (
            <Pressable
              key={b}
              onPress={() => setBucketFilter(b)}
              style={[styles.bucketChip, bucketFilter === b && { backgroundColor: getBucketColor(b) }]}
            >
              <Text
                style={[
                  styles.bucketText,
                  bucketFilter === b && { color: '#fff' },
                ]}
              >
                {b === 'All' ? 'All' : `${b} days`}
              </Text>
              {b !== 'All' && (
                <Text style={[styles.bucketCount, bucketFilter === b && { color: 'rgba(255,255,255,0.8)' }]}>
                  {arClaims.filter(i => i.bucket === b).length}
                </Text>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>Loading AR data…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="check-circle" size={48} color={Colors.success} />
            <Text style={styles.emptyTitle}>No Open Claims</Text>
            <Text style={styles.emptySub}>All claims in this bucket are resolved.</Text>
          </View>
        ) : (
          filtered.map(({ claim, days, bucket }) => {
            const followup = getFollowup(claim.id);
            const isOpen = expanded === claim.id;
            const bucketColor = getBucketColor(bucket);
            const outstanding = claim.totalCharge - claim.paidAmount;

            return (
              <View key={claim.id} style={styles.claimCard}>
                {/* Card Header */}
                <View style={[styles.cardAgingBar, { backgroundColor: bucketColor }]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardPatient}>{claim.patientName}</Text>
                      <Text style={styles.cardClaim}>{claim.claimNumber}</Text>
                      <Text style={styles.cardInsurance}>{claim.insuranceCompany}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.cardAmount}>${outstanding.toFixed(2)}</Text>
                      <View style={[styles.daysBadge, { backgroundColor: bucketColor + '20' }]}>
                        <Text style={[styles.daysText, { color: bucketColor }]}>{days} days</Text>
                      </View>
                      <Text style={styles.cardDos}>DOS: {claim.dos}</Text>
                    </View>
                  </View>

                  {/* Status chips */}
                  <View style={styles.chipRow}>
                    <View style={[styles.statusChip, { backgroundColor: claim.status === 'Denied' ? Colors.dangerLight : Colors.warningLight }]}>
                      <Text style={[styles.statusChipText, { color: claim.status === 'Denied' ? Colors.danger : Colors.warning }]}>
                        {claim.status}
                      </Text>
                    </View>
                    {followup && (
                      <View style={[styles.statusChip, { backgroundColor: Colors.primaryLight }]}>
                        <Text style={[styles.statusChipText, { color: Colors.primary }]}>
                          {followup.appealStatus}
                        </Text>
                      </View>
                    )}
                    {followup?.followUpDate && (
                      <View style={styles.statusChip}>
                        <MaterialIcons name="schedule" size={10} color={Colors.textMuted} />
                        <Text style={styles.statusChipText}>
                          {followup.followUpDate}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Expand Toggle */}
                  <Pressable
                    style={styles.expandBtn}
                    onPress={() => handleExpand(claim.id)}
                  >
                    <MaterialIcons
                      name={isOpen ? 'expand-less' : 'add-comment'}
                      size={16}
                      color={Colors.primary}
                    />
                    <Text style={styles.expandText}>
                      {isOpen ? 'Collapse' : 'Add Notes / Follow-up Action'}
                    </Text>
                  </Pressable>

                  {/* Expanded Actions */}
                  {isOpen && (
                    <View style={styles.expandedSection}>
                      {/* Status */}
                      <Text style={styles.expandLabel}>Status</Text>
                      <View style={styles.statusRow}>
                        {FOLLOWUP_STATUSES.map(s => (
                          <Pressable
                            key={s}
                            onPress={() => setCardStatus(s)}
                            style={[
                              styles.statusOption,
                              cardStatus === s && { backgroundColor: Colors.primary, borderColor: Colors.primary },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusOptionText,
                                cardStatus === s && { color: '#fff' },
                              ]}
                            >
                              {s}
                            </Text>
                          </Pressable>
                        ))}
                      </View>

                      {/* Appeal Status */}
                      <Text style={styles.expandLabel}>Appeal Status</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {APPEAL_STATUSES.map(s => (
                            <Pressable
                              key={s}
                              onPress={() => setAppealStatus(s)}
                              style={[
                                styles.appealChip,
                                appealStatus === s && { backgroundColor: Colors.info, borderColor: Colors.info },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.appealChipText,
                                  appealStatus === s && { color: '#fff' },
                                ]}
                              >
                                {s}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </ScrollView>

                      {/* Follow-up Date & Payer Rep */}
                      <View style={styles.twoCol}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.expandLabel}>Follow-up Date</Text>
                          <TextInput
                            style={styles.expandInput}
                            value={followUpDate}
                            onChangeText={setFollowUpDate}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={Colors.textMuted}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.expandLabel}>Payer Rep</Text>
                          <TextInput
                            style={styles.expandInput}
                            value={payerRep}
                            onChangeText={setPayerRep}
                            placeholder="Rep name / ID"
                            placeholderTextColor={Colors.textMuted}
                          />
                        </View>
                      </View>

                      {/* Call Notes */}
                      <Text style={styles.expandLabel}>Call Notes</Text>
                      <TextInput
                        style={styles.notesInput}
                        value={noteInput}
                        onChangeText={setNoteInput}
                        placeholder="Enter call notes, action taken, reference #…"
                        placeholderTextColor={Colors.textMuted}
                        multiline
                        textAlignVertical="top"
                      />

                      {/* Save */}
                      <Pressable
                        style={[styles.saveBtn, saving === claim.id && { opacity: 0.6 }]}
                        onPress={() => handleSave(claim.id)}
                        disabled={saving === claim.id}
                      >
                        {saving === claim.id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <MaterialIcons name="save" size={16} color="#fff" />
                            <Text style={styles.saveBtnText}>Save Follow-up</Text>
                          </>
                        )}
                      </Pressable>

                      {/* Contact Log */}
                      {(followup?.contactLog?.length ?? 0) > 0 && (
                        <View style={styles.logSection}>
                          <Text style={styles.logTitle}>Contact History</Text>
                          {[...(followup?.contactLog ?? [])].reverse().map((entry, i) => (
                            <View key={i} style={styles.logEntry}>
                              <View style={styles.logDot} />
                              <View style={{ flex: 1 }}>
                                <View style={styles.logMeta}>
                                  <Text style={styles.logDate}>{entry.date}</Text>
                                  {entry.addedBy ? (
                                    <Text style={styles.logBy}>· {entry.addedBy}</Text>
                                  ) : null}
                                </View>
                                <Text style={styles.logNotes}>{entry.notes}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    backgroundColor: Colors.navBg, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
  },
  bannerLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.5)' },
  bannerAmount: { fontSize: FontSize.xxl, fontWeight: '800', color: '#fff' },
  bucketBar: { backgroundColor: Colors.navBg },
  bucketContent: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: 8 },
  bucketChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bucketText: { fontSize: FontSize.xs, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  bucketCount: {
    fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 8,
  },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.sm },
  loadingWrap: { alignItems: 'center', paddingTop: 60, gap: 8 },
  loadingText: { color: Colors.textMuted, fontSize: FontSize.sm },
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySub: { fontSize: FontSize.sm, color: Colors.textMuted },

  claimCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden',
    flexDirection: 'row', ...Shadow.sm,
  },
  cardAgingBar: { width: 4 },
  cardBody: { flex: 1, padding: Spacing.md, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardPatient: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  cardClaim: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600', marginTop: 2 },
  cardInsurance: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  cardAmount: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  daysBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, marginTop: 3 },
  daysText: { fontSize: FontSize.xs, fontWeight: '700' },
  cardDos: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },

  chipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.surfaceAlt, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
  },
  statusChipText: { fontSize: 10, fontWeight: '600', color: Colors.textMuted },

  expandBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6,
  },
  expandText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primary },

  expandedSection: { gap: 10, paddingTop: 4, borderTopWidth: 1, borderTopColor: Colors.divider },
  expandLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusOption: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceAlt,
  },
  statusOptionText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary },
  appealChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceAlt,
  },
  appealChipText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary },
  twoCol: { flexDirection: 'row', gap: 10 },
  expandInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: 10, paddingVertical: 10, fontSize: FontSize.sm,
    color: Colors.textPrimary, backgroundColor: Colors.surfaceAlt,
  },
  notesInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    padding: 10, minHeight: 80, fontSize: FontSize.sm, color: Colors.textPrimary,
    backgroundColor: Colors.surfaceAlt,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 12, gap: 6,
  },
  saveBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },
  logSection: { gap: 8 },
  logTitle: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  logEntry: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  logDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 5,
  },
  logMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  logDate: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary },
  logBy: { fontSize: FontSize.xs, color: Colors.textMuted },
  logNotes: { fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 20 },
});
