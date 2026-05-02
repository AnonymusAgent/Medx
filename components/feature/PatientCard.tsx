import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import StatusBadge from '@/components/ui/StatusBadge';
import { Patient } from '@/constants/mockData';

interface Props {
  patient: Patient;
  onPress: () => void;
}

function getInitials(first: string, last: string) {
  return `${first[0]}${last[0]}`.toUpperCase();
}

const AVATAR_COLORS = ['#1A56DB', '#0E9F6E', '#E02424', '#FF8800', '#0694A2', '#7C3AED'];
function avatarColor(id: string) {
  const i = id.charCodeAt(id.length - 1) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}

export default function PatientCard({ patient, onPress }: Props) {
  const age = new Date().getFullYear() - new Date(patient.dob).getFullYear();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.avatar, { backgroundColor: avatarColor(patient.id) }]}>
        <Text style={styles.avatarText}>{getInitials(patient.firstName, patient.lastName)}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.name}>{patient.firstName} {patient.lastName}</Text>
          <StatusBadge status={patient.status} size="sm" />
        </View>
        <Text style={styles.meta}>
          {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'} · {age} yrs · DOB: {patient.dob}
        </Text>
        <View style={styles.row}>
          <Text style={styles.insurance}>{patient.primaryInsurance.company}</Text>
          {patient.balance > 0 ? (
            <Text style={styles.balance}>Bal: ${patient.balance.toFixed(2)}</Text>
          ) : null}
        </View>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  info: { flex: 1, gap: 3 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  meta: { fontSize: FontSize.xs, color: Colors.textSecondary },
  insurance: { fontSize: FontSize.xs, color: Colors.textMuted },
  balance: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.danger },
});
