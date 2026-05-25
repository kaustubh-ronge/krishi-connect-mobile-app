import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useApiClient } from '@/services/api';
import { Tractor, Briefcase, Truck } from 'lucide-react-native';

const ROLES = [
  { id: 'farmer', title: 'Farmer', description: 'Sell your produce directly to buyers', icon: Tractor },
  { id: 'agent', title: 'Agent', description: 'Buy wholesale and manage trades', icon: Briefcase },
  { id: 'delivery', title: 'Delivery Partner', description: 'Fulfill orders and earn money', icon: Truck },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const api = useApiClient();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onContinue = async () => {
    if (!selectedRole) return;
    
    setLoading(true);
    setError('');

    try {
      // Call the Next.js API route we created
      const response = await api.post('mobile/v1/auth/role', { role: selectedRole });
      
      if (response.success) {
        // Next.js returns a redirectUrl, but we are in native routing now
        // so we just go to the main tabs layout
        router.replace('/(tabs)');
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Role</Text>
          <Text style={styles.subtitle}>How do you want to use KrishiConnect? Your role cannot be changed later.</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.rolesContainer}>
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            
            return (
              <TouchableOpacity
                key={role.id}
                style={[styles.roleCard, isSelected && styles.roleCardSelected]}
                onPress={() => setSelectedRole(role.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                  <Icon size={32} color={isSelected ? Colors.light.primary : Colors.light.icon} />
                </View>
                <View style={styles.roleTextContainer}>
                  <Text style={[styles.roleTitle, isSelected && styles.roleTitleSelected]}>{role.title}</Text>
                  <Text style={styles.roleDescription}>{role.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity 
          style={[styles.button, (!selectedRole || loading) && styles.buttonDisabled]} 
          onPress={onContinue} 
          disabled={!selectedRole || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.icon,
    lineHeight: 24,
  },
  errorText: {
    color: Colors.light.error,
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    textAlign: 'center',
  },
  rolesContainer: {
    gap: 16,
    marginBottom: 40,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
  },
  roleCardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: '#f0fdf4', // light green background
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconContainerSelected: {
    backgroundColor: '#dcfce7',
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  roleTitleSelected: {
    color: Colors.light.primaryDark,
  },
  roleDescription: {
    fontSize: 14,
    color: Colors.light.icon,
    lineHeight: 20,
  },
  button: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
