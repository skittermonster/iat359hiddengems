import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ImageBackground,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList
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
  serverTimestamp 
} from 'firebase/firestore';

// Icons
import {
  Search,
  Play,
  Check,
  Share2,
  Star as StarIcon,
  ThumbsUp,
  ThumbsDown,
  Camera,
  Image as ImageIcon
} from 'lucide-react-native';

// Star rating component
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

export default function MovieDetailScreen({ route, navigation }) {
  // Movie data (for demo purposes – normally comes via props or API)
  const movie = {
    id: 1,
    title: 'Hear Me: Our Summer',
    overview: 'Young Jun works part-time at his parents\' lunch box house. Yeo Reum lives only to support a hearing-impaired swimmer sister. One day, Young Jun meets Yeo Reum at the swimming lunch boxes and falls in love at first sight. Yeo Reum slowly opens her heart to warm-hearted Young Jun.',
    rating: 4.2,
    runtime: '1h 49m',
    poster_path: 'https://example.com/poster.jpg'
  };

  // States for favorite/archive and reviews (already present)
  const [isFavorite, setIsFavorite] = useState(true);
  const [userReview, setUserReview] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [reviews, setReviews] = useState([
    {
      id: '1',
      user: 'Winter Winnie',
      rating: 5.0,
      text: 'I was widely smiling the whole time...I don\'t ever write reviews but this movie definitely deserves one.',
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

  // New state for photo reviews
  const [userPhotos, setUserPhotos] = useState([]);

  // Fetch user's photo reviews on mount
  useEffect(() => {
    refreshPhotos();
  }, []);

  // Photo review functions
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

  const refreshPhotos = async () => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      await fetchUserPhotos(userId);
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

  const renderPhotoItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.photoCard}
        onPress={() => {
          // For simplicity, prompt deletion on press.
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

  // Existing functions for toggling favorites and posting reviews
  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

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

  const renderReviewItem = ({ item }) => {
    return (
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
  };

  // More Like This data and render function remain unchanged
  const moreLikeThisData = [
    { id: 'm1', title: 'Sweet Dreams', poster: 'https://via.placeholder.com/150x220.png', rating: 3.5 },
    { id: 'm2', title: 'Twist Bye Too Bad', poster: 'https://via.placeholder.com/150x220.png', rating: 4.0 },
    { id: 'm3', title: 'Other Title', poster: 'https://via.placeholder.com/150x220.png', rating: 4.5 },
  ];
  
  const renderSimilarMovie = ({ item }) => {
    return (
      <View style={styles.similarMovieCard}>
        <Image
          source={{ uri: item.poster }}
          style={styles.similarPoster}
          resizeMode="cover"
        />
        <Text style={styles.similarTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.smallRatingContainer}>
          <StarIcon size={14} color="#FFD700" fill="#FFD700" />
          <Text style={styles.smallRatingText}>{item.rating}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screenContainer}>
      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <Text style={styles.navTitle}>GEM</Text>
        <TouchableOpacity style={styles.searchIcon}>
          <Search size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentContainer}>
        {/* Hero Section with Poster */}
        <ImageBackground
          source={{ uri: movie.poster_path || 'https://via.placeholder.com/400x200' }}
          style={styles.heroImage}
          resizeMode="cover"
        >
          <View style={styles.heroOverlay}>
            <View style={styles.heroButtonsContainer}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={() => Alert.alert('Play', 'Play button tapped!')}
              >
                <Play size={20} color="#111" style={{ marginRight: 8 }} />
                <Text style={styles.playButtonText}>Play</Text>
              </TouchableOpacity>
              <View style={styles.smallButtonsContainer}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleToggleFavorite}
                >
                  <Check size={20} color="white" />
                  <Text style={styles.iconButtonText}>Archived</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => Alert.alert('Share', 'Share this movie')}
                >
                  <Share2 size={20} color="white" />
                  <Text style={styles.iconButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ImageBackground>

        {/* Movie Details */}
        <View style={styles.movieInfoContainer}>
          <Text style={styles.movieTitle}>{movie.title}</Text>
          <View style={styles.ratingRow}>
            <StarIcon size={16} color="#FFD700" fill="#FFD700" />
            <Text style={styles.movieRating}>{movie.rating}</Text>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.movieRuntime}>{movie.runtime}</Text>
          </View>
          <Text style={styles.movieOverview}>{movie.overview}</Text>
        </View>

        {/* Photo Reviews Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Photo Reviews</Text>
            {/* Optionally, add a "View All" if needed */}
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={captureImage}
            activeOpacity={0.7}
          >
            <Camera size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Add Photo Review</Text>
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

        {/* Write a Review Section */}
        <View style={styles.reviewInputContainer}>
          <Text style={styles.writeReviewTitle}>Write A Review</Text>
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

        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.reviewSectionTitle}>Reviews</Text>
            <Text style={styles.reviewSectionRating}>4.5<Text style={styles.reviewMaxRating}> / 5</Text></Text>
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

        {/* More Like This Section */}
        <View style={styles.moreLikeThisContainer}>
          <Text style={styles.moreLikeThisTitle}>More Like This</Text>
          <FlatList
            data={moreLikeThisData}
            keyExtractor={(item) => item.id}
            renderItem={renderSimilarMovie}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 4 }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Screen container and navigation styles
  screenContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
  },
  navTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  searchIcon: {
    padding: 4,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  // Hero section styles
  heroImage: {
    width: '100%',
    height: 220,
    justifyContent: 'flex-end',
  },
  heroOverlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingBottom: 16,
  },
  heroButtonsContainer: {
    paddingHorizontal: 16,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5DC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginBottom: 12,
  },
  playButtonText: {
    color: '#111',
    fontSize: 16,
    fontWeight: 'bold',
  },
  smallButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  iconButton: {
    alignItems: 'center',
    marginLeft: 24,
  },
  iconButtonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  // Movie details styles
  movieInfoContainer: {
    padding: 16,
  },
  movieTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  movieRating: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
    marginRight: 6,
  },
  bulletPoint: {
    color: '#888',
    marginRight: 6,
  },
  movieRuntime: {
    color: '#888',
    fontSize: 14,
  },
  movieOverview: {
    color: '#CCC',
    fontSize: 14,
    lineHeight: 20,
  },
  // Photo Reviews section styles
  sectionContainer: {
    marginVertical: 12,
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
  },
  viewAllButton: {
    padding: 8,
  },
  viewAllText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  cameraButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 8,
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
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
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
  // Write a Review section styles
  reviewInputContainer: {
    padding: 16,
  },
  writeReviewTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  reviewInput: {
    backgroundColor: '#222',
    color: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
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
  // Reviews section styles
  reviewsSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewSectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
  // More Like This section styles
  moreLikeThisContainer: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  moreLikeThisTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  similarMovieCard: {
    width: 120,
    marginRight: 12,
  },
  similarPoster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    backgroundColor: '#333',
    marginBottom: 6,
  },
  similarTitle: {
    color: 'white',
    fontSize: 14,
    marginBottom: 2,
  },
  smallRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallRatingText: {
    color: '#FFD700',
    fontSize: 12,
    marginLeft: 2,
  },
});

