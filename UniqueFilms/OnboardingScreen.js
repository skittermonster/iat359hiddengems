

// OnboardingScreen.js
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
      <Text style={styles.title}>Welcome!</Text>
      <Text style={styles.subtitle}>Select your preferred genre:</Text>
      
      <FlatList
        data={genres}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onSelectGenre(item)}
            style={[
              styles.genreItem,
              selectedGenre?.id === item.id && styles.selectedGenre
            ]}
          >
            <Text style={[
              styles.genreText,
              selectedGenre?.id === item.id && styles.selectedGenreText
            ]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button
          title="Continue"
          onPress={onContinue}
          disabled={!selectedGenre}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  genreItem: {
    padding: 15,
    backgroundColor: 'white',
    marginVertical: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedGenre: {
    backgroundColor: '#e0e0ff',
    borderColor: '#9090ff',
  },
  genreText: {
    fontSize: 16,
  },
  selectedGenreText: {
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginVertical: 10,
  }
});