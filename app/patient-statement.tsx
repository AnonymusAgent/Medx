import React, { useState } from 'react';
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
import { getSupabaseClient } from '@/template';

export default function PatientStatementScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { patients, claims, currentUser } = useApp();
  const { showAlert } = useAlert();
  const [sending, setSending] = useState(false);

  const patient = patients.find(p => p.id === patientId);
  const patientClaims = claims.filter(c => c.patientId === patientId);

  // Claims with patient balance
  const unpaidClaims = patientClaims.filter(c => c.patientBalance > 0);
  const paidClaims = patientClaims.filter(c => c.patientBalance === 0 && c.status === 'Paid');

  const totalOutstanding = unpaidClaims.reduce((s, c) => s + c.patientBalance, 0);
  const totalPaid = paidClaims.reduce((s, c) => s + c.paidAmount, 0);
  const totalCharged = patientClaims.reduce((s, c) => s + c.totalCharge, 0);

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const handleSendStatement = async (method: 'Email' | 'Mail' | 'Print') => {
    if (!patient) return;
    setSending(true);
    try {
      const db = getSupabaseClient();
      await db.from('statement_logs').insert({
        patient_id: patient.id,
        patient_name: `${patient.firstName} ${patient.lastName}`,
        amount_due: totalOutstanding,
        sent_by: currentUser.name,
        method,
        sent_at: new Date().toISOString(),
      });
      showAlert(
        'Statement Sent',
        method === 'Print'
          ? 'Statement prepared for printing.'
          : `Statement sent via ${method} to ${method === 'Email' ? patient.email : patient.address}.`,
        [{ text: 'OK' }]
      );
    } catch (_) {
      showAlert('Error', 'Failed to log statement. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!patient) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={{ padding: 16 }}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={{ color: Colors.textPrimary, padding: 20 }}>Patient not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Patient Statement</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Statement Header Card */}
        <View style={styles.statementHeader}>
          <View style={styles.practiceRow}>
            <MaterialIcons name="local-hospital" size={20} color={Colors.primary} />
            <View>
              <Text style={styles.practiceName}>Sunrise Medical Group</Text>
              <Text style={styles.practiceAddr}>500 Medical Center Blvd · Houston, TX 77001</Text>
            </View>
          </View>
          <View style={styles.headerDivider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Statement Date</Text>
            <Text style={styles.statValue}>{today}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Account #</Text>
            <Text style={styles.statValue}>{patient.id.toUpperCase()}</Text>
          </View>
        </View>

        {/* Patient Info */}
        <View style={styles.patientCard}>
          <View style={styles.patientAvatar}>
            <Text style={styles.patientAvatarText}>
              {patient.firstName[0]}{patient.lastName[0]}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.patientName}>{patient.firstName} {patient.lastName}</Text>
            <Text style={styles.patientInfo}>{patient.address}, {patient.city}, {patient.state} {patient.zip}</Text>
            <Text style={styles.patientInfo}>{patient.phone} · {patient.email}</Text>
            <Text style={styles.patientInsurance}>
              Insurance: {patient.primaryInsurance.company} · Member: {patient.primaryInsurance.memberId}
            </Text>
          </View>
        </View>

        {/* Balance Summary */}
        <View style={styles.balanceBanner}>
          <View style={styles.balanceBannerCol}>
            <Text style={styles.balBannerLabel}>Total Charged</Text>
            <Text style={styles.balBannerValue}>${totalCharged.toFixed(2)}</Text>
          </View>
          <View style={styles.balanceBannerDivider} />
          <View style={styles.balanceBannerCol}>
            <Text style={styles.balBannerLabel}>Ins. Paid</Text>
            <Text style={[styles.balBannerValue, { color: Colors.success }]}>${totalPaid.toFixed(2)}</Text>
          </View>
          <View style={styles.balanceBannerDivider} />
          <View style={styles.balanceBannerCol}>
            <Text style={styles.balBannerLabel}>You Owe</Text>
            <Text style={[styles.balBannerValue, { color: totalOutstanding > 0 ? Colors.danger : Colors.success, fontSize: FontSize.xxl }]}>
              ${totalOutstanding.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Outstanding Charges */}
        {unpaidClaims.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Outstanding Charges</Text>
            {unpaidClaims.map(claim => (
              <View key={claim.id} style={styles.claimRow}>
                <View style={styles.claimRowHeader}>
                  <View>
                    <Text style={styles.claimDOS}>DOS: {claim.dos}</Text>
                    <Text style={styles.claimNum}>{claim.claimNumber}</Text>
                  </View>
                  <View style={[styles.claimStatusBadge, {
                    backgroundColor: claim.status === 'Denied' ? Colors.dangerLight : Colors.warningLight
                  }]}>
                    <Text style={[styles.claimStatusText, {
                      color: claim.status === 'Denied' ? Colors.danger : Colors.warning
                    }]}>{claim.status}</Text>
                  </View>
                </View>

                {/* CPT Line Items */}
                {claim.cptCodes.map((cpt, i) => (
                  <View key={i} style={styles.cptLine}>
                    <View style={styles.cptInfo}>
                      <Text style={styles.cptCode}>{cpt.code}</Text>
                      <Text style={styles.cptDesc} numberOfLines={1}>{cpt.description}</Text>
                    </View>
                    <View style={styles.cptAmounts}>
                      <Text style={styles.cptCharge}>${cpt.charge.toFixed(2)}</Text>
                    </View>
                  </View>
                ))}

                {/* Claim Financial Summary */}
                <View style={styles.claimFinancials}>
                  <View style={styles.claimFinRow}>
                    <Text style={styles.claimFinLabel}>Total Charge</Text>
                    <Text style={styles.claimFinValue}>${claim.totalCharge.toFixed(2)}</Text>
                  </View>
                  <View style={styles.claimFinRow}>
                    <Text style={styles.claimFinLabel}>Insurance Paid</Text>
                    <Text style={[styles.claimFinValue, { color: Colors.success }]}>-${claim.paidAmount.toFixed(2)}</Text>
                  </View>
                  {claim.adjustments > 0 && (
                    <View style={styles.claimFinRow}>
                      <Text style={styles.claimFinLabel}>Adjustments</Text>
                      <Text style={[styles.claimFinValue, { color: Colors.textMuted }]}>-${claim.adjustments.toFixed(2)}</Text>
                    </View>
                  )}
                  <View style={[styles.claimFinRow, styles.claimFinTotal]}>
                    <Text style={styles.claimFinTotalLabel}>Patient Responsibility</Text>
                    <Text style={[styles.claimFinTotalValue, { color: Colors.danger }]}>
                      ${claim.patientBalance.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Payment History */}
        {paidClaims.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Payment History</Text>
            <View style={styles.historyCard}>
              {paidClaims.map(claim => (
                <View key={claim.id} style={styles.historyRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyDate}>{claim.paidDate ?? claim.dos}</Text>
                    <Text style={styles.historyDesc} numberOfLines={1}>
                      {claim.cptCodes.map(c => c.code).join(', ')} · {claim.claimNumber}
                    </Text>
                  </View>
                  <Text style={[styles.historyAmount, { color: Colors.success }]}>
                    ${claim.paidAmount.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* No Outstanding */}
        {unpaidClaims.length === 0 && (
          <View style={styles.zeroBalanceCard}>
            <MaterialIcons name="check-circle" size={40} color={Colors.success} />
            <Text style={styles.zeroBalanceTitle}>Account is Current</Text>
            <Text style={styles.zeroBalanceSub}>No outstanding balance — thank you!</Text>
          </View>
        )}

        {/* Payment Instructions */}
        <View style={styles.paymentInstructions}>
          <Text style={styles.instrTitle}>Payment Options</Text>
          {[
            { icon: 'language', label: 'Online', desc: 'pay.sunrisemedical.com' },
            { icon: 'phone', label: 'Phone', desc: '(713) 555-0100' },
            { icon: 'mail', label: 'Mail', desc: '500 Medical Center Blvd, Houston TX 77001' },
          ].map(opt => (
            <View key={opt.label} style={styles.instrRow}>
              <MaterialIcons name={opt.icon as any} size={16} color={Colors.primary} />
              <Text style={styles.instrLabel}>{opt.label}:</Text>
              <Text style={styles.instrDesc}>{opt.desc}</Text>
            </View>
          ))}
          <Text style={styles.instrNote}>
            Payment due within 30 days of statement date. Questions? Call (713) 555-0100.
          </Text>
        </View>

        {/* Send Statement Buttons */}
        <Text style={styles.sectionTitle}>Send Statement</Text>
        <View style={styles.sendRow}>
          {(['Email', 'Mail', 'Print'] as const).map(method => (
            <Pressable
              key={method}
              style={[styles.sendBtn, sending && { opacity: 0.6 }]}
              onPress={() => handleSendStatement(method)}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <MaterialIcons
                    name={method === 'Email' ? 'email' : method === 'Mail' ? 'local-post-office' : 'print'}
                    size={20}
                    color={Colors.primary}
                  />
                  <Text style={styles.sendBtnText}>{method}</Text>
                </>
              )}
            </Pressable>
          ))}
        </View>

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

  statementHeader: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: 8, ...Shadow.sm,
    borderTopWidth: 3, borderTopColor: Colors.primary,
  },
  practiceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  practiceName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  practiceAddr: { fontSize: FontSize.xs, color: Colors.textMuted },
  headerDivider: { height: 1, backgroundColor: Colors.divider, marginVertical: 4 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  statValue: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textPrimary },

  patientCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
    flexDirection: 'row', gap: 12, ...Shadow.sm,
  },
  patientAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  patientAvatarText: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },
  patientName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  patientInfo: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  patientInsurance: { fontSize: FontSize.xs, color: Colors.primary, marginTop: 4, fontWeight: '500' },

  balanceBanner: {
    backgroundColor: Colors.navBg, borderRadius: Radius.lg, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center',
  },
  balanceBannerCol: { flex: 1, alignItems: 'center' },
  balanceBannerDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)' },
  balBannerLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  balBannerValue: { fontSize: FontSize.xl, fontWeight: '800', color: '#fff' },

  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginTop: 4 },

  claimRow: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm,
    borderLeftWidth: 3, borderLeftColor: Colors.warning,
  },
  claimRowHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  claimDOS: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  claimNum: { fontSize: FontSize.xs, color: Colors.primary, marginTop: 2 },
  claimStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  claimStatusText: { fontSize: FontSize.xs, fontWeight: '700' },

  cptLine: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  cptInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  cptCode: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary, width: 52 },
  cptDesc: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary },
  cptAmounts: { alignItems: 'flex-end' },
  cptCharge: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },

  claimFinancials: { padding: Spacing.md, gap: 6, backgroundColor: Colors.surfaceAlt },
  claimFinRow: { flexDirection: 'row', justifyContent: 'space-between' },
  claimFinLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  claimFinValue: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textPrimary },
  claimFinTotal: { paddingTop: 6, borderTopWidth: 1, borderTopColor: Colors.divider, marginTop: 2 },
  claimFinTotalLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  claimFinTotalValue: { fontSize: FontSize.md, fontWeight: '800' },

  historyCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm,
  },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  historyDate: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  historyDesc: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  historyAmount: { fontSize: FontSize.md, fontWeight: '700' },

  zeroBalanceCard: {
    backgroundColor: Colors.successLight, borderRadius: Radius.lg, padding: Spacing.xl,
    alignItems: 'center', gap: 8,
  },
  zeroBalanceTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.success },
  zeroBalanceSub: { fontSize: FontSize.sm, color: Colors.success },

  paymentInstructions: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: 8, ...Shadow.sm,
  },
  instrTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  instrRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  instrLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, width: 40 },
  instrDesc: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary },
  instrNote: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4, lineHeight: 18 },

  sendRow: { flexDirection: 'row', gap: 10 },
  sendBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.lg, paddingVertical: 16, gap: 8,
    borderWidth: 1.5, borderColor: Colors.primary, ...Shadow.sm,
  },
  sendBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary },
});
