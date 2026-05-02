import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize } from '@/constants/theme';

interface Props {
  title: string;
  subtitle?: string;
  rightAction?: { icon: keyof typeof MaterialIcons.glyphMap; onPress: () => void; label?: string };
  leftAction?: { icon: keyof typeof MaterialIcons.glyphMap; onPress: () => void };
}

export default function Header({ title, subtitle, rightAction, leftAction }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={styles.left}>
        {leftAction ? (
          <Pressable onPress={leftAction.onPress} style={styles.iconBtn} hitSlop={8}>
            <MaterialIcons name={leftAction.icon} size={24} color={Colors.textInverse} />
          </Pressable>
        ) : null}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {rightAction ? (
        <Pressable onPress={rightAction.onPress} style={styles.rightBtn} hitSlop={8}>
          <MaterialIcons name={rightAction.icon} size={20} color={Colors.textInverse} />
          {rightAction.label ? <Text style={styles.rightLabel}>{rightAction.label}</Text> : null}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.navBg,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBtn: { padding: 4 },
  title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textInverse },
  subtitle: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  rightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  rightLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textInverse },
});
