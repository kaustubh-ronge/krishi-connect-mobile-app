import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Store, ShoppingCart, LayoutDashboard, User, Bell } from 'lucide-react-native';
import { useCartStore } from '@/store/cartStore';

const ACTIVE_COLOR = '#ffffff';
const INACTIVE_COLOR = 'rgba(255,255,255,0.5)';

function TabIcon({
  icon: Icon,
  focused,
  size = 22,
}: {
  icon: any;
  focused: boolean;
  size?: number;
}) {
  return (
    <View style={[styles.iconPill, focused && styles.iconPillActive]}>
      <Icon
        color={focused ? ACTIVE_COLOR : INACTIVE_COLOR}
        size={size}
        strokeWidth={focused ? 2.5 : 1.8}
      />
    </View>
  );
}

function CartTabIcon({ focused }: { focused: boolean }) {
  const count = useCartStore((s) => s.items.length);
  return (
    <View style={[styles.iconPill, focused && styles.iconPillActive]}>
      <ShoppingCart
        color={focused ? ACTIVE_COLOR : INACTIVE_COLOR}
        size={22}
        strokeWidth={focused ? 2.5 : 1.8}
      />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 4);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,

        // Gradient background
        tabBarBackground: () => (
          <LinearGradient
            colors={['#0f4c2a', '#15803d', '#16a34a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        ),

        tabBarStyle: {
          paddingBottom: bottomPad + 4,
          paddingTop: 8,
          paddingHorizontal: 4,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          ...Platform.select({
            ios: {
              shadowColor: '#0f4c2a',
              shadowOffset: { width: 0, height: -6 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
            },
            android: {
              elevation: 20,
            },
          }),
        },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.1,
          marginTop: 0,
          marginBottom: 2,
        },

        tabBarItemStyle: {
          paddingTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Market',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={Store} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ focused }) => (
            <CartTabIcon focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={LayoutDashboard} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={Bell} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={User} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconPill: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 46,
    height: 30,
    borderRadius: 15,
  },
  // Frosted glass active pill on the green gradient
  iconPillActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },

  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#16a34a',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
    lineHeight: 11,
  },
});
