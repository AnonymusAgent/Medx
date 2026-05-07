import React, { useState, useEffect, useCallback } from 'react';
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
import { getSupabaseClient } from '@/template';
import { CPT_SUGGESTIONS, ICD10_SUGGESTIONS, CPTCode } from '@/constants/mockData';

interface SOAPNote {
  id?: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  visitDate: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  suggestedCpt: CPTCode[];
  suggestedIcd: string[];
  status: 'Draft' | 'Signed';
}

const ASSESSMENT_KEYWORDS: Record<string, string[]> = {
  'I10': ['hypertension', 'blood pressure', 'htn'],
  'E11.9': ['diabetes', 'diabetic', 'blood sugar', 'a1c'],
  'M54.5': ['back pain', 'low back', 'lumbar'],
  'J06.9': ['respiratory', 'cold', 'upper respiratory', 'sinus'],
  'J18.9': ['pneumonia', 'lung infection'],
  'I25.10': ['coronary', 'chest pain', 'cardiac', 'heart disease'],
  'I48.0': ['atrial fibrillation', 'a-fib', 'afib', 'irregular heartbeat'],
};

const CPT_KEYWORDS: Record<string, string[]> = {
  '99213': ['follow-up', 'established', 'low complexity', 'routine'],
  '99214': ['moderate', 'chronic', 'management'],
  '99215': ['complex', 'high complexity', 'multiple problems'],
  '93000': ['ekg', 'ecg', 'electrocardiogram'],
  '85025': ['cbc', 'blood count', 'complete blood'],
};

function suggestCodesFromText(text: string): { icd: string[]; cpt: string[] } {
  const lower = text.toLowerCase();
  const icd: string[] = [];
  const cpt: string[] = [];

  Object.entries(ASSESSMENT_KEYWORDS).forEach(([code, keywords]) => {
    if (keywords.some(k => lower.includes(k))) {
      if (!icd.includes(code)) icd.push(code);
    }
  });

  Object.entries(CPT_KEYWORDS).forEach(([code, keywords]) => {
    if (keywords.some(k => lower.includes(k))) {
      if (!cpt.includes(code)) cpt.push(code);
    }
  });

  return { icd, cpt };
}

