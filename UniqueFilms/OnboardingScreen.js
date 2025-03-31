import React, { useState } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { auth, db } from './firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';

const genres = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  // add additional genres as needed
];

export default function OnboardingScreen({ userId }) {
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSelectGenre = (genre) => {
    setSelectedGenre(genre);
    setError('');
  };

  const onContinue = async () => {
    if (!selectedGenre) {
      return; // Button should be disabled anyway
    }
    
    if (!userId) {
      setError('No user ID available. Please try signing in again.');
      return;
    }

    setLoading(true);
    
    try {
      // Create the user document with onboarding data
      const userDocRef = doc(db, 'users', userId);
      
      await setDoc(userDocRef, {
        preferredGenre: selectedGenre,
        isOnboarded: true,
        onboardedAt: new Date().toISOString()
      }, { merge: true }); // Use merge to avoid overwriting existing data
      
      console.log('Onboarding completed successfully');
      
      // No need to navigate - App.js will automatically switch to MainTabNavigator
      // when the onAuthStateChanged triggers after we update the user doc
    } catch (err) {
      console.error('Error during onboarding:', err);
      setError(`Failed to save your preferences: ${err.message}`);
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
  
      {/* Main content */}
      <View style={styles.mainContent}>
        <Text style={styles.sectionTitle}>Select Your Favourite Genres</Text>
  
        <View style={styles.genreGrid}>
          {genres.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => onSelectGenre(item)}
              style={[
                styles.genreButton,
                selectedGenre?.id === item.id && styles.genreButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.genreButtonText,
                  selectedGenre?.id === item.id && styles.genreButtonTextSelected,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
  
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
  
      {/* Bottom buttons */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onContinue}
          disabled={!selectedGenre || loading}
        >
          {loading ? (
            <ActivityIndicator color="#181820" />
          ) : (
            <Text style={styles.primaryButtonText}>Next</Text>
          )}
        </TouchableOpacity>
  
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => console.log('Skip pressed')}
        >
          <Text style={styles.secondaryButtonText}>Skip For Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  sectionTitle: {
    fontSize: 22,
    color: '#F2EFD0',
    fontFamily: 'Righteous',
    marginTop: 160, // ⬅️ Pushes the title below the logo
    marginBottom: 15,
    alignSelf: 'center',
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 40,
  },
  genreButton: {
    borderWidth: 1,
    borderColor: '#F2EFD0',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 16,
    margin: 5,
  },
  genreButtonSelected: {
    backgroundColor: '#38383F',
  },
  genreButtonText: {
    color: '#F2EFD0',
    fontSize: 14,
  },
  genreButtonTextSelected: {
    fontWeight: 'nornmal',
  },
  primaryButton: {
    width: 307,
    height: 56,
    backgroundColor: '#F2EFD0',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  primaryButtonText: {
    fontSize: 20,
    fontFamily: 'Righteous',
    color: '#181820',
  },
  secondaryButton: {
    width: 307,
    height: 56,
    borderWidth: 1,
    borderColor: '#F2EFD0',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: '#F2EFD0',
    shadowOpacity: 0.7,
    shadowRadius: 7,
  },
  secondaryButtonText: {
    fontSize: 20,
    fontFamily: 'Righteous',
    color: '#F2EFD0',
  },
  container: {
    flex: 1,
    backgroundColor: '#181820',
    paddingHorizontal: 25,
    paddingTop: 60,
  },
  
  mainContent: {
    flexGrow: 0,
    marginBottom: 20, // ⬅️ this will shrink the space and push buttons up
  },
  
  buttonWrapper: {
    gap: 15,
    marginTop: 'auto',
    marginBottom: 100, // 👈 Pushes it up from the very bottom a bit
  },
});