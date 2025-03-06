import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';

export default function LoginPage() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter(); 

  const handleLogin = () => {
    if (!/^\d{10}$/.test(mobileNumber)) {
      Alert.alert('Invalid Mobile Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters long.');
      return;
    }

    
    Alert.alert(
      'Login Successful',
      `Mobile: ${mobileNumber}, Password: ${password}`,
      [
        {
          text: 'OK',
          onPress: () => router.replace('/home'), 
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Mobile Number"
        keyboardType="phone-pad"
        maxLength={10}
        value={mobileNumber}
        onChangeText={setMobileNumber}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <Link href="/signup" asChild>
        <TouchableOpacity style={styles.signupButton}>
          <Text style={styles.signupButtonText}>Don't have an account? Signup</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupButton: {
    marginTop: 20,
  },
  signupButtonText: {
    color: '#007bff',
    fontSize: 16,
  },
});