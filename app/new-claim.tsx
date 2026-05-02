import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { CPT_SUGGESTIONS, ICD10_SUGGESTIONS, Claim } from '@/constants/mockData';

export default function NewClaimScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { patients, addClaim } = useApp();
  const { showAlert } = useAlert();

  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [dos, setDos] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCPTs, setSelectedCPTs] = useState<string[]>([]);
  const [selectedICDs, setSelectedICDs] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [showCPTPicker, setShowCPTPicker] = useState(false);
  const [showICDPicker, setShowICDPicker] = useState(false);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const filteredPatients = patients.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientSearch.toLowerCase())
  ).slice(0, 5);

  const selectedCPTData = CPT_SUGGESTIONS.filter(c => selectedCPTs.includes(c.code));
  const totalCharge = selectedCPTData.reduce((s, c) => s + c.charge, 0);

  const toggleCPT = (code: string) => {
    setSelectedCPTs(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  };
  const toggleICD = (code: string) => {
    setSelectedICDs(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  };

  const handleSubmit = (asDraft: boolean) => {
    if (!selectedPatientId) {
      showAlert('Error', 'Please select a patient.');
      return;
    }
    if (selectedCPTs.length === 0) {
      showAlert('Error', 'Please add at least one CPT code.');
      return;
    }
    if (selectedICDs.length === 0) {
      showAlert('Error', 'Please add at least one ICD-10 code.');
      return;
    }

    const claim: Claim = {
      id: `cl${Date.now()}`,
      claimNumber: `CLM-2026-${String(Math.floor(Math.random() * 90000) + 10000)}`,
      patientId: selectedPatientId,
      patientName: `${selectedPatient!.firstName} ${selectedPatient!.lastName}`,
      serviceDate: dos,
      providerId: selectedPatient!.providerId || 'p1',
      providerName: 'Dr. James Wilson',
      dos,
      cptCodes: selectedCPTData.map(c => ({ code: c.code, description: c.description, units: 1, charge: c.charge })),
      icdCodes: selectedICDs,
      totalCharge,
      allowedAmount: 0,
      paidAmount: 0,
      adjustments: 0,
      patientBalance: 0,
      status: asDraft ? 'Draft' : 'Pending',
      insuranceCompany: selectedPatient!.primaryInsurance.company,
      notes,
      submittedDate: asDraft ? undefined : new Date().toISOString().split('T')[0],
    };

    addClaim(claim);
    showAlert(
      asDraft ? 'Saved as Draft' : 'Claim Submitted',
      `${claim.claimNumber} has been ${asDraft ? 'saved' : 'submitted to ' + claim.insuranceCompany}.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="close" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>New Claim</Text>
        <Pressable onPress={() => handleSubmit(true)} style={styles.draftBtn}>
          <Text style={styles.draftBtnText}>Draft</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Patient Selection */}
        <Text style={styles.sectionTitle}>Patient *</Text>
        <View style={styles.card}>
          {selectedPatient ? (
            <View style={styles.selectedPatient}>
              <View style={styles.selectedAvatar}>
                <Text style={styles.selectedAvatarText}>{selectedPatient.firstName[0]}{selectedPatient.lastName[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedName}>{selectedPatient.firstName} {selectedPatient.lastName}</Text>
                <Text style={styles.selectedSub}>{selectedPatient.primaryInsurance.company} · {selectedPatient.id}</Text>
              </View>
              <Pressable onPress={() => { setSelectedPatientId(''); setPatientSearch(''); }} hitSlop={8}>
                <MaterialIcons name="close" size={20} color={Colors.textMuted} />
              </Pressable>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.input}
                value={patientSearch}
                onChangeText={setPatientSearch}
                placeholder="Search patient by name..."
                placeholderTextColor={Colors.textMuted}
              />
              {patientSearch.length > 0 && filteredPatients.map(p => (
                <Pressable
                  key={p.id}
                  onPress={() => { setSelectedPatientId(p.id); setPatientSearch(''); }}
                  style={styles.patientResult}
                >
                  <Text style={styles.patientResultName}>{p.firstName} {p.lastName}</Text>
                  <Text style={styles.patientResultSub}>{p.primaryInsurance.company}</Text>
                </Pressable>
              ))}
            </>
          )}
        </View>

        {/* DOS */}
        <Text style={styles.sectionTitle}>Date of Service *</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            value={dos}
            onChangeText={setDos}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        {/* CPT Codes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>CPT Codes *</Text>
          <Pressable onPress={() => setShowCPTPicker(!showCPTPicker)} style={styles.addCodeBtn}>
            <MaterialIcons name={showCPTPicker ? 'expand-less' : 'add'} size={16} color={Colors.primary} />
            <Text style={styles.addCodeText}>{showCPTPicker ? 'Collapse' : 'Add'}</Text>
          </Pressable>
        </View>
        {selectedCPTData.length > 0 ? (
          <View style={styles.card}>
            {selectedCPTData.map(c => (
              <View key={c.code} style={styles.codeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.codeBadge}>{c.code}</Text>
                  <Text style={styles.codeDesc}>{c.description}</Text>
                </View>
                <Text style={styles.codeCharge}>${c.charge.toFixed(2)}</Text>
                <Pressable onPress={() => toggleCPT(c.code)} hitSlop={8}>
                  <MaterialIcons name="remove-circle" size={20} color={Colors.danger} />
                </Pressable>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Charge</Text>
              <Text style={styles.totalValue}>${totalCharge.toFixed(2)}</Text>
            </View>
          </View>
        ) : null}
        {showCPTPicker ? (
          <View style={styles.pickerCard}>
            {CPT_SUGGESTIONS.map(c => (
              <Pressable
                key={c.code}
                onPress={() => toggleCPT(c.code)}
                style={[styles.pickerRow, selectedCPTs.includes(c.code) && styles.pickerRowActive]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickerCode}>{c.code}</Text>
                  <Text style={styles.pickerDesc}>{c.description}</Text>
                </View>
                <Text style={styles.pickerCharge}>${c.charge.toFixed(2)}</Text>
                {selectedCPTs.includes(c.code) ? <MaterialIcons name="check-circle" size={20} color={Colors.success} /> : <MaterialIcons name="add-circle-outline" size={20} color={Colors.textMuted} />}
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* ICD-10 Codes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ICD-10 Codes *</Text>
          <Pressable onPress={() => setShowICDPicker(!showICDPicker)} style={styles.addCodeBtn}>
            <MaterialIcons name={showICDPicker ? 'expand-less' : 'add'} size={16} color={Colors.primary} />
            <Text style={styles.addCodeText}>{showICDPicker ? 'Collapse' : 'Add'}</Text>
          </Pressable>
        </View>
        {selectedICDs.length > 0 ? (
          <View style={styles.card}>
            <View style={styles.icdWrap}>
              {selectedICDs.map(code => (
                <Pressable key={code} onPress={() => toggleICD(code)} style={styles.icdChip}>
                  <Text style={styles.icdText}>{code}</Text>
                  <MaterialIcons name="close" size={12} color={Colors.primaryDark} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
        {showICDPicker ? (
          <View style={styles.pickerCard}>
            {ICD10_SUGGESTIONS.map(d => (
              <Pressable
                key={d.code}
                onPress={() => toggleICD(d.code)}
                style={[styles.pickerRow, selectedICDs.includes(d.code) && styles.pickerRowActive]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickerCode}>{d.code}</Text>
                  <Text style={styles.pickerDesc}>{d.description}</Text>
                </View>
                {selectedICDs.includes(d.code) ? <MaterialIcons name="check-circle" size={20} color={Colors.success} /> : <MaterialIcons name="add-circle-outline" size={20} color={Colors.textMuted} />}
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* Notes */}
        <Text style={styles.sectionTitle}>Notes</Text>
        <View style={styles.card}>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add clinical notes or billing instructions..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Actions */}
        <Pressable onPress={() => handleSubmit(false)} style={styles.submitBtn}>
          <MaterialIcons name="send" size={20} color="#fff" />
          <Text style={styles.submitText}>Submit Claim — ${totalCharge.toFixed(2)}</Text>
        </Pressable>

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
  draftBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  draftBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: '#fff' },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginTop: 8 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: 10, ...Shadow.sm },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceAlt,
  },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  selectedPatient: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedAvatarText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },
  selectedName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  selectedSub: { fontSize: FontSize.xs, color: Colors.textMuted },
  patientResult: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  patientResultName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  patientResultSub: { fontSize: FontSize.xs, color: Colors.textMuted },
  addCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  addCodeText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.primary },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  codeBadge: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary },
  codeDesc: { fontSize: FontSize.xs, color: Colors.textSecondary },
  codeCharge: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  totalLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  totalValue: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary },
  pickerCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  pickerRowActive: { backgroundColor: Colors.successLight },
  pickerCode: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary },
  pickerDesc: { fontSize: FontSize.xs, color: Colors.textSecondary },
  pickerCharge: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  icdWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  icdChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  icdText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primaryDark },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 18,
    gap: 10,
    marginTop: 8,
    ...Shadow.md,
  },
  submitText: { fontSize: FontSize.base, fontWeight: '700', color: '#fff' },
});
