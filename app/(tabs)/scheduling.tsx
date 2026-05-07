
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { Header, AppointmentCard } from '@/components';
import { useApp } from '@/hooks/useApp';
import { MOCK_PROVIDERS } from '@/constants/mockData';
import { useAlert } from '@/template';
import { useRouter } from 'expo-router';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekDates(baseDate: Date) {
  const result: Date[] = [];
  const start = new Date(baseDate);
  start.setDate(baseDate.getDate() - baseDate.getDay());
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    result.push(d);
  }
  return result;
}

function toISO(d: Date) {
  return d.toISOString().split('T')[0];
}

export default function SchedulingScreen() {
  const { appointments } = useApp();
  const { showAlert } = useAlert();
  const router = useRouter();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(toISO(today));
  const [providerFilter, setProviderFilter] = useState('All');
  const weekDates = getWeekDates(today);

  const dayApts = useMemo(() => {
    let list = appointments.filter(a => a.date === selectedDate);
    if (providerFilter !== 'All') list = list.filter(a => a.providerId === providerFilter);
    return list.sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDate, providerFilter]);

  const stats = {
    scheduled: dayApts.filter(a => a.status === 'Scheduled').length,
    checkedIn: dayApts.filter(a => a.status === 'Checked In').length,
    completed: dayApts.filter(a => a.status === 'Completed').length,
  };

  return (
    <View style={styles.root}>
      <Header
        title="Schedule"
        subtitle="Appointment Calendar"
        rightAction={{
          icon: 'add',
          label: 'Book',
          onPress: () => showAlert('Book Appointment', 'Appointment booking form coming soon'),
        }}
      />

      {/* Week Strip */}
      <View style={styles.weekStrip}>
        {weekDates.map((d) => {
          const iso = toISO(d);
          const isSelected = iso === selectedDate;
          const isToday = iso === toISO(today);
          const hasPts = appointments.some(a => a.date === iso);
          return (
            <Pressable
              key={iso}
              onPress={() => setSelectedDate(iso)}
              style={[styles.dayBtn, isSelected && styles.dayBtnActive]}
            >
              <Text style={[styles.dayName, isSelected && styles.dayTextActive]}>{DAYS[d.getDay()]}</Text>
              <Text style={[styles.dayNum, isSelected && styles.dayTextActive, isToday && !isSelected && styles.todayNum]}>
                {d.getDate()}
              </Text>
              {hasPts ? <View style={[styles.dayDot, { backgroundColor: isSelected ? '#fff' : Colors.primary }]} /> : <View style={styles.dayDot} />}
            </Pressable>
          );
        })}
      </View>

      {/* Provider Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.providerScroll}
        contentContainerStyle={styles.providerContent}
      >
        <Pressable
          onPress={() => setProviderFilter('All')}
          style={[styles.providerChip, providerFilter === 'All' && styles.providerChipActive]}
        >
          <Text style={[styles.providerChipText, providerFilter === 'All' && styles.providerChipTextActive]}>All Providers</Text>
        </Pressable>
        {MOCK_PROVIDERS.map(p => (
          <Pressable
            key={p.id}
            onPress={() => setProviderFilter(p.id)}
            style={[styles.providerChip, providerFilter === p.id && styles.providerChipActive, providerFilter === p.id && { borderColor: p.color }]}
          >
            <View style={[styles.providerDot, { backgroundColor: p.color }]} />
            <Text style={[styles.providerChipText, providerFilter === p.id && styles.providerChipTextActive]}>
              {p.name.replace('Dr. ', '')}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Day Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: Colors.primary }]}>{stats.scheduled}</Text>
          <Text style={styles.statLabel}>Scheduled</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: Colors.success }]}>{stats.checkedIn}</Text>
          <Text style={styles.statLabel}>Checked In</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: Colors.textMuted }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: Colors.textPrimary }]}>{dayApts.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {dayApts.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="event-busy" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No appointments</Text>
            <Text style={styles.emptySub}>No appointments scheduled for this day</Text>
          </View>
        ) : (
          dayApts.map(apt => (
            <AppointmentCard
              key={apt.id}
              appointment={apt}
              onPress={() => showAlert(
                apt.patientName,
                `${apt.type} · ${apt.time} · ${apt.providerName}\nRoom: ${apt.room ?? 'TBD'}`,
                [
                  { text: 'SOAP Note', onPress: () => router.push({ pathname: '/soap-notes', params: { appointmentId: apt.id, patientId: apt.patientId, patientName: apt.patientName, providerId: apt.providerId, providerName: apt.providerName, visitDate: apt.date } }) },
                  { text: 'Dismiss', style: 'cancel' },
                ]
              )}
            />
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  weekStrip: {
    backgroundColor: Colors.navBg,
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  dayBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Radius.md,
    gap: 3,
  },
  dayBtnActive: { backgroundColor: Colors.primary },
  dayName: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.5)' },
  dayNum: { fontSize: FontSize.md, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  dayTextActive: { color: '#fff' },
  todayNum: { color: Colors.navActive },
  dayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'transparent' },
  providerScroll: { flexGrow: 0, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  providerContent: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: 8 },
  providerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 5,
  },
  providerChipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  providerDot: { width: 8, height: 8, borderRadius: 4 },
  providerChipText: { fontSize: FontSize.xs, fontWeight: '500', color: Colors.textSecondary },
  providerChipTextActive: { color: Colors.primary },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: FontSize.xl, fontWeight: '800' },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  scroll: { flex: 1 },
  content: { padding: Spacing.md },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySub: { fontSize: FontSize.sm, color: Colors.textMuted },
});
