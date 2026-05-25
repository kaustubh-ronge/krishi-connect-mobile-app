import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApiClient } from '@/services/api';
import { Tractor, Briefcase, Truck } from 'lucide-react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

import { useUserStore } from '@/store/userStore';

const ROLES = [
  { id: 'farmer', title: 'Farmer', description: 'Sell your produce directly to buyers', icon: Tractor },
  { id: 'agent', title: 'Agent', description: 'Buy wholesale and manage trades', icon: Briefcase },
  { id: 'delivery', title: 'Delivery Partner', description: 'Fulfill orders and earn money', icon: Truck },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const api = useApiClient();
  const { fetchProfile } = useUserStore();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onContinue = async () => {
    if (!selectedRole) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await api.post('mobile/v1/auth/role', { role: selectedRole });
      
      if (response.success) {
        await fetchProfile(api); // Ensure the global store knows about the new role
        router.replace('/edit-profile?onboarding=true');
      } else {
        setError(response.error || 'Failed to assign role');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving your role.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <LinearGradient
        colors={['#ffffff', '#f0fdf4']}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerClassName="flex-grow px-6 py-10">
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 700 }}
            className="mt-6 mb-8"
          >
            <Text className="text-3xl font-extrabold text-gray-900 mb-2">Choose Your Role</Text>
            <Text className="text-base text-gray-500 leading-6">How do you want to use KrishiConnect? Your role cannot be changed later.</Text>
          </MotiView>

          {error ? (
            <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-50 p-4 rounded-xl mb-6 border border-red-100">
              <Text className="text-red-600 text-center font-medium">{error}</Text>
            </MotiView>
          ) : null}

          <View className="gap-y-4 mb-10">
            {ROLES.map((role, index) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              
              return (
                <MotiView
                  key={role.id}
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'timing', duration: 500, delay: index * 150 }}
                >
                  <TouchableOpacity
                    className={`flex-row items-center p-5 rounded-2xl border-2 ${isSelected ? 'border-primary bg-green-50 shadow-sm' : 'border-gray-200 bg-white'}`}
                    onPress={() => setSelectedRole(role.id)}
                    activeOpacity={0.7}
                  >
                    <View className={`w-16 h-16 rounded-full items-center justify-center mr-4 ${isSelected ? 'bg-green-200' : 'bg-gray-100'}`}>
                      <Icon size={32} color={isSelected ? '#15803d' : '#6b7280'} />
                    </View>
                    <View className="flex-1">
                      <Text className={`text-lg font-bold mb-1 ${isSelected ? 'text-primary-dark' : 'text-gray-900'}`}>{role.title}</Text>
                      <Text className="text-sm text-gray-500 leading-5">{role.description}</Text>
                    </View>
                  </TouchableOpacity>
                </MotiView>
              );
            })}
          </View>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 800, delay: 600 }}
            className="mt-auto"
          >
            <TouchableOpacity 
              className={`bg-primary p-4 rounded-2xl items-center shadow-md ${(!selectedRole || loading) ? 'opacity-50' : 'opacity-100'}`}
              onPress={onContinue} 
              disabled={!selectedRole || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-lg font-bold tracking-wide">Continue</Text>
              )}
            </TouchableOpacity>
          </MotiView>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}
