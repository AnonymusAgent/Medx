import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { MetricCard } from '@/components';
import { useApp } from '@/hooks/useApp';
import { DASHBOARD_METRICS, AR_AGING } from '@/constants/mockData';

const QUICK_ACTIONS = [
  { icon: 'person-add' as const, label: 'Add Patient', route: '/add-patient' },
  { icon: 'receipt-long' as const, label: 'New Claim', route: '/new-claim' },
  { icon: 'verified-user' as const, label: 'Verify Eligibility', route: null },
  { icon: 'assignment' as const, label: 'AR Follow-up', route: null },
];

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser, claims, appointments } = useApp();
  const today = new Date().toISOString().split('T')[0];
  const todayApts = appointments.filter(a => a.date === today);
  const deniedClaims = claims.filter(c => c.status === 'Denied');
  const pendingClaims = claims.filter(c => c.status === 'Pending' || c.status === 'Submitted');

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.userName}>{currentUser.name}</Text>
          <View style={styles.rolePill}>
            <MaterialIcons name="shield" size={11} color="#60A5FA" />
            <Text style={styles.roleText}>{currentUser.role} · {currentUser.practiceName}</Text>
          </View>
        </View>
        <View style={styles.notifBtn}>
          <MaterialIcons name="notifications" size={22} color="#fff" />
          <View style={styles.notifDot} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Revenue Banner */}
        <View style={styles.revenueBanner}>
          <View>
            <Text style={styles.bannerLabel}>Monthly Revenue Collected</Text>
            <Text style={styles.bannerValue}>${DASHBOARD_METRICS.paymentsThisMonth.toLocaleString()}</Text>
            <Text style={styles.bannerSub}>
              ${DASHBOARD_METRICS.chargesThisMonth.toLocaleString()} charged · {DASHBOARD_METRICS.collectionRate}% collection rate
            </Text>
          </View>
          <View style={styles.collectionCircle}>
            <Text style={styles.collectionPct}>{DASHBOARD_METRICS.collectionRate}%</Text>
            <Text style={styles.collectionLabel}>Collected</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((a) => (
            <Pressable
              key={a.label}
              style={({ pressed }) => [styles.quickBtn, pressed && styles.pressed]}
              onPress={() => a.route ? router.push(a.route as any) : null}
            >
              <View style={styles.quickIcon}>
                <MaterialIcons name={a.icon} size={22} color={Colors.primary} />
              </View>
              <Text style={styles.quickLabel}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Key Metrics */}
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsRow}>
          <MetricCard
            label="Pending Claims"
            value={String(pendingClaims.length)}
            icon="pending-actions"
            iconColor={Colors.warning}
            iconBg={Colors.warningLight}
            trend={{ value: '3%', positive: false }}
          />
          <MetricCard
            label="Denials"
            value={String(deniedClaims.length)}
            icon="cancel"
            iconColor={Colors.danger}
            iconBg={Colors.dangerLight}
            trend={{ value: `${DASHBOARD_METRICS.denialRate}%`, positive: false }}
          />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard
            label="Today's Appointments"
            value={String(DASHBOARD_METRICS.todayAppointments)}
            icon="event-available"
            iconColor={Colors.success}
            iconBg={Colors.successLight}
          />
          <MetricCard
            label="Avg Days to Pay"
            value={`${DASHBOARD_METRICS.avgDaysToPayment}d`}
            icon="schedule"
            iconColor={Colors.info}
            iconBg={Colors.infoLight}
            trend={{ value: '2d', positive: true }}
          />
        </View>
        <MetricCard
          label="AR Over 90 Days"
          value={`$${DASHBOARD_METRICS.arOver90.toLocaleString()}`}
          subtitle={`${DASHBOARD_METRICS.totalPatients.toLocaleString()} total patients enrolled`}
          icon="warning"
          iconColor={Colors.danger}
          iconBg={Colors.dangerLight}
          fullWidth
        />

        {/* AR Aging */}
        <Text style={styles.sectionTitle}>AR Aging Summary</Text>
        <View style={styles.agingCard}>
          {AR_AGING.map((row) => (
            <View key={row.bucket} style={styles.agingRow}>
              <View style={styles.agingLeft}>
                <Text style={styles.agingBucket}>{row.bucket}</Text>
                <Text style={styles.agingCount}>{row.count} claims</Text>
              </View>
              <View style={styles.agingBarWrap}>
                <View style={[styles.agingBar, { width: `${row.percentage}%` as any, backgroundColor: getAgingColor(row.bucket) }]} />
              </View>
              <Text style={styles.agingAmount}>${(row.amount / 1000).toFixed(1)}k</Text>
            </View>
          ))}
        </View>

        {/* Today's Appointments */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <Pressable onPress={() => router.push('/(tabs)/scheduling')}>
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        </View>
        {todayApts.slice(0, 3).map(apt => (
          <View key={apt.id} style={styles.aptRow}>
            <View style={styles.aptTime}>
              <Text style={styles.aptTimeText}>{apt.time}</Text>
            </View>
            <View style={styles.aptInfo}>
              <Text style={styles.aptPatient}>{apt.patientName}</Text>
              <Text style={styles.aptProvider}>{apt.providerName} · {apt.type}</Text>
            </View>
            <View style={[styles.aptStatus, { backgroundColor: apt.status === 'Checked In' ? Colors.successLight : Colors.primaryLight }]}>
              <Text style={[styles.aptStatusText, { color: apt.status === 'Checked In' ? Colors.success : Colors.primary }]}>
                {apt.status}
              </Text>
            </View>
          </View>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function getAgingColor(bucket: string) {
  if (bucket.includes('0-30')) return Colors.success;
  if (bucket.includes('31-60')) return Colors.info;
  if (bucket.includes('61-90')) return Colors.warning;
  return Colors.danger;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.navBg,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  greeting: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.5)' },
  userName: { fontSize: FontSize.xl, fontWeight: '700', color: '#fff', marginTop: 1 },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: 'rgba(59,130,246,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  roleText: { fontSize: FontSize.xs, color: '#93C5FD', fontWeight: '500' },
  notifBtn: { position: 'relative', padding: 8 },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
    borderWidth: 1.5,
    borderColor: Colors.navBg,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, gap: Spacing.sm },
  revenueBanner: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    ...Shadow.md,
  },
  bannerLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  bannerValue: { fontSize: FontSize.hero, fontWeight: '800', color: '#fff' },
  bannerSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  collectionCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  collectionPct: { fontSize: FontSize.lg, fontWeight: '800', color: '#fff' },
  collectionLabel: { fontSize: 9, color: 'rgba(255,255,255,0.7)' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginTop: 8, marginBottom: 4 },
  viewAll: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '500' },
  quickGrid: { flexDirection: 'row', gap: Spacing.sm },
  quickBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 6,
    ...Shadow.sm,
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  metricsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  agingCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: 10, ...Shadow.sm },
  agingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  agingLeft: { width: 80 },
  agingBucket: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textPrimary },
  agingCount: { fontSize: 10, color: Colors.textMuted },
  agingBarWrap: { flex: 1, height: 8, backgroundColor: Colors.divider, borderRadius: 4, overflow: 'hidden' },
  agingBar: { height: 8, borderRadius: 4 },
  agingAmount: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textPrimary, width: 40, textAlign: 'right' },
  aptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: 6,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  aptTime: { backgroundColor: Colors.navBg, paddingHorizontal: 8, paddingVertical: 6, borderRadius: Radius.sm },
  aptTimeText: { fontSize: FontSize.xs, fontWeight: '700', color: '#fff' },
  aptInfo: { flex: 1 },
  aptPatient: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  aptProvider: { fontSize: FontSize.xs, color: Colors.textMuted },
  aptStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  aptStatusText: { fontSize: FontSize.xs, fontWeight: '600' },
});
