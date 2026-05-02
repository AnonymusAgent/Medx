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

interface FormData {
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
  insuranceCompany: string;
  memberId: string;
  groupNumber: string;
}

const GENDERS: ('M' | 'F' | 'Other')[] = ['M', 'F', 'Other'];
const GENDER_LABELS = { M: 'Male', F: 'Female', Other: 'Other' };

export default function AddPatientScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addPatient } = useApp();
  const { showAlert } = useAlert();

  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    dob: '',
    gender: 'M',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    insuranceCompany: '',
    memberId: '',
    groupNumber: '',
  });

  const set = (key: keyof FormData) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.dob.trim()) {
      showAlert('Validation Error', 'First name, last name, and date of birth are required.');
      return;
    }
    const id = `pt${Date.now()}`;
    addPatient({
      id,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      dob: form.dob.trim(),
      gender: form.gender,
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      zip: form.zip.trim(),
      ssn: '***-**-0000',
      balance: 0,
      lastVisit: '',
      providerId: 'p1',
      status: 'Active',
      primaryInsurance: {
        company: form.insuranceCompany.trim() || 'Self-Pay',
        memberId: form.memberId.trim() || 'N/A',
        groupNumber: form.groupNumber.trim() || 'N/A',
        planType: 'Other',
        copay: 0,
        deductible: 0,
        eligibilityStatus: 'Pending',
      },
    });
    showAlert('Patient Added', `${form.firstName} ${form.lastName} has been registered successfully.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="close" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Register Patient</Text>
        <Pressable onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Save</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Demographics */}
        <Text style={styles.sectionTitle}>Demographics</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput style={styles.input} value={form.firstName} onChangeText={set('firstName')} placeholder="First name" placeholderTextColor={Colors.textMuted} />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput style={styles.input} value={form.lastName} onChangeText={set('lastName')} placeholder="Last name" placeholderTextColor={Colors.textMuted} />
            </View>
          </View>

          <Text style={styles.label}>Date of Birth * (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} value={form.dob} onChangeText={set('dob')} placeholder="1990-01-15" placeholderTextColor={Colors.textMuted} />

          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            {GENDERS.map(g => (
              <Pressable
                key={g}
                onPress={() => setForm(f => ({ ...f, gender: g }))}
                style={[styles.genderBtn, form.gender === g && styles.genderActive]}
              >
                <Text style={[styles.genderText, form.gender === g && styles.genderTextActive]}>{GENDER_LABELS[g]}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Contact */}
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} value={form.phone} onChangeText={set('phone')} placeholder="(555) 000-0000" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={form.email} onChangeText={set('email')} placeholder="patient@email.com" placeholderTextColor={Colors.textMuted} keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.label}>Street Address</Text>
          <TextInput style={styles.input} value={form.address} onChangeText={set('address')} placeholder="123 Main Street" placeholderTextColor={Colors.textMuted} />

          <View style={styles.row}>
            <View style={{ flex: 2 }}>
              <Text style={styles.label}>City</Text>
              <TextInput style={styles.input} value={form.city} onChangeText={set('city')} placeholder="Houston" placeholderTextColor={Colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>State</Text>
              <TextInput style={styles.input} value={form.state} onChangeText={set('state')} placeholder="TX" placeholderTextColor={Colors.textMuted} autoCapitalize="characters" maxLength={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>ZIP</Text>
              <TextInput style={styles.input} value={form.zip} onChangeText={set('zip')} placeholder="77001" placeholderTextColor={Colors.textMuted} keyboardType="numeric" maxLength={5} />
            </View>
          </View>
        </View>

        {/* Insurance */}
        <Text style={styles.sectionTitle}>Primary Insurance</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Insurance Company</Text>
          <TextInput style={styles.input} value={form.insuranceCompany} onChangeText={set('insuranceCompany')} placeholder="BlueCross BlueShield" placeholderTextColor={Colors.textMuted} />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Member ID</Text>
              <TextInput style={styles.input} value={form.memberId} onChangeText={set('memberId')} placeholder="XMJ234567" placeholderTextColor={Colors.textMuted} autoCapitalize="characters" />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Group #</Text>
              <TextInput style={styles.input} value={form.groupNumber} onChangeText={set('groupNumber')} placeholder="GRP-55201" placeholderTextColor={Colors.textMuted} />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <Pressable onPress={handleSave} style={styles.saveBtnLarge}>
          <MaterialIcons name="person-add" size={20} color="#fff" />
          <Text style={styles.saveBtnLargeText}>Register Patient</Text>
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
  saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  saveBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginTop: 8 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: 10, ...Shadow.sm },
  row: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  label: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
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
  genderRow: { flexDirection: 'row', gap: 8 },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
  },
  genderActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  genderText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  genderTextActive: { color: '#fff' },
  saveBtnLarge: {
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
  saveBtnLargeText: { fontSize: FontSize.base, fontWeight: '700', color: '#fff' },
});
