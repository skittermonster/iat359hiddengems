import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { auth, db } from './firebase';
import { collection, onSnapshot, doc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { Bookmark, BookmarkCheck } from 'lucide-react-native'; // Use same icons as HomeScreen

export default function MyArchiveScreen({ navigation }) {
  const [archivedMovies, setArchivedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favoriteMovies, setFavoriteMovies] = useState({});

  useEffect(() => {
    if (!auth.currentUser) {
      setError("Please sign in to view your archive");
      setLoading(false);
      return;
    }
    
    const userId = auth.currentUser.uid;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // Load user favorites
        const favoritesSnapshot = await getDoc(doc(db, 'users', userId, 'collections', 'favorites'));
        if (favoritesSnapshot.exists()) {
          setFavoriteMovies(favoritesSnapshot.data().movies || {});
        }
        
        // Listen to archive changes
        const archivesRef = collection(db, 'archives', userId, 'movies');
        const unsubscribe = onSnapshot(
          archivesRef,
          (querySnapshot) => {
            const movies = [];
            querySnapshot.forEach((doc) => {
              movies.push({ id: doc.id, ...doc.data() });
            });
            // Sort movies by date added (newest first)
            movies.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
            setArchivedMovies(movies);
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching archived movies:", error);
            setError("Failed to load your archive. Please try again.");
            setLoading(false);
          }
        );
        return unsubscribe;
      } catch (err) {
        console.error("Error in data fetching:", err);
        setError("Failed to load your data. Please try again.");
        setLoading(false);
      }
    };
    
    const unsubscribe = fetchData();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Mimic the HomeScreen toggle functionality for removal
  const toggleFavorite = async (movie) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'You must be logged in to manage your archive');
        return;
      }
      const movieId = movie.id.toString();
      const favoritesDocRef = doc(db, 'users', userId, 'collections', 'favorites');
      const archiveDocRef = doc(db, 'archives', userId, 'movies', movieId);

      // Since the movie is already archived, toggling means removal.
      const updatedFavorites = { ...favoriteMovies };
      delete updatedFavorites[movieId];

      // Remove from archive and update favorites
      await deleteDoc(archiveDocRef);
      await setDoc(favoritesDocRef, { movies: updatedFavorites }, { merge: true });
      setFavoriteMovies(updatedFavorites);
      
      Alert.alert('Removed', `"${movie.title}" removed from your archive`);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      Alert.alert('Error', 'Failed to update archive: ' + err.message);
    }
  };

  const renderMovie = ({ item }) => {
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('MovieDetail', { movie: item, isFavorite: true })}
        style={styles.movieCard}
      >
        <Image
          source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
          style={styles.poster}
        />
        <View style={styles.movieInfo}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.rating}>★ {item.vote_average?.toFixed(1) || 'N/A'}</Text>
          <Text style={styles.date} numberOfLines={1}>
            Added: {new Date(item.addedAt).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} // Increased hit area
          activeOpacity={0.7}
        >
          <BookmarkCheck size={24} color="white" fill="#4CAF50" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading your archive...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>My Archive</Text>
      {archivedMovies.length > 0 ? (
        <FlatList
          data={archivedMovies}
          renderItem={renderMovie}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.moviesList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your archive is empty.</Text>
          <Text style={styles.emptySubText}>
            Add movies to your archive by tapping the bookmark icon when browsing movies.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  moviesList: {
    paddingBottom: 20,
  },
  movieCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  poster: {
    width: 80,
    height: 120,
    backgroundColor: '#ddd',
  },
  movieInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  rating: {
    fontSize: 14,
    color: '#E91E63',
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  favoriteButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10, // Ensures the button is on top
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 16,
  },
});
