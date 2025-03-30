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
  
      {/* Section Title */}
      <Text style={styles.sectionTitle}>Select Your Favourite Genres</Text>
  
      {/* Genre Selection Grid */}
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
  
      {/* Error Message */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
  
      {/* Next Button */}
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
  
      {/* Skip For Now Button */}
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => console.log('Skip pressed')}
      >
        <Text style={styles.secondaryButtonText}>Skip For Now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  logoWrapper: {
    marginTop: 70,
    alignItems: 'center',
    marginBottom: 30,
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
    fontSize: 16,
    color: '#F2EFD0',
    fontFamily: 'Righteous',
    marginBottom: 15,
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
    borderRadius: 8,
    paddingVertical: 8,
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
    fontWeight: 'bold',
  },
  primaryButton: {
    backgroundColor: '#F2EFD0',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    marginBottom: 20,
  },
  primaryButtonText: {
    fontSize: 18,
    fontFamily: 'Righteous',
    color: '#181820',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#F2EFD0',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    shadowColor: '#F2EFD0',
    shadowOpacity: 0.7,
    shadowRadius: 7,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Righteous',
    color: '#F2EFD0',
  },
  container: {
    flex: 1,
    backgroundColor: '#181820',
    paddingHorizontal: 25,
    paddingTop: 60,
  },
});