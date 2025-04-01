import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView, Alert, ScrollView } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MyArchiveScreen from './MyArchiveScreen';
import ProfileScreen from './ProfileScreen.js';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, deleteDoc, collection } from 'firebase/firestore';
import { Bookmark, BookmarkCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Search } from 'lucide-react-native';

export default HomeScreen;

const TMDB_API_KEY = '1102d81d4603c7d20f1fc0ba2d1b6031';


function HomeScreen({ navigation }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userGenre, setUserGenre] = useState(null);
  const [favoriteMovies, setFavoriteMovies] = useState({});
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists() && userDoc.data().preferredGenre) {
          setUserGenre(userDoc.data().preferredGenre);
        } else {
          setError('No genre preferences found');
        }
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
        const genreFilter = `&with_genres=${userGenre.id}`;
        const response = await fetch(
          `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}${genreFilter}&sort_by=vote_average.desc&vote_count.gte=50&vote_count.lte=1000&page=1`
        );
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          setMovies(data.results);
          setFeaturedMovie(data.results[Math.floor(Math.random() * data.results.length)]);
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
        Alert.alert('Removed', `${movie.title} removed from your archive`);
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
        Alert.alert('Added', `${movie.title} added to your archive`);
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
        <View style={{ position: 'relative' }}>
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
            <Image
              source={
                isFavorite
                  ? require('./assets/Saved.png')
                  : require('./assets/UnSaved.png')
              }
              style={styles.favoriteIcon}
            />
          </TouchableOpacity>
        </View>
  
        {/* Bottom white section */}
        <View style={styles.movieInfo}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">{item.title}</Text>
          <View style={styles.ratingContainer}>
  <Text style={styles.star}>★</Text>
  <Text style={styles.rating}>{item.vote_average.toFixed(1)}</Text>
</View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#181820' }}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
  
      <LinearGradient colors={['#585858', '#181820']} style={styles.logoHeader}>
        <Text style={styles.logo}>GEM</Text>
        <TouchableOpacity style={styles.searchIcon}>
          <Search color="#fff" size={22} />
        </TouchableOpacity>
      </LinearGradient>
  
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.moviesContainer}>
          <Text style={styles.sectionTitle}>Gems You May Like</Text>
          <FlatList
            data={movies.slice(0, 10)}
            renderItem={renderMovie}
            keyExtractor={(item) => `new_${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moviesList}
          />
  
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.genreScroll}
          >
            {['All', 'Romance', 'Horror', 'Action', 'Animation'].map((genre) => (
  <TouchableOpacity
    key={genre}
    style={[
      styles.genreButton,
      selectedCategory === genre && styles.selectedGenreButton, // 👈 Apply highlight style if selected
    ]}
    onPress={() => setSelectedCategory(genre)}
  >
    <Text style={styles.genreText}>{genre}</Text>
  </TouchableOpacity>
))}
          </ScrollView>
          <FlatList
            data={movies}
            renderItem={renderMovie}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moviesList}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#181820' },
  scrollContainer: { flex: 1 },
  logoHeader: {
    paddingTop: 70,
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // ensures logo left, icon right
  },
  logoGlow: {
    position: 'absolute',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: '#FFFFFF',
    textShadowRadius: 7,
    zIndex: 0,
    fontFamily: 'Lato',
  },
  logo: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
    zIndex: 1,
    fontFamily: 'Lato',
  },
  searchIcon: {
    marginLeft: 'auto',
    marginRight: 5,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#F2EFD0',
    fontFamily: 'Righteous',
    marginTop: 25,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  genreScroll: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20, // 👈 This adds space below the category buttons
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 40,
  },
  genreButton: {
    borderWidth: 1,
    borderColor: '#F2EFD0',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  selectedGenreButton: {
    backgroundColor: '#FFFFFF33', // white at 20% opacity
  },
  genreText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Mada', // or default
  },
  moviesContainer: { paddingTop: 8 },
  moviesList: { 
    paddingHorizontal: 8, 
    paddingBottom: 16 
  },
  movieCard: {
    width: 150,
    marginHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'visible', // allow icon overflow
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  movieInfo: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    position: 'relative',
  },
  poster: {
    width: '100%',
    height: 200,
    backgroundColor: '#ddd',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  noPoster: { justifyContent: 'center', alignItems: 'center' },
  noPosterText: { color: '#888' },
  title: {
    fontSize: 14,
    fontWeight: '500',
    marginTop:2,
    marginLeft:3,
    marginBottom: 23, // push space to fit rating
    color: '#000',
  },
  ratingContainer: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft:3,
  },
  
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ACABAB',
  },
  star: {
    fontSize: 14,
    color: '#FFD700', // yellow
    marginRight: 2,
  },

  favoriteButton: {
    position: 'absolute',
    bottom: 0,  // 👈 now at bottom of poster
    right: 0,
    zIndex: 10,
  },

  favoriteIcon: {
    width: 55,
    height: 55,
    resizeMode: 'contain',
  },
  
  loadingText: { marginTop: 10, color: '#666', fontSize: 16 },
  errorText: { color: 'red', textAlign: 'center', fontSize: 16 },
  noMoviesText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
});