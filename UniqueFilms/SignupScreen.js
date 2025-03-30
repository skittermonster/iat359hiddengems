import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from 'react-native';import { auth, db } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordChecks, setPasswordChecks] = useState({
    uppercase: false,
    lowercase: false,
    numeric: false,
    symbol: false,
  });
  

  const onSignup = async () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    const isStrongPassword =
      /[A-Z]/.test(password) && // uppercase
      /[a-z]/.test(password) && // lowercase
      /\d/.test(password) &&    // number
      /[!@#$%^&*(),.?":{}|<>]/.test(password); // symbol

    if (!isStrongPassword) {
      setError('Password does not meet all strength requirements.');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Attempting signup...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Signup successful:', user.uid);
      
      // Store user data in Firestore with onboarding flag
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        createdAt: new Date(),
        isOnboarded: false // Mark that user needs onboarding
      });
      
      console.log('User data saved to Firestore');
      
      // Note: We don't need to navigate - App.js will handle this based on onboarding status
    } catch (err) {
      console.log('Signup error:', err);
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

      <View style={styles.formWrapper}>
        {/* Section Title */}
        <Text style={styles.sectionTitle}>Create Account</Text>
    
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          placeholderTextColor="#888"
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setPasswordChecks({
              uppercase: /[A-Z]/.test(text),
              lowercase: /[a-z]/.test(text),
              numeric: /\d/.test(text),
              symbol: /[!@#$%^&*(),.?":{}|<>]/.test(text),
            });
          }}
          secureTextEntry
          placeholderTextColor="#888"
          style={styles.input}
        />
    
        {/* Password Requirements */}
        <View style={styles.requirementsBlock}>
        <Text style={styles.requirementsTitle}>Password must contain:</Text>

        <View style={styles.requirementRow}>
          <Image source={ passwordChecks.uppercase 
            ? require('./assets/Checked.png') : require('./assets/Unchecked.png')}
            style={styles.checkboxIcon}/>
          <Text style={styles.requirementText}>At least one UPPERCASE character</Text>
        </View>

        <View style={styles.requirementRow}>
          <Image source={ passwordChecks.lowercase
            ? require('./assets/Checked.png') : require('./assets/Unchecked.png')}
            style={styles.checkboxIcon} />
          <Text style={styles.requirementText}>At least one lowercase character</Text>
        </View>
        
        <View style={styles.requirementRow}>
          <Image source={ passwordChecks.numeric
            ? require('./assets/Checked.png') : require('./assets/Unchecked.png')}
            style={styles.checkboxIcon}/>
          <Text style={styles.requirementText}>At least one numeric (0123456789) character</Text>
        </View>

        <View style={styles.requirementRow}>
          <Image source={ passwordChecks.symbol ? require('./assets/Checked.png') : require('./assets/Unchecked.png') }
            style={styles.checkboxIcon}/>
          <Text style={styles.requirementText}>At least one symbol (!@#$%^&)</Text>
        </View>
      </View>
    
        {/* Terms Agreement */}
        {/* <Text style={styles.agreement}>☐ I agree to the Terms of Service and Privacy Policy</Text> */}

        {error ? ( <Text style={styles.errorText}>{error}</Text>) : null}

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.signupButton}
          onPress={onSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#181820" />
          ) : (
            <Text style={styles.signupButtonText}>Create Account</Text>
          )}
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
    marginTop: -150,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#F2EFD0',
    fontFamily: 'Righteous',
    marginTop: 160,
    marginBottom: 20,
    alignSelf: 'center',
    width: 307,         // Match the input field width
    paddingLeft: 5,     // Slight push to the right
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
  requirementsBlock: {
    marginBottom: 25, // 👈 adjusts spacing between requirements and the button
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F2EFD0',
    marginTop: 10,
    marginBottom: 8,
    alignSelf: 'center',     
    width: 307,              
    textAlign: 'left',   
    paddingRight: 12,      
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    alignSelf: 'center',
    width: 307,
  },
  checkboxIcon: {
    width: 18,
    height: 18,
    marginRight: 10,
  },
  requirementText: {
    color: '#D1D1D2',
    fontSize: 13,
    flexShrink: 1,
  },
  requirement: {
    color: '#F2EFD0',
    fontSize: 13,
    marginBottom: 4,
    alignSelf: 'center',    
    width: 307,            
    textAlign: 'left',      
    paddingRight: 12,     
  },
  // agreement: {
  //   color: '#F2EFD0',
  //   fontSize: 13,
  //   marginVertical: 20,
  //   alignSelf: 'center', 
  //   width: 307,            
  //   textAlign: 'left', 
  //   paddingRight: 12,       
  // },
  errorText: {
    color: 'red',
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
  },
  signupButton: {
    width: 307,
    height: 56,
    backgroundColor: '#F2EFD0',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 10,
  },
  signupButtonText: {
    fontSize: 18,
    fontFamily: 'Righteous',
    color: '#181820',
  },
});