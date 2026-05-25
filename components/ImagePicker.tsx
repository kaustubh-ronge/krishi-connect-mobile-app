import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, Alert } from 'react-native';
import * as ImagePickerExpo from 'expo-image-picker';
import { X, ImagePlus } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

interface ImagePickerProps {
  value: string[];
  onChange: (newImages: string[]) => void;
  onRemove: (url: string) => void;
  maxImages?: number;
}

export default function ImagePicker({ value = [], onChange, onRemove, maxImages = 5 }: ImagePickerProps) {
  const pickImage = async () => {
    if (value.length >= maxImages) {
      Alert.alert('Limit Reached', `You can only upload up to ${maxImages} images.`);
      return;
    }

    const { status } = await ImagePickerExpo.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePickerExpo.launchImageLibraryAsync({
      mediaTypes: ImagePickerExpo.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: maxImages - value.length,
      base64: true,
      quality: 0.7, // Compress image to reduce base64 size
    });

    if (!result.canceled) {
      const newImages = result.assets.map(asset => `data:image/jpeg;base64,${asset.base64}`);
      onChange(newImages);
    }
  };

  return (
    <View style={styles.container}>
      {/* Image Preview Grid */}
      {value.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewContainer}>
          {value.map((url, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri: url }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => onRemove(url)}
              >
                <X size={16} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Upload Zone */}
      {value.length < maxImages && (
        <TouchableOpacity style={styles.uploadZone} onPress={pickImage}>
          <View style={styles.uploadIconContainer}>
            <ImagePlus size={32} color={Colors.light.primary} />
          </View>
          <Text style={styles.uploadText}>Click to upload images</Text>
          <Text style={styles.uploadSubtext}>JPG, PNG or WebP</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  previewContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    padding: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  uploadZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#86efac',
    borderRadius: 16,
    padding: 24,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconContainer: {
    backgroundColor: '#dcfce3',
    padding: 12,
    borderRadius: 50,
    marginBottom: 12,
  },
  uploadText: {
    color: '#1f2937',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
  },
  uploadSubtext: {
    color: '#6b7280',
    fontSize: 14,
  },
});
