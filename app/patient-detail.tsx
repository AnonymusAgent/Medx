import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { StatusBadge, ClaimCard } from '@/components';
import { useApp } from '@/hooks/useApp';

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { patients, claims } = useApp();

  const patient = patients.find(p => p.id === id);
  const patientClaims = claims.filter(c => c.patientId === id);

  if (!patient) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Text style={{ color: Colors.textPrimary, padding: 20 }}>Patient not found.</Text>
      </View>
    );
  }

  const age = new Date().getFullYear() - new Date(patient.dob).getFullYear();

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Patient Record</Text>
        <Pressable style={styles.editBtn} hitSlop={8}>
          <MaterialIcons name="edit" size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Patient Identity */}
        <View style={styles.identityCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>
              {patient.firstName[0]}{patient.lastName[0]}
            </Text>
          </View>
          <View style={styles.identityInfo}>
            <Text style={styles.patientName}>{patient.firstName} {patient.lastName}</Text>
            <Text style={styles.patientSub}>{patient.gender === 'M' ? 'Male' : 'Female'} · {age} yrs · DOB: {patient.dob}</Text>
            <View style={{ marginTop: 4 }}>
              <StatusBadge status={patient.status} />
            </View>
          </View>
        </View>

        {/* Balance */}
        {patient.balance > 0 ? (
          <View style={styles.balanceAlert}>
            <MaterialIcons name="account-balance-wallet" size={18} color={Colors.danger} />
            <Text style={styles.balanceText}>Outstanding Balance: <Text style={{ fontWeight: '700' }}>${patient.balance.toFixed(2)}</Text></Text>
          </View>
        ) : null}

        {/* Contact */}
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.infoCard}>
          {[
            { icon: 'phone', label: 'Phone', value: patient.phone },
            { icon: 'email', label: 'Email', value: patient.email },
            { icon: 'home', label: 'Address', value: `${patient.address}, ${patient.city}, ${patient.state} ${patient.zip}` },
            { icon: 'badge', label: 'SSN', value: patient.ssn },
          ].map(row => (
            <View key={row.label} style={styles.infoRow}>
              <MaterialIcons name={row.icon as any} size={16} color={Colors.textMuted} />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Primary Insurance */}
        <Text style={styles.sectionTitle}>Primary Insurance</Text>
        <View style={styles.infoCard}>
          <View style={styles.insHeader}>
            <Text style={styles.insName}>{patient.primaryInsurance.company}</Text>
            <StatusBadge status={patient.primaryInsurance.eligibilityStatus} size="sm" />
          </View>
          <View style={styles.insGrid}>
            <View style={styles.insCell}>
              <Text style={styles.insLabel}>Member ID</Text>
              <Text style={styles.insValue}>{patient.primaryInsurance.memberId}</Text>
            </View>
            <View style={styles.insCell}>
              <Text style={styles.insLabel}>Group #</Text>
              <Text style={styles.insValue}>{patient.primaryInsurance.groupNumber}</Text>
            </View>
            <View style={styles.insCell}>
              <Text style={styles.insLabel}>Plan Type</Text>
              <Text style={styles.insValue}>{patient.primaryInsurance.planType}</Text>
            </View>
            <View style={styles.insCell}>
              <Text style={styles.insLabel}>Copay</Text>
              <Text style={styles.insValue}>${patient.primaryInsurance.copay}</Text>
            </View>
            <View style={styles.insCell}>
              <Text style={styles.insLabel}>Deductible</Text>
              <Text style={styles.insValue}>${patient.primaryInsurance.deductible.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Secondary Insurance */}
        {patient.secondaryInsurance ? (
          <>
            <Text style={styles.sectionTitle}>Secondary Insurance</Text>
            <View style={styles.infoCard}>
              <View style={styles.insHeader}>
                <Text style={styles.insName}>{patient.secondaryInsurance.company}</Text>
                <StatusBadge status={patient.secondaryInsurance.eligibilityStatus} size="sm" />
              </View>
              <View style={styles.insGrid}>
                <View style={styles.insCell}>
                  <Text style={styles.insLabel}>Member ID</Text>
                  <Text style={styles.insValue}>{patient.secondaryInsurance.memberId}</Text>
                </View>
                <View style={styles.insCell}>
                  <Text style={styles.insLabel}>Plan</Text>
                  <Text style={styles.insValue}>{patient.secondaryInsurance.planType}</Text>
                </View>
              </View>
            </View>
          </>
        ) : null}

        {/* Claims History */}
        <Text style={styles.sectionTitle}>Claims History ({patientClaims.length})</Text>
        {patientClaims.length === 0 ? (
          <View style={styles.noClaims}>
            <Text style={styles.noClaimsText}>No claims found for this patient.</Text>
          </View>
        ) : (
          patientClaims.map(c => (
            <ClaimCard
              key={c.id}
              claim={c}
              onPress={() => router.push({ pathname: '/claim-detail', params: { id: c.id } })}
            />
          ))
        )}

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
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700', color: '#fff' },
  editBtn: { padding: 4, backgroundColor: Colors.primary, borderRadius: 8, padding: 8 } as any,
  scroll: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.sm },
  identityCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.sm,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: FontSize.xl, fontWeight: '700', color: '#fff' },
  identityInfo: { flex: 1 },
  patientName: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  patientSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  balanceAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
  },
  balanceText: { fontSize: FontSize.sm, color: Colors.danger },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginTop: 8 },
  infoCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: 10, ...Shadow.sm },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoText: { flex: 1 },
  infoLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  infoValue: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '500' },
  insHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  insName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  insGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  insCell: { minWidth: '45%' },
  insLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  insValue: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textPrimary },
  noClaims: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center' },
  noClaimsText: { color: Colors.textMuted, fontSize: FontSize.sm },
});
