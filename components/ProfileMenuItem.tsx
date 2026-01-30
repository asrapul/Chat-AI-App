import { Typography } from '@/constants/Typography';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ProfileMenuItemProps {
  icon: string;
  title: string;
  onPress?: () => void;
  iconFamily?: 'Ionicons' | 'MaterialIcons';
}

export default function ProfileMenuItem({ 
  icon, 
  title, 
  onPress,
  iconFamily = 'Ionicons' 
}: ProfileMenuItemProps) {
  const { colors } = useTheme();
  
  const IconComponent = iconFamily === 'MaterialIcons' ? MaterialIcons : Ionicons;
  
  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <IconComponent name={icon as any} size={22} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginVertical: 6,
    borderWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    ...Typography.bodyMedium,
    fontSize: 16,
  },
});
