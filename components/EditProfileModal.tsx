import { SPRING_CONFIG } from '@/constants/Animations';
import { Typography } from '@/constants/Typography';
import { useTheme } from '@/context/ThemeContext';
import { saveUserProfile, UserProfile } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import Avatar from './Avatar';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  initialProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
}

export default function EditProfileModal({
  visible,
  onClose,
  initialProfile,
  onSave,
}: EditProfileModalProps) {
  const { colors } = useTheme();
  const [username, setUsername] = useState(initialProfile.username);
  const [email, setEmail] = useState(initialProfile.email);
  const [avatarUri, setAvatarUri] = useState(initialProfile.avatarUri);
  const [isLoading, setIsLoading] = useState(false);
  
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    if (visible) {
      setUsername(initialProfile.username);
      setEmail(initialProfile.email);
      setAvatarUri(initialProfile.avatarUri);
      
      scale.value = withSpring(1, SPRING_CONFIG.SMOOTH);
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withTiming(0.9, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, initialProfile]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  // Save image to permanent storage
  const saveImagePermanently = async (tempUri: string): Promise<string> => {
    try {
      console.log('💾 Saving image permanently from:', tempUri);
      
      // Use documentDirectory with null check and type assertion
      const docDir = (FileSystem as any).documentDirectory;
      
      if (!docDir) {
        console.warn('⚠️ DocumentDirectory not available, using temp URI');
        return tempUri;
      }
      
      // Generate unique filename
      const timestamp = Date.now();
      const extension = tempUri.split('.').pop() || 'jpg';
      const filename = `profile_avatar_${timestamp}.${extension}`;
      const permanentUri = `${docDir}${filename}`;
      
      // Copy file to permanent location
      await FileSystem.copyAsync({
        from: tempUri,
        to: permanentUri,
      });
      
      console.log('✅ Image saved permanently to:', permanentUri);
      return permanentUri;
    } catch (error) {
      console.error('❌ Error saving image permanently:', error);
      return tempUri; // Fallback to temp URI if save fails
    }
  };
  
  const pickImage = async () => {
    try {
      console.log('🎨 Starting image picker...');
      setIsLoading(true);
      
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('📱 Permission result:', permissionResult.status);
      
      if (permissionResult.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photos to change your profile picture.',
          [{ text: 'OK' }]
        );
        setIsLoading(false);
        return;
      }
      
      // Launch picker
      console.log('📷 Launching image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      console.log('✅ Picker result:', result.canceled ? 'User canceled' : 'Image selected');
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        console.log('🖼️ Selected image URI:', selectedUri);
        setAvatarUri(selectedUri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('❌ Error in pickImage:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const takePhoto = async () => {
    try {
      console.log('📸 Starting camera...');
      setIsLoading(true);
      
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      console.log('📱 Camera permission:', permissionResult.status);
      
      if (permissionResult.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow camera access to take a photo.',
          [{ text: 'OK' }]
        );
        setIsLoading(false);
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      console.log('✅ Camera result:', result.canceled ? 'User canceled' : 'Photo taken');
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        console.log('🖼️ Photo URI:', photoUri);
        setAvatarUri(photoUri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('❌ Error in takePhoto:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const showImageOptions = () => {
    console.log('🎯 showImageOptions called');
    
    Alert.alert(
      'Change Profile Picture',
      'Choose how you want to update your profile picture',
      [
        { 
          text: 'Take Photo', 
          onPress: () => {
            console.log('📸 User chose: Take Photo');
            takePhoto();
          }
        },
        { 
          text: 'Choose from Library',
          onPress: () => {
            console.log('🖼️ User chose: Choose from Library');
            pickImage();
          }
        },
        { 
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('❌ User canceled')
        },
      ]
    );
  };
  
  const handleSave = async () => {
    try {
      if (!username.trim()) {
        Alert.alert('Error', 'Please enter a username');
        return;
      }

      if (!email.trim()) {
        Alert.alert('Error', 'Please enter an email address');
        return;
      }
      
      console.log('💾 Saving profile...');
      console.log('   Username:', username);
      console.log('   Avatar URI:', avatarUri || 'none');
      
      let finalAvatarUri = avatarUri;
      
      // Save image permanently if it's a new selection
      if (avatarUri && avatarUri !== initialProfile.avatarUri) {
        console.log('🔄 New avatar detected, saving permanently...');
        finalAvatarUri = await saveImagePermanently(avatarUri);
      }
      
      const updatedProfile: UserProfile = {
        username: username.trim(),
        email: email.trim(),
        avatarUri: finalAvatarUri,
      };
      
      await saveUserProfile(updatedProfile);
      console.log('✅ Profile saved successfully with avatar:', finalAvatarUri);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSave(updatedProfile);
      onClose();
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    }
  };
  
  const handleCancel = () => {
    console.log('🚫 Cancel pressed - resetting values');
    setUsername(initialProfile.username);
    setAvatarUri(initialProfile.avatarUri);
    onClose();
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleCancel} />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Animated.View style={[styles.modal, { backgroundColor: colors.cardBackground }, animatedStyle]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
              <TouchableOpacity onPress={handleCancel}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrapper}>
                <Avatar imageUri={avatarUri} size="large" />
                <View style={[styles.cameraIcon, { backgroundColor: colors.primary }]}>
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                </View>
              </View>
              
              <View style={styles.photoButtons}>
                <TouchableOpacity 
                  onPress={pickImage}
                  disabled={isLoading}
                  style={[styles.photoButton, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="images" size={20} color="#FFFFFF" />
                  <Text style={styles.photoButtonText}>Choose Photo</Text>
                </TouchableOpacity>
              </View>
              
              {isLoading && (
                <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>
                  Loading...
                </Text>
              )}
            </View>
            
            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: colors.text }]}>Username</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your name"
                placeholderTextColor={colors.textLight}
                maxLength={30}
              />
              
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
                onPress={handleCancel}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  keyboardView: {
    width: '85%',
    maxWidth: 400,
  },
  modal: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    ...Typography.header,
    fontSize: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarTouchable: {
    alignItems: 'center',
    padding: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  photoButtonText: {
    ...Typography.bodySemiBold,
    color: '#FFFFFF',
    fontSize: 14,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarHint: {
    marginTop: 8,
    fontSize: 14,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    ...Typography.bodySemiBold,
    fontSize: 14,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    ...Typography.body,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    ...Typography.bodySemiBold,
    fontSize: 16,
  },
  saveButton: {},
  saveButtonText: {
    ...Typography.bodySemiBold,
    color: '#FFFFFF',
    fontSize: 16,
  },
});
