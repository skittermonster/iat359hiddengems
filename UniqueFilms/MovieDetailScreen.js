// MovieDetailScreen.js (suggested implementation with favorite functionality)
import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { Bookmark, BookmarkCheck } from 'lucide-react';

export default function MovieDetailScreen({ route, navigation }) {
  const { movie, isFavorite: initialIsFavorite } = route.params;
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite || false);
  const [loading, setLoading] = useState(false);

  const toggleFavorite = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'You must be logged in to favorite movies');
        return;
      }

      const movieId = movie.id.toString();
      const favoritesRef = doc(db, 'users', userId, 'collections', 'favorites');
      const archiveRef = doc(db, 'archives', userId, 'movies', movieId);

      // Get current favorites
      const favoritesDoc = await getDoc(favoritesRef);
      const currentFavorites = favoritesDoc.exists() ? favoritesDoc.data().movies || {} : {};
      
      if (isFavorite) {
        // Remove from favorites
        delete currentFavorites[movieId];
        // Remove from archive
        await deleteDoc(archiveRef);
        Alert.alert('Removed', `"${movie.title}" removed from your archive`);
      } else {
        // Add to favorites
        currentFavorites[movieId] = true;
        
        // Add to archive collection
        const movieData = {
          id: movieId,
          title: movie.title,
          overview: movie.overview,
          poster_path: movie.poster_path,
          vote_average: movie.vote_average,
          release_date: movie.release_date,
          addedAt: new Date().toISOString()
        };
        
        await setDoc(archiveRef, movieData);
        Alert.alert('Added', `"${movie.title}" added to your archive`);
      }
      
      // Update favorites document
      await setDoc(favoritesRef, { movies: currentFavorites }, { merge: true });
      
      // Update local state
      setIsFavorite(!isFavorite);
      
    } catch (err) {
      console.error('Error toggling favorite:', err);
      Alert.alert('Error', 'Failed to update favorites');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}` }}
          style={styles.poster}
          resizeMode="cover"
        />
        <View style={styles.overlay}>
          <Text style={styles.title}>{movie.title}</Text>
          <Text style={styles.releaseDate}>
            {movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown Year'}
          </Text>
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={toggleFavorite}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : isFavorite ? (
              <BookmarkCheck size={28} color="white" fill="#4CAF50" />
            ) : (
              <Bookmark size={28} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Text style={styles.rating}>★ {movie.vote_average?.toFixed(1) || 'N/A'}</Text>
          <Text style={styles.votes}>{movie.vote_count} votes</Text>
        </View>
        
        <Text style={styles.sectionTitle}>Overview</Text>
        <Text style={styles.overview}>{movie.overview || 'No overview available.'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    position: 'relative',
  },
  poster: {
    width: '100%',
    height: 300,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 50,
  },
  releaseDate: {
    color: '#ddd',
    fontSize: 16,
    marginTop: 4,
  },
  favoriteButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 24,
    padding: 8,
  },
  content: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  rating: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E91E63',
    marginRight: 12,
  },
  votes: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  overview: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
});