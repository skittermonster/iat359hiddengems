// home screen
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  SafeAreaView, 
  Alert,
  ScrollView
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MyArchiveScreen from './MyArchiveScreen';
import ProfileScreen from './ProfileScreen.js';
import { auth, db } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { Bookmark, BookmarkCheck } from 'lucide-react-native';

// TMDB API key
const TMDB_API_KEY = '1102d81d4603c7d20f1fc0ba2d1b6031';

function HomeScreen({ navigation }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userGenre, setUserGenre] = useState(null);
  const [favoriteMovies, setFavoriteMovies] = useState({});

  // Fetch user preferences and favorites
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }
        // Get user preferences
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists() && userDoc.data().preferredGenre) {
          setUserGenre(userDoc.data().preferredGenre);
        } else {
          setError('No genre preferences found');
        }
        // Get user favorites
        const favoritesSnapshot = await getDoc(doc(db, 'users', userId, 'collections', 'favorites'));
        if (favoritesSnapshot.exists()) {
          setFavoriteMovies(favoritesSnapshot.data().movies || {});
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchMovies = async () => {
      if (!userGenre) return;
      setLoading(true);
      try {
        const genreFilter = userGenre ? `&with_genres=${userGenre.id}` : '';
        const response = await fetch(
          `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}${genreFilter}&sort_by=vote_average.desc&vote_count.gte=50&vote_count.lte=1000&page=1`
        );
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          setMovies(data.results);
        } else {
          setError('No movies found matching your preferences');
        }
      } catch (err) {
        console.error('Error fetching movies:', err);
        setError(`Failed to load movies: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [userGenre]);

  const toggleFavorite = async (movie) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'You must be logged in to favorite movies');
        return;
      }
      const movieId = movie.id.toString();
      const favoritesCollectionRef = collection(db, 'users', userId, 'collections');
      const favoritesDocRef = doc(favoritesCollectionRef, 'favorites');
      const archivesRef = collection(db, 'archives', userId, 'movies');
      const archiveDocRef = doc(archivesRef, movieId);
      const isFavorite = favoriteMovies[movieId];
      const updatedFavorites = { ...favoriteMovies };

      if (isFavorite) {
        delete updatedFavorites[movieId];
        await deleteDoc(archiveDocRef);
        Alert.alert('Removed', `"${movie.title}" removed from your archive`);
      } else {
        updatedFavorites[movieId] = true;
        const movieData = {
          id: movieId,
          title: movie.title,
          overview: movie.overview,
          poster_path: movie.poster_path,
          vote_average: movie.vote_average,
          release_date: movie.release_date,
          addedAt: new Date().toISOString()
        };
        await setDoc(archiveDocRef, movieData);
        Alert.alert('Added', `"${movie.title}" added to your archive`);
      }
      await setDoc(favoritesDocRef, { movies: updatedFavorites }, { merge: true });
      setFavoriteMovies(updatedFavorites);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      Alert.alert('Error', 'Failed to update favorites: ' + err.message);
    }
  };

  const renderMovie = ({ item }) => {
    const isFavorite = favoriteMovies[item.id.toString()];
    return (
      <TouchableOpacity 
        style={styles.movieCard}
        onPress={() => navigation.navigate('MovieDetail', { movie: item, isFavorite })}
      >
        {item.poster_path ? (
          <Image
            source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
            style={styles.poster}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.poster, styles.noPoster]}>
            <Text style={styles.noPosterText}>No Poster</Text>
          </View>
        )}
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item)}
          activeOpacity={0.7}
        >
          {isFavorite ? (
            <BookmarkCheck size={24} color="white" fill="#4CAF50" />
          ) : (
            <Bookmark size={24} color="white" />
          )}
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.rating}>{item.vote_average.toFixed(1)} ★</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Discovering hidden gems...</Text>
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hidden Gems Cinema</Text>
        {userGenre && (
          <Text style={styles.subtitle}>Discovering {userGenre.name} gems for you</Text>
        )}
      </View>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Movies Section */}
        {movies.length > 0 ? (
          <View style={styles.moviesContainer}>
            <Text style={styles.sectionTitle}>Recommended Hidden Gems</Text>
            <FlatList
              data={movies}
              renderItem={renderMovie}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.moviesList}
            />
            <Text style={styles.sectionTitle}>Critically Acclaimed</Text>
            <FlatList
              data={[...movies].sort((a, b) => b.vote_average - a.vote_average).slice(0, 10)}
              renderItem={renderMovie}
              keyExtractor={(item) => `top_${item.id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.moviesList}
            />
          </View>
        ) : (
          <View style={styles.centerContainer}>
            <Text style={styles.noMoviesText}>No movies found. Try adjusting your preferences.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Archive" component={MyArchiveScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContainer: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, minHeight: 200 },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 4 },
  moviesContainer: { paddingTop: 8 },
  moviesList: { paddingHorizontal: 8, paddingBottom: 16 },
  movieCard: { width: 140, marginHorizontal: 8, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  poster: { width: '100%', height: 200, backgroundColor: '#ddd' },
  noPoster: { justifyContent: 'center', alignItems: 'center' },
  noPosterText: { color: '#888' },
  title: { fontSize: 14, fontWeight: 'bold', padding: 8, height: 60 },
  rating: { position: 'absolute', right: 8, top: 8, backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', padding: 4, borderRadius: 4, fontSize: 12, fontWeight: 'bold' },
  favoriteButton: { position: 'absolute', right: 8, bottom: 70, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 6, zIndex: 10 },
  loadingText: { marginTop: 10, color: '#666', fontSize: 16 },
  errorText: { color: 'red', textAlign: 'center', fontSize: 16 },
  noMoviesText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
});
