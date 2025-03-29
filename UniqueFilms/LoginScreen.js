import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { auth } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful');
      setError('');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* GEM Logo */}
      <View style={styles.logoWrapper}>
        <Text style={styles.logoGlow}>GEM</Text>
        <Text style={styles.logo}>GEM</Text>
      </View>
  
      {/* Tagline */}
      <Text style={styles.tagline}>Discover Hidden Cinematic Treasures</Text>
  
      {/* Form content shifted upward */}
      <View style={styles.formWrapper}>
        {/* Section Title */}
        <Text style={styles.sectionTitle}>Log In</Text>
  
        {/* Email Input */}
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          placeholderTextColor="#888"
          style={styles.input}
        />
  
        {/* Password Input */}
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#888"
          style={styles.input}
        />
  
        {/* Forgot Password */}
        <Text style={styles.forgotText}>Forgot Password?</Text>
  
        {/* Error Text */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
  
        {/* Submit Button */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={onLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#181820',
    padding: 25,
    flex: 1,
    justifyContent: 'center',
  },
  logoWrapper: {
    position: 'absolute',
    top: 85,
    alignSelf: 'center',
    alignItems: 'center',
  },
  logoGlow: {
    position: 'absolute',
    fontSize: 42,
    fontFamily: 'Lato',
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 7,
    zIndex: 0,
  },
  logo: {
    fontSize: 42,
    fontFamily: 'Lato',
    fontWeight: 'bold',
    color: '#FFFFFF',
    zIndex: 1,
  },
  tagline: {
    position: 'absolute',
    top: 150,
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    alignSelf: 'center',
  },
  formWrapper: {
    marginTop: -80, // 👈 shifts all form content upward slightly
  },
  sectionTitle: {
    fontSize: 20,
    color: '#F2EFD0',
    fontWeight: 'bold',
    marginBottom: 30,
    fontFamily: 'Lato',
    alignSelf: 'center',   // center the sectionTitle horizontally
    width: 307,            // same as the input width
    paddingLeft: 5,        // shifts text a little to the right inside the box
  },
  input: {
    width: 307,
    height: 56,
    borderWidth: 1.2,
    borderColor: '#F2EFD0',
    borderRadius: 16,
    paddingHorizontal: 16,
    color: '#F2EFD0',
    marginBottom: 15,
    fontSize: 16,
    alignSelf: 'center',
  },
  forgotText: {
    color: '#F2EFD0',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 50,
    alignSelf: 'center', // center container horizontally
    width: 307,          // match input/button width
    textAlign: 'right',  // push text to the right edge
    paddingRight: 12,     // small buffer inside the box
  },
  loginButton: {
    width: 307,
    height: 56,
    backgroundColor: '#F2EFD0',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    alignSelf: 'center',
  },
  loginButtonText: {
    color: '#181820',
    fontSize: 20,
    fontFamily: 'Righteous',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});