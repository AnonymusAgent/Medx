import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';

const ADJUSTMENT_CODES = [
  { code: 'CO-45', desc: 'Charge exceeds fee schedule / maximum allowable' },
  { code: 'CO-97', desc: 'Benefit included in payment for another service' },
  { code: 'CO-4', desc: 'Service inconsistent with diagnosis' },
  { code: 'CO-11', desc: 'Diagnosis inconsistent with procedure' },
  { code: 'CO-18', desc: 'Duplicate claim or service' },
  { code: 'CO-22', desc: 'May be covered by another plan' },
  { code: 'CO-29', desc: 'Service billed past timely filing limit' },
  { code: 'PR-1', desc: 'Deductible amount' },
  { code: 'PR-2', desc: 'Coinsurance amount' },
  { code: 'PR-3', desc: 'Co-payment amount' },
  { code: 'OA-23', desc: 'Workers compensation payment' },
];

interface AdjLine {
  id: string;
  code: string;
  amount: string;
}

export default function PaymentPostingScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { claims, updateClaim } = useApp();
  const { showAlert } = useAlert();

  const [selectedClaimId, setSelectedClaimId] = useState<string>(id ?? '');
  const [checkNumber, setCheckNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [allowedAmount, setAllowedAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [adjLines, setAdjLines] = useState<AdjLine[]>([
    { id: '1', code: 'CO-45', amount: '' },
  ]);
  const [notes, setNotes] = useState('');
  const [showCodePicker, setShowCodePicker] = useState<string | null>(null);
  const [showClaimPicker, setShowClaimPicker] = useState(!id);
  const [posting, setPosting] = useState(false);

  const openClaims = useMemo(
    () => claims.filter(c => c.status !== 'Paid'),
    [claims]
  );
  const selectedClaim = claims.find(c => c.id === selectedClaimId);

  const totalAdj = adjLines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
  const patientBal = Math.max(
    0,
    (parseFloat(allowedAmount) || 0) - (parseFloat(paidAmount) || 0) - totalAdj
  );
  const newStatus: 'Paid' | 'Partial' =
    patientBal === 0 && parseFloat(paidAmount) > 0 ? 'Paid' : 'Partial';

  const addAdjLine = () => {
    setAdjLines(prev => [
      ...prev,
      { id: Date.now().toString(), code: 'CO-45', amount: '' },
    ]);
  };

  const removeAdjLine = (lineId: string) => {
    setAdjLines(prev => prev.filter(l => l.id !== lineId));
  };

  const updateAdjLine = (lineId: string, field: 'code' | 'amount', value: string) => {
    setAdjLines(prev => prev.map(l => (l.id === lineId ? { ...l, [field]: value } : l)));
  };

  const handlePost = async () => {
    if (!selectedClaim) {
      showAlert('Select Claim', 'Please select a claim to post payment.');
      return;
    }
    if (!paidAmount || parseFloat(paidAmount) < 0) {
      showAlert('Required', 'Please enter a valid paid amount.');
      return;
    }
    setPosting(true);
    try {
      const paid = parseFloat(paidAmount) || 0;
      const allowed = parseFloat(allowedAmount) || selectedClaim.totalCharge;
      await updateClaim(selectedClaim.id, {
        allowedAmount: allowed,
        paidAmount: paid,
        adjustments: totalAdj,
        patientBalance: patientBal,
        status: newStatus,
        paidDate: paymentDate,
        notes: notes || selectedClaim.notes,
      });
      showAlert(
        'Payment Posted',
        `$${paid.toFixed(2)} posted to ${selectedClaim.claimNumber}. Status updated to ${newStatus}.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } finally {
      setPosting(false);
    }
  };

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
        <Text style={styles.headerTitle}>Payment Posting</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Claim Selector */}
        <Text style={styles.sectionTitle}>Select Claim</Text>
        <Pressable
          style={styles.claimSelector}
          onPress={() => setShowClaimPicker(v => !v)}
        >
          <MaterialIcons name="receipt-long" size={18} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            {selectedClaim ? (
              <>
                <Text style={styles.claimSelName}>{selectedClaim.claimNumber}</Text>
                <Text style={styles.claimSelSub}>
                  {selectedClaim.patientName} · {selectedClaim.insuranceCompany} · $
                  {selectedClaim.totalCharge.toFixed(2)}
                </Text>
              </>
            ) : (
              <Text style={styles.claimSelPlaceholder}>Tap to select a claim…</Text>
            )}
          </View>
          <MaterialIcons
            name={showClaimPicker ? 'expand-less' : 'expand-more'}
            size={22}
            color={Colors.textMuted}
          />
        </Pressable>

        {showClaimPicker && (
          <View style={styles.claimList}>
            {openClaims.length === 0 ? (
              <Text style={styles.emptyText}>No open claims found.</Text>
            ) : (
              openClaims.map(c => (
                <Pressable
                  key={c.id}
                  style={[styles.claimOption, selectedClaimId === c.id && styles.claimOptionActive]}
                  onPress={() => {
                    setSelectedClaimId(c.id);
                    setAllowedAmount(c.allowedAmount > 0 ? String(c.allowedAmount) : '');
                    setShowClaimPicker(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.claimOptNum, selectedClaimId === c.id && { color: Colors.primary }]}>
                      {c.claimNumber}
                    </Text>
                    <Text style={styles.claimOptSub}>
                      {c.patientName} · {c.insuranceCompany}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.claimOptAmount}>${c.totalCharge.toFixed(2)}</Text>
                    <Text style={styles.claimOptStatus}>{c.status}</Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        )}

        {selectedClaim && (
          <>
            {/* Claim Summary */}
            <View style={styles.claimSummaryCard}>
              <View style={styles.claimSummaryRow}>
                <Text style={styles.csr_label}>Patient</Text>
                <Text style={styles.csr_value}>{selectedClaim.patientName}</Text>
              </View>
              <View style={styles.claimSummaryRow}>
                <Text style={styles.csr_label}>Insurance</Text>
                <Text style={styles.csr_value}>{selectedClaim.insuranceCompany}</Text>
              </View>
              <View style={styles.claimSummaryRow}>
                <Text style={styles.csr_label}>DOS</Text>
                <Text style={styles.csr_value}>{selectedClaim.dos}</Text>
              </View>
              <View style={styles.claimSummaryRow}>
                <Text style={styles.csr_label}>Total Charge</Text>
                <Text style={[styles.csr_value, { color: Colors.primary, fontWeight: '700' }]}>
                  ${selectedClaim.totalCharge.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* ERA/EOB Entry */}
            <Text style={styles.sectionTitle}>ERA / EOB Entry</Text>
            <View style={styles.card}>
              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Check / EFT Number</Text>
                  <TextInput
                    style={styles.input}
                    value={checkNumber}
                    onChangeText={setCheckNumber}
                    placeholder="e.g. 12345678"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Payment Date</Text>
                  <TextInput
                    style={styles.input}
                    value={paymentDate}
                    onChangeText={setPaymentDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>
              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Allowed Amount ($)</Text>
                  <TextInput
                    style={styles.input}
                    value={allowedAmount}
                    onChangeText={setAllowedAmount}
                    placeholder="0.00"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Paid Amount ($)</Text>
                  <TextInput
                    style={[styles.input, { borderColor: Colors.success }]}
                    value={paidAmount}
                    onChangeText={setPaidAmount}
                    placeholder="0.00"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>

            {/* Adjustment Lines */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Adjustment Reason Codes</Text>
              <Pressable style={styles.addBtn} onPress={addAdjLine}>
                <MaterialIcons name="add" size={14} color={Colors.primary} />
                <Text style={styles.addBtnText}>Add Line</Text>
              </Pressable>
            </View>
            {adjLines.map(line => (
              <View key={line.id} style={styles.adjLineCard}>
                <Pressable
                  style={styles.adjCodeBtn}
                  onPress={() => setShowCodePicker(showCodePicker === line.id ? null : line.id)}
                >
                  <Text style={styles.adjCode}>{line.code}</Text>
                  <MaterialIcons name="expand-more" size={16} color={Colors.textMuted} />
                </Pressable>
                {showCodePicker === line.id && (
                  <ScrollView style={styles.codePicker} nestedScrollEnabled>
                    {ADJUSTMENT_CODES.map(ac => (
                      <Pressable
                        key={ac.code}
                        style={styles.codePickerRow}
                        onPress={() => {
                          updateAdjLine(line.id, 'code', ac.code);
                          setShowCodePicker(null);
                        }}
                      >
                        <Text style={styles.codePickerCode}>{ac.code}</Text>
                        <Text style={styles.codePickerDesc} numberOfLines={1}>
                          {ac.desc}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
                <Text style={styles.adjCodeDesc} numberOfLines={1}>
                  {ADJUSTMENT_CODES.find(c => c.code === line.code)?.desc ?? ''}
                </Text>
                <View style={styles.adjAmtRow}>
                  <TextInput
                    style={styles.adjAmtInput}
                    value={line.amount}
                    onChangeText={v => updateAdjLine(line.id, 'amount', v)}
                    placeholder="$0.00"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                  {adjLines.length > 1 && (
                    <Pressable onPress={() => removeAdjLine(line.id)} hitSlop={8}>
                      <MaterialIcons name="delete-outline" size={20} color={Colors.danger} />
                    </Pressable>
                  )}
                </View>
              </View>
            ))}

            {/* Notes */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Notes / Remarks</Text>
              <TextInput
                style={[styles.input, { minHeight: 72, textAlignVertical: 'top' }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="ERA remarks, denial notes, etc."
                placeholderTextColor={Colors.textMuted}
                multiline
              />
            </View>

            {/* Balance Summary */}
            <View style={styles.balanceSummary}>
              <Text style={styles.balanceTitle}>Payment Summary</Text>
              {[
                {
                  label: 'Total Charge',
                  value: `$${selectedClaim.totalCharge.toFixed(2)}`,
                  color: Colors.textPrimary,
                },
                {
                  label: 'Allowed Amount',
                  value: allowedAmount ? `$${parseFloat(allowedAmount).toFixed(2)}` : '—',
                  color: Colors.textPrimary,
                },
                {
                  label: 'Insurance Paid',
                  value: paidAmount ? `$${parseFloat(paidAmount).toFixed(2)}` : '—',
                  color: Colors.success,
                },
                {
                  label: 'Total Adjustments',
                  value: `$${totalAdj.toFixed(2)}`,
                  color: Colors.textSecondary,
                },
              ].map(r => (
                <View key={r.label} style={styles.balRow}>
                  <Text style={styles.balLabel}>{r.label}</Text>
                  <Text style={[styles.balValue, { color: r.color }]}>{r.value}</Text>
                </View>
              ))}
              <View style={styles.balDivider} />
              <View style={styles.balRow}>
                <Text style={[styles.balLabel, { fontWeight: '700', fontSize: FontSize.base }]}>
                  Patient Balance
                </Text>
                <Text
                  style={[
                    styles.balValue,
                    { fontSize: FontSize.xl, fontWeight: '800', color: patientBal > 0 ? Colors.warning : Colors.success },
                  ]}
                >
                  ${patientBal.toFixed(2)}
                </Text>
              </View>
              <View style={[styles.statusPreview, { backgroundColor: newStatus === 'Paid' ? Colors.successLight : Colors.warningLight }]}>
                <MaterialIcons
                  name={newStatus === 'Paid' ? 'check-circle' : 'pending'}
                  size={16}
                  color={newStatus === 'Paid' ? Colors.success : Colors.warning}
                />
                <Text
                  style={[
                    styles.statusPreviewText,
                    { color: newStatus === 'Paid' ? Colors.success : Colors.warning },
                  ]}
                >
                  Claim will be marked as {newStatus}
                </Text>
              </View>
            </View>

            {/* Post Button */}
            <Pressable
              style={[styles.postBtn, posting && { opacity: 0.7 }]}
              onPress={handlePost}
              disabled={posting}
            >
              {posting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="payments" size={20} color="#fff" />
                  <Text style={styles.postBtnText}>Post Payment</Text>
                </>
              )}
            </Pressable>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.navBg,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700', color: '#fff' },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.sm },

  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginTop: 4 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full,
  },
  addBtnText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.primary },

  claimSelector: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.primary + '50', ...Shadow.sm,
  },
  claimSelName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  claimSelSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  claimSelPlaceholder: { fontSize: FontSize.sm, color: Colors.textMuted },

  claimList: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border, ...Shadow.md,
  },
  claimOption: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  claimOptionActive: { backgroundColor: Colors.primaryLight },
  claimOptNum: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  claimOptSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  claimOptAmount: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  claimOptStatus: { fontSize: FontSize.xs, color: Colors.textMuted },
  emptyText: { padding: Spacing.md, textAlign: 'center', color: Colors.textMuted },

  claimSummaryCard: {
    backgroundColor: Colors.navBg, borderRadius: Radius.lg, padding: Spacing.md, gap: 8,
  },
  claimSummaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  csr_label: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.5)' },
  csr_value: { fontSize: FontSize.sm, color: '#fff', fontWeight: '500' },

  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: 10, ...Shadow.sm },
  formRow: { flexDirection: 'row', gap: 10 },
  field: { gap: 5 },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 11, fontSize: FontSize.sm,
    color: Colors.textPrimary, backgroundColor: Colors.surfaceAlt,
  },

  adjLineCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: 6,
    borderLeftWidth: 3, borderLeftColor: Colors.warning, ...Shadow.sm,
  },
  adjCodeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.warningLight, paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: Radius.md, alignSelf: 'flex-start',
  },
  adjCode: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.warning },
  adjCodeDesc: { fontSize: FontSize.xs, color: Colors.textSecondary },
  adjAmtRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  adjAmtInput: {
    flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: FontSize.sm, color: Colors.textPrimary,
    backgroundColor: Colors.surfaceAlt,
  },
  codePicker: {
    maxHeight: 180, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    backgroundColor: Colors.surface, ...Shadow.md,
  },
  codePickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  codePickerCode: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.warning, width: 52 },
  codePickerDesc: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary },

  balanceSummary: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: 8,
    ...Shadow.md, borderTopWidth: 3, borderTopColor: Colors.primary,
  },
  balanceTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  balRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  balValue: { fontSize: FontSize.sm, fontWeight: '600' },
  balDivider: { height: 1, backgroundColor: Colors.divider, marginVertical: 4 },
  statusPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: Radius.md, padding: Spacing.sm,
  },
  statusPreviewText: { fontSize: FontSize.sm, fontWeight: '600' },

  postBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.success, borderRadius: Radius.lg, paddingVertical: 18, gap: 10,
    ...Shadow.lg, marginTop: 8,
  },
  postBtnText: { fontSize: FontSize.lg, fontWeight: '800', color: '#fff' },
});
