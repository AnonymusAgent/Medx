import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import StatusBadge from '@/components/ui/StatusBadge';
import { Appointment, MOCK_PROVIDERS } from '@/constants/mockData';

interface Props {
  appointment: Appointment;
  onPress?: () => void;
}

export default function AppointmentCard({ appointment, onPress }: Props) {
  const provider = MOCK_PROVIDERS.find(p => p.id === appointment.providerId);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.timeLine, { backgroundColor: provider?.color || Colors.primary }]} />
      <View style={styles.body}>
        <View style={styles.top}>
          <View>
            <Text style={styles.time}>{appointment.time}</Text>
            <Text style={styles.duration}>{appointment.duration} min</Text>
          </View>
          <StatusBadge status={appointment.status} size="sm" />
        </View>
        <Text style={styles.patient}>{appointment.patientName}</Text>
        <View style={styles.row}>
          <MaterialIcons name="person" size={12} color={Colors.textMuted} />
          <Text style={styles.meta}>{appointment.providerName}</Text>
          {appointment.room ? (
            <>
              <MaterialIcons name="meeting-room" size={12} color={Colors.textMuted} />
              <Text style={styles.meta}>{appointment.room}</Text>
            </>
          ) : null}
        </View>
        <View style={styles.typePill}>
          <Text style={styles.typeText}>{appointment.type}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  pressed: { opacity: 0.85 },
  timeLine: { width: 4, borderTopLeftRadius: Radius.lg, borderBottomLeftRadius: Radius.lg },
  body: { flex: 1, padding: Spacing.md, gap: 3 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  time: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  duration: { fontSize: FontSize.xs, color: Colors.textMuted },
  patient: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: FontSize.xs, color: Colors.textMuted, marginRight: 6 },
  typePill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  typeText: { fontSize: FontSize.xs, color: Colors.primaryDark, fontWeight: '500' },
});
