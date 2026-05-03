import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { Header, ClaimCard, SearchBar } from '@/components';
import { useApp } from '@/hooks/useApp';
import { ClaimStatus } from '@/constants/mockData';

const STATUS_FILTERS: (ClaimStatus | 'All')[] = ['All', 'Draft', 'Pending', 'Submitted', 'Paid', 'Denied', 'Partial'];

export default function BillingScreen() {
  const router = useRouter();
  const { claims, currentUser } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | 'All'>('All');

  const canEdit = currentUser.role !== 'Provider';

  const filtered = useMemo(() => {
    let list = claims;
    if (statusFilter !== 'All') list = list.filter(c => c.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        c =>
          c.patientName.toLowerCase().includes(q) ||
          c.claimNumber.toLowerCase().includes(q) ||
          c.insuranceCompany.toLowerCase().includes(q)
      );
    }
    return list;
  }, [claims, search, statusFilter]);

  const totalCharged = filtered.reduce((s, c) => s + c.totalCharge, 0);
  const totalPaid = filtered.reduce((s, c) => s + c.paidAmount, 0);
  const deniedCount = claims.filter(c => c.status === 'Denied').length;

  return (
    <View style={styles.root}>
      <Header
        title="Medical Billing"
        subtitle="Claims & Revenue Cycle"
        rightAction={canEdit ? { icon: 'add', label: 'New Claim', onPress: () => router.push('/new-claim') } : undefined}
      />

      <View style={styles.toolbar}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search patient, claim #, insurer..." />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Pressable
          style={[styles.qaBtn, { backgroundColor: Colors.success + '15', borderColor: Colors.success + '40' }]}
          onPress={() => router.push('/payment-posting')}
        >
          <View style={[styles.qaIcon, { backgroundColor: Colors.success }]}>
            <Text style={styles.qaIconText}>$</Text>
          </View>
          <Text style={[styles.qaLabel, { color: Colors.success }]}>Post{'\n'}Payment</Text>
        </Pressable>
        <Pressable
          style={[styles.qaBtn, { backgroundColor: Colors.warning + '15', borderColor: Colors.warning + '40' }]}
          onPress={() => router.push('/ar-followup')}
        >
          <View style={[styles.qaIcon, { backgroundColor: Colors.warning }]}>
            <Text style={styles.qaIconText}>{deniedCount}</Text>
          </View>
          <Text style={[styles.qaLabel, { color: Colors.warning }]}>AR{'\n'}Follow-up</Text>
        </Pressable>
        <Pressable
          style={[styles.qaBtn, { backgroundColor: Colors.info + '15', borderColor: Colors.info + '40' }]}
          onPress={() => router.push('/eligibility')}
        >
          <View style={[styles.qaIcon, { backgroundColor: Colors.info }]}>
            <Text style={styles.qaIconText}>✓</Text>
          </View>
          <Text style={[styles.qaLabel, { color: Colors.info }]}>Eligibility{'\n'}Check</Text>
        </Pressable>
        <Pressable
          style={[styles.qaBtn, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '40' }]}
          onPress={() => router.push('/new-claim')}
        >
          <View style={[styles.qaIcon, { backgroundColor: Colors.primary }]}>
            <Text style={styles.qaIconText}>+</Text>
          </View>
          <Text style={[styles.qaLabel, { color: Colors.primary }]}>New{'\n'}Claim</Text>
        </Pressable>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Charged</Text>
          <Text style={styles.summaryValue}>${totalCharged.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Paid</Text>
          <Text style={[styles.summaryValue, { color: Colors.success }]}>${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Claims</Text>
          <Text style={styles.summaryValue}>{filtered.length}</Text>
        </View>
      </View>

      {/* Status Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {STATUS_FILTERS.map(s => (
          <Pressable
            key={s}
            onPress={() => setStatusFilter(s)}
            style={[styles.chip, statusFilter === s && styles.chipActive]}
          >
            <Text style={[styles.chipText, statusFilter === s && styles.chipTextActive]}>{s}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No claims found</Text>
            <Text style={styles.emptySub}>Adjust your filters or create a new claim</Text>
          </View>
        ) : (
          filtered.map(c => (
            <ClaimCard
              key={c.id}
              claim={c}
              onPress={() => router.push({ pathname: '/claim-detail', params: { id: c.id } })}
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
  toolbar: { backgroundColor: Colors.navBg, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },

  quickActions: {
    flexDirection: 'row', gap: 10, paddingHorizontal: Spacing.md, paddingVertical: 12,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  qaBtn: {
    flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10,
    borderRadius: Radius.lg, borderWidth: 1,
  },
  qaIcon: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  qaIconText: { fontSize: FontSize.sm, fontWeight: '800', color: '#fff' },
  qaLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center', lineHeight: 14 },

  summary: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 3 },
  summaryValue: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  summaryDivider: { width: 1, height: 30, backgroundColor: Colors.divider },
  filterScroll: { flexGrow: 0, marginTop: Spacing.sm },
  filterContent: { paddingHorizontal: Spacing.md, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  scroll: { flex: 1 },
  content: { padding: Spacing.md },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySub: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4 },
});
