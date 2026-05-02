import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';

interface Props {
  label: string;
  value: string;
  subtitle?: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: string; positive: boolean };
  onPress?: () => void;
  fullWidth?: boolean;
}

export default function MetricCard({
  label,
  value,
  subtitle,
  icon,
  iconColor = Colors.primary,
  iconBg = Colors.primaryLight,
  trend,
  onPress,
  fullWidth = false,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, fullWidth && styles.fullWidth, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <MaterialIcons name={icon} size={20} color={iconColor} />
        </View>
        {trend ? (
          <View style={[styles.trend, { backgroundColor: trend.positive ? Colors.successLight : Colors.dangerLight }]}>
            <MaterialIcons
              name={trend.positive ? 'trending-up' : 'trending-down'}
              size={12}
              color={trend.positive ? Colors.success : Colors.danger}
            />
            <Text style={[styles.trendText, { color: trend.positive ? Colors.success : Colors.danger }]}>
              {trend.value}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  fullWidth: {
    flex: undefined,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    gap: 2,
  },
  trendText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  value: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
