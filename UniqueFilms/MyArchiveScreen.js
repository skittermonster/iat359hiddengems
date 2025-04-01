import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  ActivityIndicator, 
  Alert
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { auth, db } from './firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  getDoc, 
  setDoc
} from 'firebase/firestore';
import { Trash2, Play, Star } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

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
        const favoritesSnapshot = await getDoc(doc(db, 'users', userId, 'collections', 'favorites'));
        if (favoritesSnapshot.exists()) {
          setFavoriteMovies(favoritesSnapshot.data().movies || {});
        }

        const archivesRef = collection(db, 'archives', userId, 'movies');
        const unsubscribe = onSnapshot(
          archivesRef,
          (querySnapshot) => {
            const movies = [];
            querySnapshot.forEach((doc) => {
              movies.push({ id: doc.id, ...doc.data() });
            });
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

  const removeFromArchive = async (movie) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'You must be logged in to manage your archive');
        return;
      }
      const movieId = movie.id.toString();
      const favoritesDocRef = doc(db, 'users', userId, 'collections', 'favorites');
      const archiveDocRef = doc(db, 'archives', userId, 'movies', movieId);

      const updatedFavorites = { ...favoriteMovies };
      delete updatedFavorites[movieId];

      await deleteDoc(archiveDocRef);
      await setDoc(favoritesDocRef, { movies: updatedFavorites }, { merge: true });
      setFavoriteMovies(updatedFavorites);

      Alert.alert('Removed', `"${movie.title}" removed from your archive`);
    } catch (err) {
      console.error('Error removing from archive:', err);
      Alert.alert('Error', 'Failed to update archive: ' + err.message);
    }
  };

  const handlePlay = (movie) => {
    Alert.alert('Play', `Playing "${movie.title}"...`);
  };

  const renderRightActions = (item) => (
    <TouchableOpacity style={styles.trashAction} onPress={() => removeFromArchive(item)}>
      <Trash2 size={24} color="#FFF" />
    </TouchableOpacity>
  );

  const renderMovie = ({ item }) => (
    <Swipeable renderRightActions={() => renderRightActions(item)}>
      <View style={styles.itemContainer}>
        <Image
          source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
          style={styles.poster}
        />
        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <View style={styles.ratingContainer}>
            <Star size={16} color="#FFC107" fill="#FFC107" />
            <Text style={styles.ratingText}>{item.vote_average?.toFixed(1) || 'N/A'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={() => handlePlay(item)}>
          <Play size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Swipeable>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
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
    <View style={{ flex: 1, backgroundColor: '#181820' }}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#585858', '#181820']} style={styles.logoHeader}>
        <Text style={styles.logo}>GEM</Text>
      </LinearGradient>

      <Text style={styles.archivedTitle}>Archived Gems</Text>

      {archivedMovies.length > 0 ? (
        <FlatList
          data={archivedMovies}
          renderItem={renderMovie}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your archive is empty.</Text>
          <Text style={styles.emptySubText}>
            Add movies to your archive by tapping the bookmark icon when browsing.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  logoHeader: {
    paddingTop: 70,
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Lato',
  },
  archivedTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    marginVertical: 16,
    marginHorizontal: 16,
    fontFamily: 'Righteous',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181820',
    padding: 12,
    marginBottom: 15,
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: 4,
    resizeMode: 'cover',
    marginRight: 12,
    backgroundColor: '#333',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontSize: 14,
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  trashAction: {
    backgroundColor: '#C62828',
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#121212',
  },
  loadingText: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 16,
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
});
