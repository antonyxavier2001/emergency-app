import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

const SignupPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    licenseId: '',
    driverType: '',
    hospitalId: '',
    departmentId: '',
    password: '',
    confirmPassword: '',
    driverPhoto: null
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.licenseId.trim()) {
      newErrors.licenseId = 'License ID is required';
    } else if (!/^[A-Z0-9]+$/.test(formData.licenseId)) {
      newErrors.licenseId = 'License ID should contain only numbers and capital letters';
    }

    if (!formData.driverType) {
      newErrors.driverType = 'Please select driver type';
    }

    if (formData.driverType === 'Ambulance Driver' && !formData.hospitalId) {
      newErrors.hospitalId = 'Hospital ID is required';
    }

    if (formData.driverType === 'VIP Vehicle Driver' && !formData.departmentId) {
      newErrors.departmentId = 'Department ID is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.driverPhoto) {
      newErrors.driverPhoto = 'Driver photo is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        handleInputChange('driverPhoto', result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    }
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert('Success', 'Registration successful!', [
        { text: 'OK', onPress: () => router.replace('/login') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (field, placeholder, options = {}) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{placeholder}</Text>
      <TextInput
        style={[styles.input, errors[field] && styles.inputError]}
        placeholder={`Enter ${placeholder.toLowerCase()}`}
        value={formData[field]}
        onChangeText={(text) => handleInputChange(field, text)}
        {...options}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Please fill in your details</Text>
        </View>

        {renderInput('name', 'Full Name', {
          autoCapitalize: 'words'
        })}

        {renderInput('phoneNumber', 'Phone Number', {
          keyboardType: 'phone-pad',
          maxLength: 10
        })}

        {renderInput('licenseId', 'License ID', {
          autoCapitalize: 'characters'
        })}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Driver Type</Text>
          <View style={styles.radioContainer}>
            {['Ambulance Driver', 'VIP Vehicle Driver'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.radioButton,
                  formData.driverType === type && styles.radioButtonSelected
                ]}
                onPress={() => handleInputChange('driverType', type)}
              >
                <Text style={styles.radioText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.driverType && <Text style={styles.errorText}>{errors.driverType}</Text>}
        </View>

        {formData.driverType === 'Ambulance Driver' && 
          renderInput('hospitalId', 'Hospital ID')}

        {formData.driverType === 'VIP Vehicle Driver' && 
          renderInput('departmentId', 'Department ID')}

        {renderInput('password', 'Password', {
          secureTextEntry: true,
          autoCapitalize: 'none'
        })}

        {renderInput('confirmPassword', 'Confirm Password', {
          secureTextEntry: true,
          autoCapitalize: 'none'
        })}

        <View style={styles.photoSection}>
          <TouchableOpacity 
            style={styles.uploadButton} 
            onPress={pickImage}
          >
            <Text style={styles.uploadButtonText}>
              {formData.driverPhoto ? 'Change Photo' : 'Upload Driver Photo'}
            </Text>
          </TouchableOpacity>

          {formData.driverPhoto && (
            <Image 
              source={{ uri: formData.driverPhoto }} 
              style={styles.photoPreview} 
            />
          )}
          {errors.driverPhoto && <Text style={styles.errorText}>{errors.driverPhoto}</Text>}
        </View>

        <TouchableOpacity 
          style={[styles.signupButton, isLoading && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.signupButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.loginLink}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.loginLinkText}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 4,
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  radioButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  radioButtonSelected: {
    borderColor: '#007aff',
    backgroundColor: '#e8f0fe',
  },
  radioText: {
    fontSize: 14,
    color: '#333',
  },
  photoSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: '#007aff',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginTop: 12,
  },
  signupButton: {
    backgroundColor: '#34c759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#a8e5b9',
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#007aff',
    fontSize: 16,
  }
});

export default SignupPage;