import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { StatusBadge } from '@/components';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import {
  CPTCode,
  MOCK_PROVIDERS,
  CPT_SUGGESTIONS,
  ICD10_SUGGESTIONS,
} from '@/constants/mockData';

export default function ClaimDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { claims, updateClaim } = useApp();
  const { showAlert } = useAlert();

  const claim = claims.find(c => c.id === id);
  const [isEditing, setIsEditing] = useState(false);

  // Edit state
  const [editProviderId, setEditProviderId] = useState(claim?.providerId ?? 'p1');
  const [editCptCodes, setEditCptCodes] = useState<CPTCode[]>(claim?.cptCodes ?? []);
  const [editIcdCodes, setEditIcdCodes] = useState<string[]>(claim?.icdCodes ?? []);
  const [showCptPicker, setShowCptPicker] = useState(false);
  const [showIcdPicker, setShowIcdPicker] = useState(false);
  const [customCptCode, setCustomCptCode] = useState('');
  const [customCptDesc, setCustomCptDesc] = useState('');
  const [customCptCharge, setCustomCptCharge] = useState('');
  const [customIcd, setCustomIcd] = useState('');

  if (!claim) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Text style={{ color: Colors.textPrimary, padding: 20 }}>Claim not found.</Text>
      </View>
    );
  }

  const selectedProvider = MOCK_PROVIDERS.find(p => p.id === editProviderId) ?? MOCK_PROVIDERS[0];

  const handleSubmit = () => {
    showAlert('Submit Claim', `Submit ${claim.claimNumber} to ${claim.insuranceCompany}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Submit',
        onPress: () => {
          updateClaim(id!, { status: 'Submitted', submittedDate: new Date().toISOString().split('T')[0] });
          showAlert('Submitted', 'Claim has been submitted electronically.');
        },
      },
    ]);
  };

  const handleResubmit = () => {
    showAlert('Resubmit Claim', `Resubmit ${claim.claimNumber} after correcting denial reason?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Resubmit',
        onPress: () => {
          updateClaim(id!, { status: 'Submitted', submittedDate: new Date().toISOString().split('T')[0], denialReason: undefined });
          showAlert('Resubmitted', 'Claim has been resubmitted.');
        },
      },
    ]);
  };

  const handleSaveEdits = () => {
    if (editCptCodes.length === 0) {
      showAlert('Validation', 'At least one CPT code is required.');
      return;
    }
    const totalCharge = editCptCodes.reduce((s, c) => s + c.charge * c.units, 0);
    const provider = MOCK_PROVIDERS.find(p => p.id === editProviderId);
    updateClaim(id!, {
      providerId: editProviderId,
      providerName: provider?.name ?? claim.providerName,
      cptCodes: editCptCodes,
      icdCodes: editIcdCodes,
      totalCharge,
    });
    setIsEditing(false);
    showAlert('Saved', 'Claim has been updated successfully.');
  };

  const handleCancelEdit = () => {
    setEditProviderId(claim.providerId);
    setEditCptCodes(claim.cptCodes);
    setEditIcdCodes(claim.icdCodes);
    setShowCptPicker(false);
    setShowIcdPicker(false);
    setIsEditing(false);
  };

  const addCptFromSuggestion = (cpt: typeof CPT_SUGGESTIONS[0]) => {
    const existing = editCptCodes.find(c => c.code === cpt.code);
    if (existing) {
      setEditCptCodes(prev => prev.map(c => c.code === cpt.code ? { ...c, units: c.units + 1 } : c));
    } else {
      setEditCptCodes(prev => [...prev, { code: cpt.code, description: cpt.description, units: 1, charge: cpt.charge }]);
    }
    setShowCptPicker(false);
  };

  const addCustomCpt = () => {
    if (!customCptCode.trim() || !customCptDesc.trim()) {
      showAlert('Required', 'CPT code and description are required.');
      return;
    }
    setEditCptCodes(prev => [...prev, {
      code: customCptCode.trim().toUpperCase(),
      description: customCptDesc.trim(),
      units: 1,
      charge: parseFloat(customCptCharge) || 0,
    }]);
    setCustomCptCode('');
    setCustomCptDesc('');
    setCustomCptCharge('');
    setShowCptPicker(false);
  };

  const removeCpt = (code: string) => {
    setEditCptCodes(prev => prev.filter(c => c.code !== code));
  };

  const updateCptField = (code: string, field: 'units' | 'charge' | 'modifier', value: string) => {
    setEditCptCodes(prev => prev.map(c => {
      if (c.code !== code) return c;
      if (field === 'units') return { ...c, units: Math.max(1, parseInt(value) || 1) };
      if (field === 'charge') return { ...c, charge: parseFloat(value) || 0 };
      if (field === 'modifier') return { ...c, modifier: value };
      return c;
    }));
  };

  const addIcdFromSuggestion = (icd: typeof ICD10_SUGGESTIONS[0]) => {
    if (!editIcdCodes.includes(icd.code)) {
      setEditIcdCodes(prev => [...prev, icd.code]);
    }
    setShowIcdPicker(false);
  };

  const addCustomIcd = () => {
    const code = customIcd.trim().toUpperCase();
    if (!code) return;
    if (!editIcdCodes.includes(code)) {
      setEditIcdCodes(prev => [...prev, code]);
    }
    setCustomIcd('');
    setShowIcdPicker(false);
  };

  const removeIcd = (code: string) => {
    setEditIcdCodes(prev => prev.filter(c => c !== code));
  };

  const editTotalCharge = editCptCodes.reduce((s, c) => s + c.charge * c.units, 0);

  // ===== EDIT MODE =====
  if (isEditing) {
    return (
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={handleCancelEdit} hitSlop={8}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Charge</Text>
          <Pressable onPress={handleSaveEdits} style={styles.saveHdrBtn}>
            <Text style={styles.saveHdrText}>Save</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Claim Identity Banner */}
          <View style={styles.editBanner}>
            <MaterialIcons name="edit" size={16} color={Colors.primary} />
            <Text style={styles.editBannerText}>Editing {claim.claimNumber} · {claim.patientName}</Text>
          </View>

          {/* Provider Selection */}
          <Text style={styles.sectionTitle}>Rendering Provider</Text>
          <View style={styles.card}>
            {MOCK_PROVIDERS.map(p => (
              <Pressable
                key={p.id}
                onPress={() => setEditProviderId(p.id)}
                style={[styles.providerOption, editProviderId === p.id && styles.providerOptionActive]}
              >
                <View style={[styles.providerDot, { backgroundColor: p.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.providerOptionName, editProviderId === p.id && { color: Colors.primary }]}>
                    {p.name}
                  </Text>
                  <Text style={styles.providerOptionSpec}>{p.specialty} · NPI: {p.npi}</Text>
                </View>
                {editProviderId === p.id ? (
                  <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
                ) : (
                  <MaterialIcons name="radio-button-unchecked" size={20} color={Colors.textMuted} />
                )}
              </Pressable>
            ))}
          </View>

          {/* CPT Codes Editor */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>CPT Codes</Text>
            <Pressable
              style={styles.addCodeBtn}
              onPress={() => { setShowCptPicker(true); setShowIcdPicker(false); }}
            >
              <MaterialIcons name="add" size={16} color={Colors.primary} />
              <Text style={styles.addCodeText}>Add CPT</Text>
            </Pressable>
          </View>

          {/* CPT Picker */}
          {showCptPicker ? (
            <View style={styles.pickerCard}>
              <Text style={styles.pickerTitle}>Select CPT Code</Text>
              <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                {CPT_SUGGESTIONS.map(cpt => (
                  <Pressable
                    key={cpt.code}
                    onPress={() => addCptFromSuggestion(cpt)}
                    style={({ pressed }) => [styles.pickerRow, pressed && { opacity: 0.7 }]}
                  >
                    <Text style={styles.pickerCode}>{cpt.code}</Text>
                    <Text style={styles.pickerDesc} numberOfLines={1}>{cpt.description}</Text>
                    <Text style={styles.pickerCharge}>${cpt.charge.toFixed(2)}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={styles.divider} />
              <Text style={styles.pickerSubTitle}>Or add custom CPT</Text>
              <View style={styles.customRow}>
                <TextInput
                  style={[styles.customInput, { width: 80 }]}
                  value={customCptCode}
                  onChangeText={setCustomCptCode}
                  placeholder="Code"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="characters"
                />
                <TextInput
                  style={[styles.customInput, { flex: 1 }]}
                  value={customCptDesc}
                  onChangeText={setCustomCptDesc}
                  placeholder="Description"
                  placeholderTextColor={Colors.textMuted}
                />
                <TextInput
                  style={[styles.customInput, { width: 70 }]}
                  value={customCptCharge}
                  onChangeText={setCustomCptCharge}
                  placeholder="$0.00"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.pickerBtnRow}>
                <Pressable style={styles.pickerAddBtn} onPress={addCustomCpt}>
                  <Text style={styles.pickerAddText}>Add Custom</Text>
                </Pressable>
                <Pressable style={styles.pickerCancelBtn} onPress={() => setShowCptPicker(false)}>
                  <Text style={styles.pickerCancelText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {editCptCodes.length === 0 ? (
            <View style={[styles.card, { alignItems: 'center', paddingVertical: 20 }]}>
              <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm }}>No CPT codes. Add at least one.</Text>
            </View>
          ) : (
            editCptCodes.map((cpt) => (
              <View key={cpt.code} style={styles.cptEditCard}>
                <View style={styles.cptEditTop}>
                  <Text style={styles.cptEditCode}>{cpt.code}</Text>
                  <Text style={styles.cptEditDesc} numberOfLines={1}>{cpt.description}</Text>
                  <Pressable onPress={() => removeCpt(cpt.code)} hitSlop={8}>
                    <MaterialIcons name="delete-outline" size={20} color={Colors.danger} />
                  </Pressable>
                </View>
                <View style={styles.cptEditFields}>
                  <View style={styles.cptEditField}>
                    <Text style={styles.editFieldLabel}>Units</Text>
                    <TextInput
                      style={styles.editFieldInput}
                      value={String(cpt.units)}
                      onChangeText={v => updateCptField(cpt.code, 'units', v)}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={styles.cptEditField}>
                    <Text style={styles.editFieldLabel}>Charge ($)</Text>
                    <TextInput
                      style={styles.editFieldInput}
                      value={String(cpt.charge)}
                      onChangeText={v => updateCptField(cpt.code, 'charge', v)}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.cptEditField}>
                    <Text style={styles.editFieldLabel}>Modifier</Text>
                    <TextInput
                      style={styles.editFieldInput}
                      value={cpt.modifier ?? ''}
                      onChangeText={v => updateCptField(cpt.code, 'modifier', v)}
                      placeholder="e.g. 25"
                      placeholderTextColor={Colors.textMuted}
                      autoCapitalize="characters"
                      maxLength={2}
                    />
                  </View>
                </View>
                <Text style={styles.cptLineTotal}>
                  Line Total: <Text style={{ fontWeight: '800', color: Colors.primary }}>${(cpt.charge * cpt.units).toFixed(2)}</Text>
                </Text>
              </View>
            ))
          )}

          {/* Running Total */}
          <View style={styles.totalBanner}>
            <Text style={styles.totalBannerLabel}>Total Charge</Text>
            <Text style={styles.totalBannerValue}>${editTotalCharge.toFixed(2)}</Text>
          </View>

          {/* ICD-10 Codes */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>ICD-10 Diagnosis Codes</Text>
            <Pressable
              style={styles.addCodeBtn}
              onPress={() => { setShowIcdPicker(true); setShowCptPicker(false); }}
            >
              <MaterialIcons name="add" size={16} color={Colors.primary} />
              <Text style={styles.addCodeText}>Add ICD</Text>
            </Pressable>
          </View>

          {/* ICD Picker */}
          {showIcdPicker ? (
            <View style={styles.pickerCard}>
              <Text style={styles.pickerTitle}>Select ICD-10 Code</Text>
              <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                {ICD10_SUGGESTIONS.map(icd => (
                  <Pressable
                    key={icd.code}
                    onPress={() => addIcdFromSuggestion(icd)}
                    style={({ pressed }) => [styles.pickerRow, pressed && { opacity: 0.7 }]}
                  >
                    <Text style={styles.pickerCode}>{icd.code}</Text>
                    <Text style={[styles.pickerDesc, { flex: 1 }]} numberOfLines={1}>{icd.description}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={styles.divider} />
              <Text style={styles.pickerSubTitle}>Or add custom ICD-10</Text>
              <View style={styles.customRow}>
                <TextInput
                  style={[styles.customInput, { flex: 1 }]}
                  value={customIcd}
                  onChangeText={setCustomIcd}
                  placeholder="e.g. Z00.00"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="characters"
                />
                <Pressable style={styles.pickerAddBtn} onPress={addCustomIcd}>
                  <Text style={styles.pickerAddText}>Add</Text>
                </Pressable>
              </View>
              <Pressable
                style={[styles.pickerCancelBtn, { marginTop: 6 }]}
                onPress={() => setShowIcdPicker(false)}
              >
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.card}>
            {editIcdCodes.length === 0 ? (
              <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', paddingVertical: 8 }}>
                No ICD-10 codes added.
              </Text>
            ) : (
              <View style={styles.icdEditWrap}>
                {editIcdCodes.map(code => (
                  <View key={code} style={styles.icdEditChip}>
                    <Text style={styles.icdEditText}>{code}</Text>
                    <Pressable onPress={() => removeIcd(code)} hitSlop={6}>
                      <MaterialIcons name="close" size={14} color={Colors.primaryDark} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Save & Cancel */}
          <Pressable style={styles.saveLargeBtn} onPress={handleSaveEdits}>
            <MaterialIcons name="save" size={18} color="#fff" />
            <Text style={styles.saveLargeText}>Save Changes</Text>
          </Pressable>
          <Pressable style={styles.cancelLargeBtn} onPress={handleCancelEdit}>
            <Text style={styles.cancelLargeText}>Cancel</Text>
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ===== VIEW MODE =====
  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Claim Detail</Text>
        <Pressable
          onPress={() => setIsEditing(true)}
          style={styles.editHdrBtn}
          hitSlop={8}
        >
          <MaterialIcons name="edit" size={18} color="#fff" />
          <Text style={styles.editHdrText}>Edit</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Claim Identity */}
        <View style={styles.claimHeader}>
          <View style={styles.claimHeaderLeft}>
            <Text style={styles.claimNum}>{claim.claimNumber}</Text>
            <StatusBadge status={claim.status} />
          </View>
          <Text style={styles.totalCharge}>${claim.totalCharge.toFixed(2)}</Text>
        </View>

        {/* Denial Alert */}
        {claim.denialReason ? (
          <View style={styles.denialAlert}>
            <MaterialIcons name="error" size={18} color={Colors.danger} />
            <View style={{ flex: 1 }}>
              <Text style={styles.denialTitle}>Denial Reason</Text>
              <Text style={styles.denialText}>{claim.denialReason}</Text>
            </View>
          </View>
        ) : null}

        {/* Patient & Provider */}
        <Text style={styles.sectionTitle}>Patient & Provider</Text>
        <View style={styles.card}>
          {[
            { icon: 'person', label: 'Patient', value: claim.patientName },
            { icon: 'medical-services', label: 'Provider', value: claim.providerName },
            { icon: 'business', label: 'Insurance', value: claim.insuranceCompany },
            { icon: 'event', label: 'DOS', value: claim.dos },
            ...(claim.submittedDate ? [{ icon: 'send', label: 'Submitted', value: claim.submittedDate }] : []),
          ].map(row => (
            <View key={row.label} style={styles.infoRow}>
              <MaterialIcons name={row.icon as any} size={16} color={Colors.textMuted} />
              <View>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CPT Codes */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>CPT Codes</Text>
          <Pressable
            style={styles.addCodeBtn}
            onPress={() => setIsEditing(true)}
          >
            <MaterialIcons name="edit" size={14} color={Colors.primary} />
            <Text style={styles.addCodeText}>Edit</Text>
          </Pressable>
        </View>
        <View style={styles.card}>
          {claim.cptCodes.map((cpt, i) => (
            <View key={i} style={[styles.cptRow, i < claim.cptCodes.length - 1 && styles.cptBorder]}>
              <View style={styles.cptLeft}>
                <Text style={styles.cptCode}>{cpt.code}</Text>
                {cpt.modifier ? <Text style={styles.cptModifier}>Mod: {cpt.modifier}</Text> : null}
                <Text style={styles.cptDesc}>{cpt.description}</Text>
                <Text style={styles.cptUnits}>Units: {cpt.units}</Text>
              </View>
              <Text style={styles.cptCharge}>${cpt.charge.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* ICD-10 Codes */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>ICD-10 Diagnosis Codes</Text>
          <Pressable style={styles.addCodeBtn} onPress={() => setIsEditing(true)}>
            <MaterialIcons name="edit" size={14} color={Colors.primary} />
            <Text style={styles.addCodeText}>Edit</Text>
          </Pressable>
        </View>
        <View style={styles.card}>
          <View style={styles.icdWrap}>
            {claim.icdCodes.map(code => (
              <View key={code} style={styles.icdChip}>
                <Text style={styles.icdText}>{code}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Financials */}
        <Text style={styles.sectionTitle}>Financial Summary</Text>
        <View style={styles.card}>
          {[
            { label: 'Total Charge', value: `$${claim.totalCharge.toFixed(2)}`, color: Colors.textPrimary },
            { label: 'Allowed Amount', value: claim.allowedAmount > 0 ? `$${claim.allowedAmount.toFixed(2)}` : '—', color: Colors.textPrimary },
            { label: 'Insurance Paid', value: `$${claim.paidAmount.toFixed(2)}`, color: Colors.success },
            { label: 'Adjustments', value: `$${claim.adjustments.toFixed(2)}`, color: Colors.textSecondary },
            { label: 'Patient Balance', value: `$${claim.patientBalance.toFixed(2)}`, color: claim.patientBalance > 0 ? Colors.warning : Colors.textPrimary },
          ].map(row => (
            <View key={row.label} style={styles.finRow}>
              <Text style={styles.finLabel}>{row.label}</Text>
              <Text style={[styles.finValue, { color: row.color }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {claim.status === 'Draft' ? (
            <Pressable onPress={handleSubmit} style={styles.submitBtn}>
              <MaterialIcons name="send" size={18} color="#fff" />
              <Text style={styles.submitText}>Submit Claim</Text>
            </Pressable>
          ) : null}
          {claim.status === 'Denied' ? (
            <Pressable onPress={handleResubmit} style={[styles.submitBtn, { backgroundColor: Colors.warning }]}>
              <MaterialIcons name="replay" size={18} color="#fff" />
              <Text style={styles.submitText}>Resubmit Claim</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={styles.editFullBtn}
            onPress={() => setIsEditing(true)}
          >
            <MaterialIcons name="edit" size={18} color={Colors.primary} />
            <Text style={styles.editFullText}>Edit Charge / Codes</Text>
          </Pressable>
          <Pressable
            onPress={() => showAlert('Post Payment', 'Payment posting screen coming with backend integration.')}
            style={styles.secondaryBtn}
          >
            <MaterialIcons name="attach-money" size={18} color={Colors.primary} />
            <Text style={styles.secondaryText}>Post Payment</Text>
          </Pressable>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
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
  saveHdrBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  saveHdrText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },
  editHdrBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(59,130,246,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  editHdrText: { fontSize: FontSize.sm, fontWeight: '600', color: '#fff' },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.sm },

  // Edit mode
  editBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  editBannerText: { fontSize: FontSize.sm, color: Colors.primaryDark, fontWeight: '500' },

  providerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  providerOptionActive: { backgroundColor: Colors.primaryLight, marginHorizontal: -Spacing.md, paddingHorizontal: Spacing.md },
  providerDot: { width: 12, height: 12, borderRadius: 6 },
  providerOptionName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  providerOptionSpec: { fontSize: FontSize.xs, color: Colors.textMuted },

  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  addCodeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full,
  },
  addCodeText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.primary },

  pickerCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.md, borderWidth: 1, borderColor: Colors.border },
  pickerTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  pickerScroll: { maxHeight: 180 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  pickerCode: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary, width: 60 },
  pickerDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, flex: 1 },
  pickerCharge: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  pickerSubTitle: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textMuted, marginTop: 8, marginBottom: 6 },
  customRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  customInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: FontSize.sm, color: Colors.textPrimary,
    backgroundColor: Colors.surfaceAlt,
  },
  pickerBtnRow: { flexDirection: 'row', gap: 8 },
  pickerAddBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 10, alignItems: 'center' },
  pickerAddText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },
  pickerCancelBtn: { flex: 1, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  pickerCancelText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: 10 },

  cptEditCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: 8, ...Shadow.sm, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  cptEditTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cptEditCode: { fontSize: FontSize.md, fontWeight: '800', color: Colors.primary },
  cptEditDesc: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary },
  cptEditFields: { flexDirection: 'row', gap: 8 },
  cptEditField: { flex: 1 },
  editFieldLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textMuted, marginBottom: 4 },
  editFieldInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: FontSize.sm, color: Colors.textPrimary,
    backgroundColor: Colors.surfaceAlt,
  },
  cptLineTotal: { fontSize: FontSize.xs, color: Colors.textMuted },

  totalBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.navBg, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.md,
  },
  totalBannerLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)' },
  totalBannerValue: { fontSize: FontSize.xxl, fontWeight: '800', color: '#fff' },

  icdEditWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  icdEditChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full,
  },
  icdEditText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primaryDark },

  saveLargeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 16, gap: 8, marginTop: 8,
    ...Shadow.md,
  },
  saveLargeText: { fontSize: FontSize.base, fontWeight: '700', color: '#fff' },
  cancelLargeBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt, borderRadius: Radius.lg, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  cancelLargeText: { fontSize: FontSize.base, fontWeight: '600', color: Colors.textSecondary },

  // View mode
  claimHeader: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadow.sm,
  },
  claimHeaderLeft: { gap: 6 },
  claimNum: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  totalCharge: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  denialAlert: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
  },
  denialTitle: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.danger, marginBottom: 2 },
  denialText: { fontSize: FontSize.sm, color: Colors.danger },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginTop: 6 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: 10, ...Shadow.sm },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  infoValue: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textPrimary },
  cptRow: { gap: 4, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cptBorder: { borderBottomWidth: 1, borderBottomColor: Colors.divider, marginBottom: 10 },
  cptLeft: { flex: 1 },
  cptCode: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  cptModifier: { fontSize: FontSize.xs, color: Colors.textMuted },
  cptDesc: { fontSize: FontSize.sm, color: Colors.textPrimary },
  cptUnits: { fontSize: FontSize.xs, color: Colors.textMuted },
  cptCharge: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  icdWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  icdChip: { backgroundColor: Colors.primaryLight, paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full },
  icdText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primaryDark },
  finRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  finLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  finValue: { fontSize: FontSize.sm, fontWeight: '700' },
  actions: { gap: 10, marginTop: 8 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    gap: 8,
  },
  submitText: { fontSize: FontSize.base, fontWeight: '700', color: '#fff' },
  editFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  editFullText: { fontSize: FontSize.base, fontWeight: '600', color: Colors.primary },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryText: { fontSize: FontSize.base, fontWeight: '600', color: Colors.primary },
});
