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
import * as ImagePicker from 'expo-image-picker';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MyArchiveScreen from './MyArchiveScreen';
import ProfileScreen from './ProfileScreen.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
import { Bookmark, BookmarkCheck, Camera, Star, X, Image as ImageIcon } from 'lucide-react-native';

// TMDB API key
const TMDB_API_KEY = '1102d81d4603c7d20f1fc0ba2d1b6031';

function HomeScreen({ navigation }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userGenre, setUserGenre] = useState(null);
  const [favoriteMovies, setFavoriteMovies] = useState({});
  const [userPhotos, setUserPhotos] = useState([]);

  // Fetch user preferences, favorites, and photos
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
        // Get user photos
        await fetchUserPhotos(userId);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
      }
    };
    fetchUserData();
  }, []);

  const fetchUserPhotos = async (userId) => {
    try {
      const photosQuery = query(
        collection(db, 'archives', userId, 'photos'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(photosQuery);
      const photos = [];
      querySnapshot.forEach((doc) => {
        photos.push({ id: doc.id, ...doc.data() });
      });
      setUserPhotos(photos);
    } catch (error) {
      console.error('Error fetching photos:', error);
      Alert.alert('Error', 'Failed to load your photos');
    }
  };

  const refreshPhotos = async () => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      await fetchUserPhotos(userId);
    }
  };

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

  // --- New Camera Capture Logic (from working example) ---
  const captureImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission to access the camera is required!');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const currentUser = auth.currentUser;
        if (!currentUser) {
          Alert.alert("User is not logged in!");
          return;
        }
        const userId = currentUser.uid;
        const photoCollection = collection(db, 'archives', userId, 'photos');
        await setDoc(doc(photoCollection), {
          imageUrl: uri,
          userId: userId,
          createdAt: serverTimestamp(),
          type: 'review'
        });
        Alert.alert('Success', 'Photo review captured and uploaded!');
        await refreshPhotos();
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'Could not capture image');
    }
  };

  const deletePhoto = async (photoId) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      await deleteDoc(doc(db, 'archives', userId, 'photos', photoId));
      await refreshPhotos();
      Alert.alert('Success', 'Photo deleted successfully');
    } catch (error) {
      console.error('Error deleting photo:', error);
      Alert.alert('Error', 'Failed to delete photo: ' + error.message);
    }
  };

  const confirmDeletePhoto = (photo) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deletePhoto(photo.id)
        }
      ]
    );
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

  const renderPhotoItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.photoCard}
        onPress={() => {
          // For simplicity, we prompt deletion on press.
          confirmDeletePhoto(item);
        }}
      >
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.photoThumbnail}
          resizeMode="cover"
        />
        <Text style={styles.photoDate}>
          {new Date(item.createdAt?.toDate ? item.createdAt.toDate() : item.createdAt).toLocaleDateString()}
        </Text>
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
        {/* Action Buttons */}
        <View style={styles.actionButtonContainer}>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={captureImage}  // Uses new working logic
            activeOpacity={0.7}
          >
            <Camera size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Add Photo Review</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cameraButton, { backgroundColor: '#2196F3', marginTop: 12 }]}
            onPress={() => navigation.navigate('Ratings')}
            activeOpacity={0.7}
          >
            <Star size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Your Reviews</Text>
          </TouchableOpacity>
        </View>
        {/* User Photos Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Your Photo Reviews</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('PhotoGallery', { photos: userPhotos, onDeletePhoto: refreshPhotos })}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {userPhotos.length > 0 ? (
            <FlatList
              data={userPhotos.slice(0, 5)}
              renderItem={renderPhotoItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosList}
            />
          ) : (
            <View style={styles.emptyPhotosContainer}>
              <ImageIcon size={40} color="#999" />
              <Text style={styles.emptyPhotosText}>
                No photo reviews yet. Capture some photos of your movie experiences!
              </Text>
            </View>
          )}
        </View>
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
  sectionContainer: { marginVertical: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  viewAllButton: { padding: 8 },
  viewAllText: { color: '#2196F3', fontWeight: 'bold' },
  moviesContainer: { paddingTop: 8 },
  moviesList: { paddingHorizontal: 8, paddingBottom: 16 },
  photosList: { paddingHorizontal: 8 },
  movieCard: { width: 140, marginHorizontal: 8, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  photoCard: { width: 120, height: 160, marginHorizontal: 8, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  photoThumbnail: { width: '100%', height: 120, backgroundColor: '#ddd' },
  photoDate: { fontSize: 12, color: '#666', padding: 8, textAlign: 'center' },
  poster: { width: '100%', height: 200, backgroundColor: '#ddd' },
  noPoster: { justifyContent: 'center', alignItems: 'center' },
  noPosterText: { color: '#888' },
  title: { fontSize: 14, fontWeight: 'bold', padding: 8, height: 60 },
  rating: { position: 'absolute', right: 8, top: 8, backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', padding: 4, borderRadius: 4, fontSize: 12, fontWeight: 'bold' },
  favoriteButton: { position: 'absolute', right: 8, bottom: 70, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 6, zIndex: 10 },
  loadingText: { marginTop: 10, color: '#666', fontSize: 16 },
  errorText: { color: 'red', textAlign: 'center', fontSize: 16 },
  noMoviesText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  actionButtonContainer: { paddingHorizontal: 16, marginVertical: 16 },
  cameraButton: { backgroundColor: '#4CAF50', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
  buttonIcon: { marginRight: 8 },
});
