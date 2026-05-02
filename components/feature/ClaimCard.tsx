import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import StatusBadge from '@/components/ui/StatusBadge';
import { Claim } from '@/constants/mockData';

interface Props {
  claim: Claim;
  onPress: () => void;
}

export default function ClaimCard({ claim, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.top}>
        <View style={styles.leftTop}>
          <Text style={styles.claimNum}>{claim.claimNumber}</Text>
          <StatusBadge status={claim.status} size="sm" />
        </View>
        <Text style={styles.charge}>${claim.totalCharge.toFixed(2)}</Text>
      </View>

      <Text style={styles.patient}>{claim.patientName}</Text>
      <Text style={styles.meta}>{claim.insuranceCompany} · DOS: {claim.dos}</Text>

      {claim.denialReason ? (
        <View style={styles.denialRow}>
          <MaterialIcons name="error-outline" size={13} color={Colors.danger} />
          <Text style={styles.denialText} numberOfLines={1}>{claim.denialReason}</Text>
        </View>
      ) : null}

      <View style={styles.amounts}>
        <View style={styles.amtItem}>
          <Text style={styles.amtLabel}>Paid</Text>
          <Text style={[styles.amtValue, { color: Colors.success }]}>${claim.paidAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.amtDivider} />
        <View style={styles.amtItem}>
          <Text style={styles.amtLabel}>Adj</Text>
          <Text style={styles.amtValue}>${claim.adjustments.toFixed(2)}</Text>
        </View>
        <View style={styles.amtDivider} />
        <View style={styles.amtItem}>
          <Text style={styles.amtLabel}>Pt. Bal</Text>
          <Text style={[styles.amtValue, { color: claim.patientBalance > 0 ? Colors.warning : Colors.textPrimary }]}>
            ${claim.patientBalance.toFixed(2)}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} style={styles.chevron} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 4,
    ...Shadow.sm,
  },
  pressed: { opacity: 0.85 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leftTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  claimNum: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary },
  charge: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  patient: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  meta: { fontSize: FontSize.xs, color: Colors.textMuted },
  denialRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  denialText: { fontSize: FontSize.xs, color: Colors.danger, flex: 1 },
  amounts: { flexDirection: 'row', alignItems: 'center', marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.divider },
  amtItem: { flex: 1, alignItems: 'center' },
  amtLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 1 },
  amtValue: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  amtDivider: { width: 1, height: 24, backgroundColor: Colors.divider },
  chevron: { marginLeft: 4 },
});