export default function SOAPNotesScreen() {
  const { appointmentId, patientId, patientName, providerId, providerName, visitDate } =
    useLocalSearchParams<{
      appointmentId?: string;
      patientId?: string;
      patientName?: string;
      providerId?: string;
      providerName?: string;
      visitDate?: string;
    }>();

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useApp();
  const { showAlert } = useAlert();

  const [noteId, setNoteId] = useState<string | undefined>();
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [suggestedIcd, setSuggestedIcd] = useState<string[]>([]);
  const [suggestedCpt, setSuggestedCpt] = useState<string[]>([]);
  const [selectedIcd, setSelectedIcd] = useState<string[]>([]);
  const [selectedCpt, setSelectedCpt] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [noteStatus, setNoteStatus] = useState<'Draft' | 'Signed'>('Draft');
  const [activeSection, setActiveSection] = useState<string>('subjective');

  const db = getSupabaseClient();

  useEffect(() => {
    loadExistingNote();
  }, [appointmentId]);

  const loadExistingNote = async () => {
    if (!appointmentId) { setLoading(false); return; }
    try {
      const { data } = await db
        .from('soap_notes')
        .select('*')
        .eq('appointment_id', appointmentId)
        .single();
      if (data) {
        setNoteId(data.id);
        setSubjective(data.subjective ?? '');
        setObjective(data.objective ?? '');
        setAssessment(data.assessment ?? '');
        setPlan(data.plan ?? '');
        setSelectedIcd(data.suggested_icd ?? []);
        setSelectedCpt((data.suggested_cpt ?? []).map((c: CPTCode) => c.code));
        setNoteStatus(data.status ?? 'Draft');
      }
    } catch (_) {}
    setLoading(false);
  };

  // Auto-suggest codes when assessment changes
  useEffect(() => {
    if (assessment.length > 10) {
      const { icd, cpt } = suggestCodesFromText(assessment);
      setSuggestedIcd(icd);
      setSuggestedCpt(cpt);
    }
  }, [assessment]);

  const toggleIcd = (code: string) => {
    setSelectedIcd(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const toggleCpt = (code: string) => {
    setSelectedCpt(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleSave = async (sign = false) => {
    const finalStatus = sign ? 'Signed' : 'Draft';
    setSaving(true);
    try {
      const cptObjects = selectedCpt
        .map(code => CPT_SUGGESTIONS.find(c => c.code === code))
        .filter(Boolean)
        .map(c => ({ code: c!.code, description: c!.description, units: 1, charge: c!.charge }));

      const row = {
        appointment_id: appointmentId ?? '',
        patient_id: patientId ?? '',
        patient_name: patientName ?? '',
        provider_id: providerId ?? currentUser.id,
        provider_name: providerName ?? currentUser.name,
        visit_date: visitDate ?? new Date().toISOString().slice(0, 10),
        subjective,
        objective,
        assessment,
        plan,
        suggested_cpt: cptObjects,
        suggested_icd: selectedIcd,
        status: finalStatus,
        updated_at: new Date().toISOString(),
      };

      if (noteId) {
        await db.from('soap_notes').update(row).eq('id', noteId);
      } else {
        const { data } = await db.from('soap_notes').insert(row).select().single();
        if (data) setNoteId(data.id);
      }

      setNoteStatus(finalStatus);
      showAlert(
        sign ? 'Note Signed' : 'Note Saved',
        sign
          ? 'SOAP note has been signed and locked.'
          : 'Draft saved. Continue editing when ready.',
        [{ text: 'OK', onPress: sign ? () => router.back() : undefined }]
      );
    } finally {
      setSaving(false);
    }
  };

  const SECTIONS = [
    {
      key: 'subjective',
      label: 'Subjective',
      icon: 'person',
      color: Colors.primary,
      value: subjective,
      onChange: setSubjective,
      placeholder: "Patient's chief complaint, history of present illness, review of systems...",
      hint: 'What the patient reports',
    },
    {
      key: 'objective',
      label: 'Objective',
      icon: 'biotech',
      color: Colors.info,
      value: objective,
      onChange: setObjective,
      placeholder: 'Vital signs, physical examination findings, lab results, imaging...',
      hint: 'What you observe and measure',
    },
    {
      key: 'assessment',
      label: 'Assessment',
      icon: 'psychology',
      color: Colors.warning,
      value: assessment,
      onChange: setAssessment,
      placeholder: 'Diagnosis, clinical impression, differential diagnoses...',
      hint: 'Clinical interpretation — codes auto-suggested below',
    },
    {
      key: 'plan',
      label: 'Plan',
      icon: 'assignment',
      color: Colors.success,
      value: plan,
      onChange: setPlan,
      placeholder: 'Treatment plan, medications, referrals, follow-up instructions...',
      hint: 'What you will do next',
    },
  ];

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

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
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>SOAP Note</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {patientName} · {visitDate}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: noteStatus === 'Signed' ? Colors.success + '30' : Colors.warning + '30' }]}>
          <MaterialIcons
            name={noteStatus === 'Signed' ? 'lock' : 'edit'}
            size={12}
            color={noteStatus === 'Signed' ? Colors.success : Colors.warning}
          />
          <Text style={[styles.statusBadgeText, { color: noteStatus === 'Signed' ? Colors.success : Colors.warning }]}>
            {noteStatus}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Patient Banner */}
        <View style={styles.patientBanner}>
          <View style={styles.patientAvatar}>
            <Text style={styles.patientAvatarText}>
              {(patientName ?? 'P').split(' ').map(n => n[0]).join('').slice(0, 2)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.patientBannerName}>{patientName}</Text>
            <Text style={styles.patientBannerSub}>
              {providerName} · Visit: {visitDate}
            </Text>
          </View>
          {noteStatus === 'Signed' && (
            <View style={styles.lockedBadge}>
              <MaterialIcons name="verified" size={14} color={Colors.success} />
              <Text style={styles.lockedText}>Signed</Text>
            </View>
          )}
        </View>

        {/* SOAP Sections */}
        {SECTIONS.map(sec => (
          <View key={sec.key} style={styles.soapSection}>
            <Pressable
              style={[styles.soapHeader, { borderLeftColor: sec.color }]}
              onPress={() => setActiveSection(activeSection === sec.key ? '' : sec.key)}
            >
              <View style={[styles.soapIconWrap, { backgroundColor: sec.color + '20' }]}>
                <MaterialIcons name={sec.icon as any} size={18} color={sec.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.soapLabel, { color: sec.color }]}>{sec.label}</Text>
                <Text style={styles.soapHint}>{sec.hint}</Text>
              </View>
              <MaterialIcons
                name={activeSection === sec.key ? 'expand-less' : 'expand-more'}
                size={22}
                color={Colors.textMuted}
              />
            </Pressable>
            {activeSection === sec.key && (
              <TextInput
                style={[
                  styles.soapInput,
                  { borderColor: sec.color + '60' },
                  noteStatus === 'Signed' && styles.soapInputLocked,
                ]}
                value={sec.value}
                onChangeText={sec.onChange}
                placeholder={sec.placeholder}
                placeholderTextColor={Colors.textMuted}
                multiline
                textAlignVertical="top"
                editable={noteStatus !== 'Signed'}
                minHeight={120}
              />
            )}
            {sec.value.trim() && activeSection !== sec.key && (
              <Text style={styles.soapPreview} numberOfLines={2}>{sec.value}</Text>
            )}
          </View>
        ))}

        {/* Code Suggestions */}
        {(suggestedIcd.length > 0 || suggestedCpt.length > 0) && (
          <View style={styles.codeSection}>
            <View style={styles.codeSectionHeader}>
              <MaterialIcons name="auto-awesome" size={16} color={Colors.primary} />
              <Text style={styles.codeSectionTitle}>Auto-Suggested Codes</Text>
              <Text style={styles.codeSectionHint}>Based on Assessment text</Text>
            </View>

            {suggestedIcd.length > 0 && (
              <>
                <Text style={styles.codeGroupLabel}>ICD-10 Diagnosis Codes</Text>
                <View style={styles.codeChips}>
                  {suggestedIcd.map(code => {
                    const info = ICD10_SUGGESTIONS.find(i => i.code === code);
                    const selected = selectedIcd.includes(code);
                    return (
                      <Pressable
                        key={code}
                        style={[styles.codeChip, selected && styles.codeChipSelected]}
                        onPress={() => toggleIcd(code)}
                        disabled={noteStatus === 'Signed'}
                      >
                        <Text style={[styles.codeChipCode, selected && { color: '#fff' }]}>{code}</Text>
                        <Text style={[styles.codeChipDesc, selected && { color: 'rgba(255,255,255,0.85)' }]} numberOfLines={1}>
                          {info?.description ?? ''}
                        </Text>
                        <MaterialIcons
                          name={selected ? 'check-circle' : 'add-circle-outline'}
                          size={14}
                          color={selected ? '#fff' : Colors.primary}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {suggestedCpt.length > 0 && (
              <>
                <Text style={styles.codeGroupLabel}>CPT Procedure Codes</Text>
                <View style={styles.codeChips}>
                  {suggestedCpt.map(code => {
                    const info = CPT_SUGGESTIONS.find(c => c.code === code);
                    const selected = selectedCpt.includes(code);
                    return (
                      <Pressable
                        key={code}
                        style={[styles.codeChip, selected && styles.codeChipCptSelected]}
                        onPress={() => toggleCpt(code)}
                        disabled={noteStatus === 'Signed'}
                      >
                        <Text style={[styles.codeChipCode, selected && { color: '#fff' }]}>{code}</Text>
                        <Text style={[styles.codeChipDesc, selected && { color: 'rgba(255,255,255,0.85)' }]} numberOfLines={1}>
                          {info?.description ?? ''}{info ? ` · $${info.charge}` : ''}
                        </Text>
                        <MaterialIcons
                          name={selected ? 'check-circle' : 'add-circle-outline'}
                          size={14}
                          color={selected ? '#fff' : Colors.success}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        )}

        {/* Selected Codes Summary */}
        {(selectedIcd.length > 0 || selectedCpt.length > 0) && (
          <View style={styles.selectedCodes}>
            <Text style={styles.selectedCodesTitle}>Selected for Claim</Text>
            <View style={styles.selectedCodeRow}>
              {selectedIcd.map(code => (
                <View key={code} style={styles.selectedCodeBadge}>
                  <Text style={styles.selectedCodeBadgeText}>{code}</Text>
                  {noteStatus !== 'Signed' && (
                    <Pressable onPress={() => toggleIcd(code)} hitSlop={4}>
                      <MaterialIcons name="close" size={12} color={Colors.info} />
                    </Pressable>
                  )}
                </View>
              ))}
              {selectedCpt.map(code => (
                <View key={code} style={[styles.selectedCodeBadge, { backgroundColor: Colors.successLight }]}>
                  <Text style={[styles.selectedCodeBadgeText, { color: Colors.success }]}>{code}</Text>
                  {noteStatus !== 'Signed' && (
                    <Pressable onPress={() => toggleCpt(code)} hitSlop={4}>
                      <MaterialIcons name="close" size={12} color={Colors.success} />
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Actions */}
        {noteStatus !== 'Signed' && (
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={() => handleSave(false)}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <MaterialIcons name="save" size={18} color={Colors.primary} />
                  <Text style={styles.saveBtnText}>Save Draft</Text>
                </>
              )}
            </Pressable>
            <Pressable
              style={[styles.signBtn, saving && { opacity: 0.6 }]}
              onPress={() =>
                showAlert('Sign & Lock Note', 'Signing will lock this note. Continue?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Sign Note', onPress: () => handleSave(true) },
                ])
              }
              disabled={saving}
            >
              <MaterialIcons name="verified" size={18} color="#fff" />
              <Text style={styles.signBtnText}>Sign & Lock</Text>
            </Pressable>
          </View>
        )}

        {noteStatus === 'Signed' && (
          <View style={styles.signedBanner}>
            <MaterialIcons name="lock" size={20} color={Colors.success} />
            <Text style={styles.signedText}>
              This note is signed and locked. Contact admin to make amendments.
            </Text>
          </View>
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
    gap: 12,
  },
  headerTitle: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },

  scroll: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.sm },

  patientBanner: {
    backgroundColor: Colors.navBg, borderRadius: Radius.lg, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  patientAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  patientAvatarText: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },
  patientBannerName: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },
  patientBannerSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  lockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.successLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  lockedText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.success },

  soapSection: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm,
  },
  soapHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: Spacing.md,
    borderLeftWidth: 4,
  },
  soapIconWrap: { width: 36, height: 36, borderRadius: Radius.sm, justifyContent: 'center', alignItems: 'center' },
  soapLabel: { fontSize: FontSize.md, fontWeight: '700' },
  soapHint: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  soapInput: {
    borderWidth: 1, borderRadius: Radius.md, margin: Spacing.sm,
    padding: Spacing.sm, fontSize: FontSize.sm, color: Colors.textPrimary,
    backgroundColor: Colors.surfaceAlt, lineHeight: 22,
  },
  soapInputLocked: { backgroundColor: Colors.divider, color: Colors.textMuted },
  soapPreview: {
    fontSize: FontSize.sm, color: Colors.textSecondary, paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm, fontStyle: 'italic', lineHeight: 20,
  },

  codeSection: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
    gap: 10, ...Shadow.sm, borderTopWidth: 2, borderTopColor: Colors.primary + '40',
  },
  codeSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  codeSectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  codeSectionHint: { fontSize: FontSize.xs, color: Colors.textMuted },
  codeGroupLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  codeChips: { gap: 6 },
  codeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10,
    backgroundColor: Colors.primaryLight, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  codeChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  codeChipCptSelected: { backgroundColor: Colors.success, borderColor: Colors.success },
  codeChipCode: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.primary, width: 52 },
  codeChipDesc: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary },

  selectedCodes: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: 8, ...Shadow.sm,
  },
  selectedCodesTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  selectedCodeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  selectedCodeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.infoLight,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full,
  },
  selectedCodeBadgeText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.info },

  actionRow: { flexDirection: 'row', gap: 12 },
  saveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primaryLight, borderRadius: Radius.lg, paddingVertical: 16, gap: 8,
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  saveBtnText: { fontSize: FontSize.base, fontWeight: '700', color: Colors.primary },
  signBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.success, borderRadius: Radius.lg, paddingVertical: 16, gap: 8, ...Shadow.md,
  },
  signBtnText: { fontSize: FontSize.base, fontWeight: '700', color: '#fff' },

  signedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.successLight,
    borderRadius: Radius.lg, padding: Spacing.md,
  },
  signedText: { flex: 1, fontSize: FontSize.sm, color: Colors.success, fontWeight: '500', lineHeight: 20 },
});
