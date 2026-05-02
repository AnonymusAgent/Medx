import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Radius } from '@/constants/theme';
import { ClaimStatus, AppointmentStatus } from '@/constants/mockData';

type BadgeStatus = ClaimStatus | AppointmentStatus | 'Active' | 'Inactive' | 'Verified' | 'Pending' | string;

interface Props {
  status: BadgeStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  Draft: { bg: '#F1F5F9', text: Colors.textSecondary, dot: Colors.textMuted },
  Pending: { bg: Colors.warningLight, text: '#B45309', dot: Colors.warning },
  Submitted: { bg: Colors.primaryLight, text: Colors.primaryDark, dot: Colors.primary },
  Paid: { bg: Colors.successLight, text: '#065F46', dot: Colors.success },
  Denied: { bg: Colors.dangerLight, text: '#991B1B', dot: Colors.danger },
  Partial: { bg: Colors.infoLight, text: '#0E7490', dot: Colors.info },
  Scheduled: { bg: Colors.primaryLight, text: Colors.primaryDark, dot: Colors.primary },
  'Checked In': { bg: Colors.successLight, text: '#065F46', dot: Colors.success },
  Completed: { bg: '#F1F5F9', text: Colors.textSecondary, dot: Colors.textMuted },
  Cancelled: { bg: Colors.dangerLight, text: '#991B1B', dot: Colors.danger },
  'No Show': { bg: Colors.warningLight, text: '#B45309', dot: Colors.warning },
  Active: { bg: Colors.successLight, text: '#065F46', dot: Colors.success },
  Inactive: { bg: '#F1F5F9', text: Colors.textSecondary, dot: Colors.textMuted },
  Verified: { bg: Colors.successLight, text: '#065F46', dot: Colors.success },
};

export default function StatusBadge({ status, size = 'md' }: Props) {
  const config = STATUS_CONFIG[status] || { bg: '#F1F5F9', text: Colors.textSecondary, dot: Colors.textMuted };
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, isSmall && styles.badgeSm]}>
      <View style={[styles.dot, { backgroundColor: config.dot }, isSmall && styles.dotSm]} />
      <Text style={[styles.text, { color: config.text }, isSmall && styles.textSm]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 5,
  },
  badgeSm: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotSm: {
    width: 5,
    height: 5,
  },
  text: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  textSm: {
    fontSize: FontSize.xs,
  },
});
