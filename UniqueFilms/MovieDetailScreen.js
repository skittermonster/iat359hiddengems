import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ImageBackground,
  Image,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from './firebase';
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

// Icons
import {
  Search,
  Gem,
  Check,
  Share2,
  Star as StarIcon,
  ThumbsUp,
  ThumbsDown,
  Camera,
  Image as ImageIcon,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar'; // make sure this is included
import LineDivider from './assets/Line 3.png';

function SimpleStarRating({ rating, setRating, maxStars = 5, small = false }) {
  const starsArray = Array.from({ length: maxStars }, (_, i) => i + 1);
  return (
    <View style={{ flexDirection: 'row', marginVertical: small ? 2 : 8 }}>
      {starsArray.map((star) => (
        <TouchableOpacity key={star} onPress={() => setRating && setRating(star)}>
          <StarIcon
            size={small ? 16 : 24}
            color={star <= rating ? '#FFD700' : '#555'}
            fill={star <= rating ? '#FFD700' : 'none'}
            style={{ marginRight: 4 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function MovieDetailScreen({ route }) {
  const navigation = useNavigation();

  // Hide default header if not done in stack config:
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const { movie } = route.params;
  const TMDB_API_KEY = '1102d81d4603c7d20f1fc0ba2d1b6031'; // Replace with your actual key

  const [movieDetails, setMovieDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Toggle for archived/favorite
  const [isFavorite, setIsFavorite] = useState(false);

  // Photo reviews
  const [userPhotos, setUserPhotos] = useState([]);

  // Text reviews
  const [userReview, setUserReview] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [reviews, setReviews] = useState([
    {
      id: '1',
      user: 'Winter Winnie',
      rating: 5.0,
      text: "I was widely smiling the whole time...I don't ever write reviews but this movie definitely deserves one.",
      helpful: 10,
      unhelpful: 0,
    },
    {
      id: '2',
      user: 'Laura Min',
      rating: 4.0,
      text: '"Hear Me: Our Summer" is a heartfelt and unforgettable film that touched me deeply.',
      helpful: 4,
      unhelpful: 2,
    },
  ]);

  // Dummy "More Like This" data
  const moreLikeThisData = [
    { id: 'm1', title: 'Sweet Dreams', poster: 'https://via.placeholder.com/150x220.png', rating: 3.5 },
    { id: 'm2', title: 'Twist Bye Too Bad', poster: 'https://via.placeholder.com/150x220.png', rating: 4.0 },
    { id: 'm3', title: 'Other Title', poster: 'https://via.placeholder.com/150x220.png', rating: 4.5 },
  ];

  // Format runtime (e.g., 109 -> "1h 49m")
  const formatRuntime = (mins) => {
    if (!mins) return '';
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${hours}h ${minutes}m`;
  };

  // Fetch movie details
  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}`
        );
        if (!response.ok) {
          const errorText = await response.text();
          console.log('Error response:', errorText);
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setMovieDetails(data);
      } catch (err) {
        console.error('Error fetching movie details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMovieDetails();
  }, [movie.id]);

  // Photo reviews
  useEffect(() => {
    refreshPhotos();
  }, []);

  const refreshPhotos = async () => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      await fetchUserPhotos(userId);
    }
  };

  const fetchUserPhotos = async (userId) => {
    try {
      const photosQuery = query(
        collection(db, 'archives', userId, 'photos'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(photosQuery);
      const photos = [];
      querySnapshot.forEach((docSnap) => {
        photos.push({ id: docSnap.id, ...docSnap.data() });
      });
      setUserPhotos(photos);
    } catch (error) {
      console.error('Error fetching photos:', error);
      Alert.alert('Error', 'Failed to load your photos');
    }
  };

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
          Alert.alert('Error', 'User is not logged in!');
          return;
        }
        const userId = currentUser.uid;
        const photoCollection = collection(db, 'archives', userId, 'photos');
        await setDoc(doc(photoCollection), {
          imageUrl: uri,
          userId: userId,
          createdAt: serverTimestamp(),
          type: 'review',
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
          onPress: () => deletePhoto(photo.id),
        },
      ]
    );
  };

  const renderPhotoItem = ({ item }) => (
    <TouchableOpacity style={styles.photoCard} onPress={() => confirmDeletePhoto(item)}>
      <Image source={{ uri: item.imageUrl }} style={styles.photoThumbnail} resizeMode="cover" />
      <Text style={styles.photoDate}>
        {new Date(
          item.createdAt?.toDate ? item.createdAt.toDate() : item.createdAt
        ).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  // Archive/favorite toggle
  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  // Posting text reviews
  const handlePostReview = () => {
    if (!userReview.trim()) {
      Alert.alert('Error', 'Please write something before posting a review.');
      return;
    }
    const newReview = {
      id: Math.random().toString(36).substring(2),
      user: 'Current User',
      rating: userRating,
      text: userReview.trim(),
      helpful: 0,
      unhelpful: 0,
    };
    setReviews([newReview, ...reviews]);
    setUserReview('');
    setUserRating(0);
    Alert.alert('Review Posted', 'Your review has been added.');
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.userInfoContainer}>
          <Image
            source={{ uri: 'https://via.placeholder.com/30x30' }}
            style={styles.userAvatar}
          />
          <Text style={styles.reviewUser}>{item.user}</Text>
        </View>
        <SimpleStarRating rating={item.rating} small={true} />
      </View>
      <Text style={styles.reviewText}>{item.text}</Text>
      <View style={styles.reviewActions}>
        <TouchableOpacity
          style={styles.helpfulButton}
          onPress={() => {
            const updated = reviews.map((r) =>
              r.id === item.id ? { ...r, helpful: r.helpful + 1 } : r
            );
            setReviews(updated);
          }}
        >
          <ThumbsUp size={16} color="#888" />
          <Text style={styles.helpfulText}>Helpful ({item.helpful})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.helpfulButton}
          onPress={() => {
            const updated = reviews.map((r) =>
              r.id === item.id ? { ...r, unhelpful: r.unhelpful + 1 } : r
            );
            setReviews(updated);
          }}
        >
          <ThumbsDown size={16} color="#888" />
          <Text style={styles.helpfulText}>Unhelpful ({item.unhelpful})</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // "More Like This" render
  const renderSimilarMovie = ({ item }) => (
    <View style={styles.similarMovieCard}>
      <Image source={{ uri: item.poster }} style={styles.similarPoster} resizeMode="cover" />
      <Text style={styles.similarTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <View style={styles.smallRatingContainer}>
        <StarIcon size={14} color="#FFD700" fill="#FFD700" />
        <Text style={styles.smallRatingText}>{item.rating}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.screenContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#F5F5DC" />
        <Text style={{ color: 'white', marginTop: 10 }}>Loading movie details...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.screenContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
<View style={{ flex: 1, backgroundColor: '#181820' }}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
  
  <LinearGradient colors={['#585858', '#181820']} style={styles.logoHeader}>
          <Text style={styles.logo}>GEM</Text>
          <TouchableOpacity style={styles.searchIcon}>
            <Search color="#fff" size={22} />
          </TouchableOpacity>
  </LinearGradient>

      <ScrollView style={styles.contentContainer}>
        {/* Poster/Thumbnail */}
        <ImageBackground
  source={{
    uri: movieDetails?.poster_path
      ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`
      : 'https://via.placeholder.com/400x200',
  }}
  style={styles.heroImage}
  resizeMode="cover"
/>

        {/* Button Row BELOW the poster */}
        <View style={styles.buttonRow}>
  {/* Left-aligned Play button */}
  <TouchableOpacity
  style={styles.playButtonRow}
  onPress={() => Alert.alert('Play', 'Play button tapped!')}
>
  <Image
    source={require('./assets/Play.png')}
    style={styles.playIcon}
  />
  <Text style={styles.playButtonText}>Play</Text>
</TouchableOpacity>

  {/* Right-aligned Archive and Share buttons in a column */}
  <View style={styles.rightButtons}>
    <TouchableOpacity style={styles.smallButton} onPress={handleToggleFavorite}>
    {isFavorite ? (
    <Check size={26} color="#FFF1D4" />
  ) : (
    <Gem size={25} color="#FFFFFF" />
  )}
      <Text
    style={[styles.smallButtonText, isFavorite && { color: '#FFF1D4' }]}>
    {isFavorite ? 'Archived' : 'Archive'}
  </Text>
</TouchableOpacity>

    <TouchableOpacity
      style={styles.smallButton}
      onPress={() => Alert.alert('Share', 'Share this movie')}
    >
      <Share2 size={24} color="white" />
      <Text style={styles.smallButtonText}>Share</Text>
    </TouchableOpacity>
  </View>
</View>

        {/* Movie Info */}
        <View style={styles.movieInfoContainer}>
          <Text style={styles.movieTitle}>{movieDetails.title}</Text>
          <View style={styles.ratingRow}>
            <StarIcon size={16} color="#FFD700" fill="#FFD700" />
            <Text style={styles.movieRating}>
              {movieDetails.vote_average ? movieDetails.vote_average.toFixed(1) : 'N/A'}
            </Text>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.movieRuntime}>{formatRuntime(movieDetails.runtime)}</Text>
          </View>
          <Text style={styles.movieOverview}>{movieDetails.overview}</Text>
        </View>
        <Image
  source={LineDivider}
  style={styles.lineDivider}
/>

        {/* Photo Reviews */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Photo Reviews</Text>
            <TouchableOpacity
  style={styles.showMoreButton}
  onPress={() => Alert.alert('All Photos')}
>
  <Text style={styles.showMoreButtonText}>View All</Text>
</TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.cameraButton} onPress={captureImage} activeOpacity={0.7}>
  <Camera size={20} color="black" style={styles.buttonIcon} />
  <Text style={[styles.buttonText, { color: 'black' }]}>Add Photo Review</Text>
</TouchableOpacity>
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

        {/* Write a Review */}
        <View style={styles.reviewInputContainer}>
          <Text style={styles.writeReviewTitle}>Written Reviews</Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="Share your thoughts about the movie..."
            placeholderTextColor="#888"
            value={userReview}
            onChangeText={setUserReview}
            multiline
          />
          <View style={styles.ratingSubmitRow}>
            <View style={styles.yourRatingContainer}>
              <Text style={styles.yourRatingText}>Your Rating:</Text>
              <SimpleStarRating rating={userRating} setRating={setUserRating} />
            </View>
            <TouchableOpacity style={styles.postReviewButton} onPress={handlePostReview}>
              <Text style={styles.postReviewButtonText}>Post Review</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reviews List */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.reviewSectionTitle}>Reviews</Text>
            <Text style={styles.reviewSectionRating}>
              4.5<Text style={styles.reviewMaxRating}> / 5</Text>
            </Text>
          </View>
          <FlatList
            data={reviews}
            keyExtractor={(item) => item.id}
            renderItem={renderReviewItem}
            scrollEnabled={false}
          />
          <TouchableOpacity
            style={styles.showMoreButton}
            onPress={() => Alert.alert('Show More', 'Show all reviews')}
          >
            <Text style={styles.showMoreButtonText}>Show More</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
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
  searchIcon: {
    marginLeft: 'auto',
    marginRight: 5,
  },
  backIcon: {
    padding: 4,
    marginRight: 8,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#181820',
  },
  heroImage: {
    width: '100%',
    height: 220,
  },
  buttonRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 20,
  marginTop: 12,
  marginBottom: 10,
  gap: 16, // optional for extra space between Play and Right Buttons
},
smallButton: {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 6,
  paddingHorizontal: 8,
},
smallButtonText: {
  color: 'white',
  fontSize: 14, // previously 12
  marginTop: 6, // more breathing space
},
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5DC',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  
  playButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#181820',
  },
  playButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5DC',
    paddingVertical: 11,
    paddingHorizontal:70,
    borderRadius: 5,
    justifyContent: 'center',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12, // reduces space between Archive & Share
    marginRight: 6, // moves the group slightly to the left
  },
  
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  iconButtonText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  playIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
    resizeMode: 'contain',
  },
  playButtonText: {
    color: '#111',
    fontSize: 16,
  },
  movieInfoContainer: {
    padding: 16,
  },
  movieTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily:'Righteous',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  movieRating: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 4,
    marginRight: 6,
  },
  bulletPoint: {
    color: '#888',
    marginRight: 6,
  },
  movieRuntime: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  movieOverview: {
    color: 'rgba(255, 255, 255, 0.87)',
    fontSize: 14,
    lineHeight: 20,
  },
  sectionContainer: {
    marginVertical: 40,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily:'Righteous'
  },
  viewAllButton: {
    padding: 8,
  },
  viewAllText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  cameraButton: {
    backgroundColor: '#F2EFD0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  photosList: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  photoCard: {
    width: 120,
    height: 160,
    marginHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoThumbnail: {
    width: '100%',
    height: 120,
    backgroundColor: '#ddd',
  },
  photoDate: {
    fontSize: 12,
    color: '#666',
    padding: 8,
    textAlign: 'center',
  },
  emptyPhotosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  emptyPhotosText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  reviewInputContainer: {
    padding: 16,
  },
  writeReviewTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    fontFamily:'Righteous'
  },
  reviewInput: {
    backgroundColor: '#fff',   // white box
    color: '#000',             // black text
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#999',       
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  ratingSubmitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  yourRatingContainer: {
    flex: 1,
  },
  yourRatingText: {
    color: '#BBB',
    fontSize: 14,
    marginBottom: 4,
  },
  postReviewButton: {
    backgroundColor: '#F5F5DC',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  postReviewButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
  reviewsSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    fontFamily:'Righteous',
  },
  reviewSectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily:'Righteous'
  },
  reviewSectionRating: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewMaxRating: {
    color: '#999',
    fontWeight: 'normal',
  },
  reviewCard: {
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: '#444',
  },
  reviewUser: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  reviewText: {
    color: '#ddd',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewActions: {
    flexDirection: 'row',
    marginTop: 4,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  helpfulText: {
    color: '#999',
    fontSize: 12,
    marginLeft: 4,
  },
  showMoreButton: {
    alignSelf: 'center',
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 8,
  },
  showMoreButtonText: {
    color: '#CCC',
    fontSize: 14,
  },
  lineDivider: {
    width: '100%', // wider than before (you can try '95%' or '100%' too)
    height: 4,
    resizeMode: 'contain',
    marginTop: 20,
    alignSelf: 'center', // centers the image horizontally
  },
});


