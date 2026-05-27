import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useApiClient } from '@/services/api';
import { Bell, CheckCheck, Package, ShoppingBag, Truck, Info } from 'lucide-react-native';
import { MotiView } from 'moti';

const NOTIF_ICONS: Record<string, any> = {
  ORDER_RECEIVED: ShoppingBag,
  ORDER_SHIPPED: Truck,
  ORDER_DELIVERED: Package,
  default: Bell,
};

const NOTIF_COLORS: Record<string, string> = {
  ORDER_RECEIVED: '#3b82f6',
  ORDER_SHIPPED: '#8b5cf6',
  ORDER_DELIVERED: '#16a34a',
  default: '#64748b',
};

export default function NotificationsScreen() {
  const api = useApiClient();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchNotifications = useCallback(async () => {
    try {
      setError('');
      const res = await api.get('mobile/v1/notifications');
      setNotifications(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchNotifications();
    }, [])
  );

  const markAllRead = async () => {
    try {
      await api.post('mobile/v1/notifications', { markAll: true });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const markRead = async (id: string) => {
    try {
      await api.post('mobile/v1/notifications', { notificationId: id });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const IconComponent = NOTIF_ICONS[item.type] || NOTIF_ICONS.default;
    const iconColor = NOTIF_COLORS[item.type] || NOTIF_COLORS.default;
    const date = new Date(item.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });

    return (
      <MotiView
        from={{ opacity: 0, translateX: -20 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: 'timing', duration: 350, delay: index * 50 }}
      >
        <TouchableOpacity
          style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
          onPress={() => !item.isRead && markRead(item.id)}
          activeOpacity={0.85}
        >
          {!item.isRead && <View style={styles.unreadAccent} />}
          <View style={[styles.iconBg, { backgroundColor: iconColor + '18' }]}>
            <IconComponent color={iconColor} size={20} />
          </View>
          <View style={styles.notifContent}>
            <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]}>
              {item.title || item.type?.replace(/_/g, ' ')}
            </Text>
            <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
            <Text style={styles.notifDate}>{date}</Text>
          </View>
          {!item.isRead && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      </MotiView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={styles.header}
      >
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSubtitle}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
            <CheckCheck color="#4ade80" size={17} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Info color="#94a3b8" size={48} />
          <Text style={styles.errorTitle}>Couldn't load notifications</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchNotifications(); }}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchNotifications(); }}
              colors={['#16a34a']} tintColor="#16a34a"
            />
          }
          ListEmptyComponent={
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', delay: 100 }}
              style={styles.emptyContainer}
            >
              <View style={styles.emptyIconBg}>
                <Bell color="#94a3b8" size={44} />
              </View>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySubtitle}>You have no notifications yet.</Text>
            </MotiView>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  header: {
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  headerSubtitle: { fontSize: 12, color: '#4ade80', fontWeight: '600', marginTop: 2 },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(74,222,128,0.12)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  markAllText: { fontSize: 12, color: '#4ade80', fontWeight: '700' },

  listContent: { padding: 14, paddingBottom: 100 },

  notifCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#fff', borderRadius: 18, padding: 14,
    marginBottom: 10, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    gap: 12,
  },
  notifCardUnread: { backgroundColor: '#f0fdf4' },
  unreadAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: '#16a34a' },
  iconBg: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 3 },
  notifTitleUnread: { color: '#0f172a', fontWeight: '800' },
  notifMessage: { fontSize: 14, color: '#334155', lineHeight: 20, fontWeight: '500' },
  notifDate: { fontSize: 11, color: '#94a3b8', marginTop: 5, fontWeight: '500' },
  unreadDot: {
    width: 9, height: 9, borderRadius: 5,
    backgroundColor: '#16a34a', marginTop: 4, flexShrink: 0,
  },

  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginTop: 14, marginBottom: 6 },
  errorSubtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 20 },
  retryBtn: { backgroundColor: '#16a34a', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  emptyContainer: { paddingTop: 80, alignItems: 'center', gap: 12 },
  emptyIconBg: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  emptySubtitle: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
});
