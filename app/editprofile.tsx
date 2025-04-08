// app/editprofile.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router'; // Use Expo Router's useRouter
import * as ImagePicker from 'expo-image-picker';

interface UserDataType {
  name: string;
  phone: string;
  photo: string;
  vehicleId: string;
  role: 'ambulance driver' | 'vip vehicle driver';
}

const EditProfileScreen: React.FC = () => {
  const router = useRouter(); // Use Expo Router's useRouter

  const [userData, setUserData] = useState<UserDataType>({
    name: 'Antony Xavier',
    phone: '+91 7306148637',
    photo: './assets/images/splash.jpg',
    vehicleId: 'AMB123',
    role: 'ambulance driver',
  });

  useEffect(() => {
    (async () => {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      }
    })();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setUserData({ ...userData, photo: result.assets[0].uri });
    }
  };

  const validateInputs = () => {
    if (!userData.name.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty');
      return false;
    }
    if (!userData.phone.trim() || !/^\+?\d{10,15}$/.test(userData.phone)) {
      Alert.alert('Validation Error', 'Please enter a valid phone number');
      return false;
    }
    if (!userData.vehicleId.trim()) {
      Alert.alert('Validation Error', 'Vehicle ID cannot be empty');
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validateInputs()) return;

    console.log('Saving user data:', userData);
    Alert.alert('Success', 'Profile updated successfully!');
    router.back(); // Use Expo Router's router.back to go back
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
          <Image
            source={{ uri: userData.photo }}
            style={styles.profilePhoto}
            onError={() => Alert.alert('Error', 'Failed to load profile photo')}
          />
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={userData.name}
            onChangeText={(text) => setUserData({ ...userData, name: text })}
            placeholder="Enter your name"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            value={userData.phone}
            onChangeText={(text) => setUserData({ ...userData, phone: text })}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            {userData.role === 'ambulance driver' ? 'Ambulance ID' : 'VIP Vehicle ID'}
          </Text>
          <TextInput
            style={styles.input}
            value={userData.vehicleId}
            onChangeText={(text) => setUserData({ ...userData, vehicleId: text })}
            placeholder={
              userData.role === 'ambulance driver'
                ? 'Enter Ambulance ID'
                : 'Enter VIP Vehicle ID'
            }
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 16,
    flex: 1,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
  },
  changePhotoText: {
    color: '#007AFF',
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditProfileScreen;