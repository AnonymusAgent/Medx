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
import { Header, PatientCard, SearchBar } from '@/components';
import { useApp } from '@/hooks/useApp';

const FILTERS = ['All', 'Active', 'Inactive'];

export default function PatientsScreen() {
  const router = useRouter();
  const { patients } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = useMemo(() => {
    let list = patients;
    if (filter !== 'All') list = list.filter(p => p.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        p =>
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.primaryInsurance.memberId.toLowerCase().includes(q)
      );
    }
    return list;
  }, [patients, filter, search]);

  return (
    <View style={styles.root}>
      <Header
        title="Patients"
        subtitle={`${patients.length} total registered`}
        rightAction={{ icon: 'person-add', label: 'Add', onPress: () => router.push('/add-patient') }}
      />
      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search name, ID, member ID..." />
        </View>
        <View style={styles.filters}>
          {FILTERS.map(f => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterBtn, filter === f && styles.filterActive]}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No patients found</Text>
            <Text style={styles.emptySub}>Try adjusting your search or filter</Text>
          </View>
        ) : (
          filtered.map(p => (
            <PatientCard
              key={p.id}
              patient={p}
              onPress={() => router.push({ pathname: '/patient-detail', params: { id: p.id } })}
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
  toolbar: { backgroundColor: Colors.navBg, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.sm },
  searchWrap: {},
  filters: { flexDirection: 'row', gap: 8 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  filterActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  scroll: { flex: 1 },
  content: { padding: Spacing.md },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySub: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4 },
});
