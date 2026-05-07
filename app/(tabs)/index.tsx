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
  { icon: 'cancel' as const, label: 'Denials', route: '/denial-management' },
  { icon: 'assignment' as const, label: 'AR Follow-up', route: '/ar-followup' },
];

// ─── Provider Dashboard ─────────────────────────────────────────────────────────
function ProviderDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser, appointments, claims } = useApp();
  const today = new Date().toISOString().split('T')[0];

  const myAppointments = appointments
    .filter(a => a.providerId === currentUser.id || a.providerName === currentUser.name)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

  const todayApts = myAppointments.filter(a => a.date === today);
  const myClaims = claims.filter(c => c.providerId === currentUser.id || c.providerName === currentUser.name);
  const myPaidClaims = myClaims.filter(c => c.status === 'Paid');
  const totalCharged = myClaims.reduce((s, c) => s + c.totalCharge, 0);
  const totalPaid = myClaims.reduce((s, c) => s + c.paidAmount, 0);
  const collectionRate = totalCharged > 0 ? Math.round((totalPaid / totalCharged) * 100) : 0;

  const getTimeGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{getTimeGreeting()},</Text>
          <Text style={styles.userName}>{currentUser.name}</Text>
          <View style={styles.rolePill}>
            <MaterialIcons name="medical-services" size={11} color="#60A5FA" />
            <Text style={styles.roleText}>Provider Dashboard · {currentUser.practiceName}</Text>
          </View>
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{currentUser.avatar}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Today's Stat Strip */}
        <View style={styles.statStrip}>
          {[
            { label: "Today's Appts", value: String(todayApts.length), color: Colors.primary },
            { label: 'Scheduled', value: String(todayApts.filter(a => a.status === 'Scheduled').length), color: Colors.info },
            { label: 'Completed', value: String(todayApts.filter(a => a.status === 'Completed').length), color: Colors.success },
            { label: 'Collection', value: `${collectionRate}%`, color: Colors.warning },
          ].map((s, i, arr) => (
            <React.Fragment key={s.label}>
              <View style={styles.statStripItem}>
                <Text style={[styles.statStripVal, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statStripLabel}>{s.label}</Text>
              </View>
              {i < arr.length - 1 && <View style={styles.statStripDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Today's Schedule */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <Pressable onPress={() => router.push('/(tabs)/scheduling')}>
            <Text style={styles.viewAll}>Full Calendar</Text>
          </Pressable>
        </View>

        {todayApts.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="event-available" size={36} color={Colors.textMuted} />
            <Text style={styles.emptyCardText}>No appointments scheduled for today</Text>
          </View>
        ) : (
          todayApts.map(apt => (
            <Pressable
              key={apt.id}
              style={styles.aptCard}
              onPress={() => router.push({
                pathname: '/soap-notes',
                params: {
                  appointmentId: apt.id,
                  patientId: apt.patientId,
                  patientName: apt.patientName,
                  providerId: apt.providerId,
                  providerName: apt.providerName,
                  visitDate: apt.date,
                },
              })}
            >
              <View style={[styles.aptTimeBox, {
                backgroundColor: apt.status === 'Completed' ? Colors.successLight :
                  apt.status === 'Checked In' ? Colors.primaryLight : Colors.navBg,
              }]}>
                <Text style={[styles.aptTimeText, {
                  color: apt.status === 'Completed' ? Colors.success :
                    apt.status === 'Checked In' ? Colors.primary : '#fff',
                }]}>{apt.time}</Text>
              </View>
              <View style={styles.aptInfo}>
                <Text style={styles.aptPatient}>{apt.patientName}</Text>
                <Text style={styles.aptType}>{apt.type} · {apt.room ?? 'TBD'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <View style={[styles.aptStatusBadge, {
                  backgroundColor: apt.status === 'Completed' ? Colors.successLight :
                    apt.status === 'Checked In' ? Colors.primaryLight : Colors.surfaceAlt
                }]}>
                  <Text style={[styles.aptStatusText, {
                    color: apt.status === 'Completed' ? Colors.success :
                      apt.status === 'Checked In' ? Colors.primary : Colors.textMuted
                  }]}>{apt.status}</Text>
                </View>
                <View style={styles.soapNoteBtn}>
                  <MaterialIcons name="note-add" size={12} color={Colors.primary} />
                  <Text style={styles.soapNoteBtnText}>SOAP Note</Text>
                </View>
              </View>
            </Pressable>
          ))
        )}

        {/* Clinical Metrics */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>My Performance</Text>
        <View style={styles.metricsRow}>
          <MetricCard
            label="My Claims"
            value={String(myClaims.length)}
            icon="receipt-long"
            iconColor={Colors.primary}
            iconBg={Colors.primaryLight}
          />
          <MetricCard
            label="Collection Rate"
            value={`${collectionRate}%`}
            icon="trending-up"
            iconColor={Colors.success}
            iconBg={Colors.successLight}
            trend={{ value: collectionRate >= 85 ? 'On target' : 'Below target', positive: collectionRate >= 85 }}
          />
        </View>

        {/* Recent Claims (read-only) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Claims</Text>
          <Pressable onPress={() => router.push('/(tabs)/billing')}>
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        </View>
        {myClaims.slice(0, 3).map(c => (
          <View key={c.id} style={styles.claimRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.claimPatient}>{c.patientName}</Text>
              <Text style={styles.claimMeta}>{c.claimNumber} · {c.dos}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={styles.claimAmount}>${c.totalCharge.toFixed(2)}</Text>
              <View style={[styles.claimStatusBadge, {
                backgroundColor: c.status === 'Paid' ? Colors.successLight :
                  c.status === 'Denied' ? Colors.dangerLight : Colors.warningLight
              }]}>
                <Text style={[styles.claimStatusText, {
                  color: c.status === 'Paid' ? Colors.success :
                    c.status === 'Denied' ? Colors.danger : Colors.warning
                }]}>{c.status}</Text>
              </View>
            </View>
          </View>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

// ─── Full Admin/Biller Dashboard ────────────────────────────────────────────────
export default function DashboardScreen() {
  const { currentUser, claims, appointments } = useApp();

  if (currentUser.role === 'Provider') {
    return <ProviderDashboard />;
  }

  return <AdminBillerDashboard />;
}

function AdminBillerDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser, claims, appointments } = useApp();
  const today = new Date().toISOString().split('T')[0];
  const todayApts = appointments.filter(a => a.date === today);
  const deniedClaims = claims.filter(c => c.status === 'Denied');
  const pendingClaims = claims.filter(c => c.status === 'Pending' || c.status === 'Submitted');

  // Notifications (derived from app state)
  const notifications = [
    ...deniedClaims.slice(0, 2).map(c => ({
      id: c.id,
      type: 'denial' as const,
      message: `Claim ${c.claimNumber} denied — ${c.denialReason?.slice(0, 40) ?? 'No reason given'}`,
      time: 'Today',
    })),
    ...pendingClaims.slice(0, 1).map(c => ({
      id: c.id + '_pending',
      type: 'pending' as const,
      message: `Claim ${c.claimNumber} awaiting payment from ${c.insuranceCompany}`,
      time: 'Today',
    })),
    {
      id: 'ar_alert',
      type: 'ar' as const,
      message: `${claims.filter(c => ['Submitted', 'Denied', 'Partial', 'Pending'].includes(c.status)).length} claims require AR follow-up`,
      time: 'Now',
    },
  ];

  const [showNotifs, setShowNotifs] = useState(false);
  const unreadCount = notifications.length;

  const getTimeGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View>
          <Text style={styles.greeting}>{getTimeGreeting()},</Text>
          <Text style={styles.userName}>{currentUser.name}</Text>
          <View style={styles.rolePill}>
            <MaterialIcons name="shield" size={11} color="#60A5FA" />
            <Text style={styles.roleText}>{currentUser.role} · {currentUser.practiceName}</Text>
          </View>
        </View>
        <Pressable style={styles.notifBtn} onPress={() => setShowNotifs(v => !v)}>
          <MaterialIcons name="notifications" size={22} color="#fff" />
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Notification Dropdown */}
      {showNotifs && (
        <View style={styles.notifDropdown}>
          <View style={styles.notifDropdownHeader}>
            <Text style={styles.notifDropdownTitle}>Notifications</Text>
            <Pressable onPress={() => setShowNotifs(false)}>
              <MaterialIcons name="close" size={18} color={Colors.textMuted} />
            </Pressable>
          </View>
          {notifications.length === 0 ? (
            <Text style={styles.notifEmpty}>No new notifications</Text>
          ) : (
            notifications.map(n => (
              <Pressable
                key={n.id}
                style={styles.notifItem}
                onPress={() => {
                  setShowNotifs(false);
                  if (n.type === 'denial') router.push('/denial-management');
                  else if (n.type === 'ar') router.push('/ar-followup');
                  else router.push('/(tabs)/billing');
                }}
              >
                <View style={[styles.notifIcon, {
                  backgroundColor: n.type === 'denial' ? Colors.dangerLight :
                    n.type === 'pending' ? Colors.warningLight : Colors.infoLight,
                }]}>
                  <MaterialIcons
                    name={n.type === 'denial' ? 'cancel' : n.type === 'pending' ? 'pending' : 'schedule'}
                    size={14}
                    color={n.type === 'denial' ? Colors.danger : n.type === 'pending' ? Colors.warning : Colors.info}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifText} numberOfLines={2}>{n.message}</Text>
                  <Text style={styles.notifTime}>{n.time}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={16} color={Colors.textMuted} />
              </Pressable>
            ))
          )}
        </View>
      )}

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
              onPress={() => router.push(a.route as any)}
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
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4,
    backgroundColor: 'rgba(59,130,246,0.15)', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full, alignSelf: 'flex-start',
  },
  roleText: { fontSize: FontSize.xs, color: '#93C5FD', fontWeight: '500' },
  notifBtn: { position: 'relative', padding: 8 },
  notifBadge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: Colors.danger, borderRadius: 8, minWidth: 16, height: 16,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.navBg,
  },
  notifBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  notifDropdown: {
    position: 'absolute', top: 0, right: 0, left: 0, zIndex: 100,
    backgroundColor: Colors.surface, ...Shadow.lg,
    borderBottomLeftRadius: Radius.lg, borderBottomRightRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  notifDropdownHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  notifDropdownTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  notifEmpty: { padding: Spacing.md, color: Colors.textMuted, textAlign: 'center', fontSize: FontSize.sm },
  notifItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  notifIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  notifText: { fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 18 },
  notifTime: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  avatarCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },

  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, gap: Spacing.sm },

  statStrip: {
    backgroundColor: Colors.navBg, borderRadius: Radius.lg, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center',
  },
  statStripItem: { flex: 1, alignItems: 'center' },
  statStripVal: { fontSize: FontSize.xxl, fontWeight: '800' },
  statStripLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  statStripDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.1)' },

  emptyCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl,
    alignItems: 'center', gap: 8, ...Shadow.sm,
  },
  emptyCardText: { fontSize: FontSize.sm, color: Colors.textMuted },

  aptCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.sm, marginBottom: 8, gap: Spacing.sm, ...Shadow.sm,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  aptTimeBox: {
    paddingHorizontal: 8, paddingVertical: 6, borderRadius: Radius.sm, minWidth: 72, alignItems: 'center',
  },
  soapNoteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.primaryLight, paddingHorizontal: 6, paddingVertical: 3, borderRadius: Radius.full,
  },
  soapNoteBtnText: { fontSize: 10, fontWeight: '600', color: Colors.primary },

  claimRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: 6, ...Shadow.sm,
  },
  claimPatient: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  claimMeta: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  claimAmount: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  claimStatusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full },
  claimStatusText: { fontSize: 10, fontWeight: '700' },

  revenueBanner: {
    backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, ...Shadow.md,
  },
  bannerLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  bannerValue: { fontSize: FontSize.hero, fontWeight: '800', color: '#fff' },
  bannerSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  collectionCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  collectionPct: { fontSize: FontSize.lg, fontWeight: '800', color: '#fff' },
  collectionLabel: { fontSize: 9, color: 'rgba(255,255,255,0.7)' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginTop: 8, marginBottom: 4 },
  viewAll: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '500' },
  quickGrid: { flexDirection: 'row', gap: Spacing.sm },
  quickBtn: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.sm, alignItems: 'center', gap: 6, ...Shadow.sm,
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
  quickIcon: {
    width: 44, height: 44, borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center',
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
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.md, padding: Spacing.sm, marginBottom: 6, gap: Spacing.sm, ...Shadow.sm,
  },
  aptTime: { backgroundColor: Colors.navBg, paddingHorizontal: 8, paddingVertical: 6, borderRadius: Radius.sm },
  aptTimeText: { fontSize: FontSize.xs, fontWeight: '700', color: '#fff' },
  aptInfo: { flex: 1 },
  aptPatient: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  aptProvider: { fontSize: FontSize.xs, color: Colors.textMuted },
  aptType: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  aptStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  aptStatusText: { fontSize: FontSize.xs, fontWeight: '600' },
  aptStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
});
