import React, { useState } from 'react';
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

// Example icons from lucide-react-native
import {
  Search,
  PlayCircle,
  Bookmark,
  BookmarkCheck,
  Star as StarIcon,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react-native';

// Example star-rating library or your own star rating logic
// For a real app, consider using something like 'react-native-star-rating-widget' or similar
function SimpleStarRating({ rating, setRating, maxStars = 5 }) {
  const starsArray = Array.from({ length: maxStars }, (_, i) => i + 1);
  return (
    <View style={{ flexDirection: 'row', marginVertical: 8 }}>
      {starsArray.map((star) => (
        <TouchableOpacity key={star} onPress={() => setRating(star)}>
          <StarIcon
            size={24}
            color={star <= rating ? '#FFD700' : '#ccc'}
            fill={star <= rating ? '#FFD700' : 'none'}
            style={{ marginRight: 4 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function MovieDetailScreen({ route, navigation }) {
  // Props passed from the previous screen
  const { movie, isFavorite: initialIsFavorite } = route.params || {};
  // Local states
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite || false);
  const [userReview, setUserReview] = useState('');
  const [userRating, setUserRating] = useState(0);

  // Example reviews (static). In a real app, fetch these from your DB.
  const [reviews, setReviews] = useState([
    {
      id: '1',
      user: 'Writer Winnie',
      rating: 4.0,
      text: 'I was widely smiling the whole time...',
      helpful: 0,
      unhelpful: 0,
    },
    {
      id: '2',
      user: 'Laura Min',
      rating: 5.0,
      text: 'Absolutely amazing. This summer story...',
      helpful: 0,
      unhelpful: 0,
    },
  ]);

  // ----- ARCHIVE / FAVORITE LOGIC (Adapt to your Firestore or local storage) -----
  const handleToggleFavorite = () => {
    // Replace this with your Firestore logic from your original code
    if (!isFavorite) {
      Alert.alert('Archived', `"${movie?.title}" added to your archive`);
    } else {
      Alert.alert('Removed', `"${movie?.title}" removed from your archive`);
    }
    setIsFavorite(!isFavorite);
  };

  // ----- POST REVIEW LOGIC (Adapt to your Firestore or backend) -----
  const handlePostReview = () => {
    if (!userReview.trim()) {
      Alert.alert('Error', 'Please write something before posting a review.');
      return;
    }
    // Example: append a new review to the local array
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

  // ----- RENDER REVIEW ITEM -----
  const renderReviewItem = ({ item }) => {
    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewUser}>{item.user}</Text>
          <Text style={styles.reviewRating}>{item.rating} / 5</Text>
        </View>
        <Text style={styles.reviewText}>{item.text}</Text>
        <View style={styles.reviewActions}>
          <TouchableOpacity
            style={styles.helpfulButton}
            onPress={() => {
              // Example local increment
              const updated = reviews.map((r) =>
                r.id === item.id ? { ...r, helpful: r.helpful + 1 } : r
              );
              setReviews(updated);
            }}
          >
            <ThumbsUp size={16} color="#555" />
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
            <ThumbsDown size={16} color="#555" />
            <Text style={styles.helpfulText}>Unhelpful ({item.unhelpful})</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ----- RENDER "MORE LIKE THIS" (STATIC EXAMPLE) -----
  const moreLikeThisData = [
    {
      id: 'm1',
      title: 'Sweet Dreams',
      poster: 'https://via.placeholder.com/150x220.png?text=Sweet+Dreams',
    },
    {
      id: 'm2',
      title: 'Twist Bye Too Bad',
      poster: 'https://via.placeholder.com/150x220.png?text=Twist+Bye+Too+Bad',
    },
    // Add more if you want
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
      </View>
    );
  };

  // For the background image, fallback if no poster is provided
  const backgroundPoster = movie?.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://via.placeholder.com/500x300.png?text=No+Poster';

  return (
    <View style={styles.screenContainer}>
      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <Text style={styles.navTitle}>GEM</Text>
        <TouchableOpacity style={styles.searchIcon}>
          <Search size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Hero Section with Poster */}
      <ImageBackground
        source={{ uri: backgroundPoster }}
        style={styles.heroImage}
        resizeMode="cover"
      >
        <View style={styles.heroOverlay}>
          {/* Buttons: Play & Archive */}
          <View style={styles.heroButtonsRow}>
            <TouchableOpacity
              style={styles.heroButton}
              onPress={() => Alert.alert('Play', 'Play button tapped!')}
            >
              <PlayCircle size={20} color="white" style={{ marginRight: 6 }} />
              <Text style={styles.heroButtonText}>Play</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.heroButton,
                { backgroundColor: isFavorite ? '#F44336' : '#4CAF50' },
              ]}
              onPress={handleToggleFavorite}
            >
              {isFavorite ? (
                <BookmarkCheck size={20} color="white" style={{ marginRight: 6 }} />
              ) : (
                <Bookmark size={20} color="white" style={{ marginRight: 6 }} />
              )}
              <Text style={styles.heroButtonText}>
                {isFavorite ? 'Archived' : 'Archive'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>

      {/* Movie Details & Overview */}
      <ScrollView style={styles.contentContainer}>
        <View style={styles.movieInfoContainer}>
          <Text style={styles.movieTitle}>{movie?.title || 'Unknown Title'}</Text>
          <Text style={styles.movieSubInfo}>
            {movie?.release_date
              ? new Date(movie.release_date).getFullYear()
              : 'Unknown Year'}
          </Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.movieRating}>
              {movie?.vote_average?.toFixed(1) || 'N/A'}{' '}
            </Text>
            <StarIcon size={20} color="#FFD700" fill="#FFD700" />
          </View>
          <Text style={styles.movieOverview}>
            {movie?.overview ||
              'No overview available for this movie. Stay tuned!'}
          </Text>
        </View>

        {/* Write a Review Section */}
        <View style={styles.reviewInputContainer}>
          <Text style={styles.writeReviewTitle}>Write a Review</Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="Share your thoughts about the movie..."
            placeholderTextColor="#aaa"
            value={userReview}
            onChangeText={(text) => setUserReview(text)}
            multiline
          />
          <Text style={styles.yourRatingText}>Your Rating:</Text>
          <SimpleStarRating rating={userRating} setRating={setUserRating} />
          <TouchableOpacity style={styles.postReviewButton} onPress={handlePostReview}>
            <Text style={styles.postReviewButtonText}>Post Review</Text>
          </TouchableOpacity>
        </View>

        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.reviewSectionTitle}>Reviews</Text>
            {/* Example: average rating out of 5 */}
            <Text style={styles.reviewSectionSubtitle}>
              {(
                reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
              ).toFixed(1)}{' '}
              / 5
            </Text>
          </View>
          <FlatList
            data={reviews.slice(0, 2)} // only show first 2 for example
            keyExtractor={(item) => item.id}
            renderItem={renderReviewItem}
          />
          {reviews.length > 2 && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => Alert.alert('Show More', 'Show all reviews')}
            >
              <Text style={styles.showMoreButtonText}>Show More</Text>
            </TouchableOpacity>
          )}
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
            contentContainerStyle={{ paddingHorizontal: 4 }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Main container
  screenContainer: {
    flex: 1,
    backgroundColor: '#000', // Dark background
  },

  // Top navigation
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#222',
  },
  navTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchIcon: {
    padding: 4,
  },

  // Hero section
  heroImage: {
    width: '100%',
    height: 200,
    justifyContent: 'flex-end',
  },
  heroOverlay: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  heroButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  heroButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Content container
  contentContainer: {
    flex: 1,
    backgroundColor: '#1C1C1C',
  },
  movieInfoContainer: {
    padding: 16,
  },
  movieTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  movieSubInfo: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  movieRating: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
  movieOverview: {
    color: '#ddd',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },

  // Write a Review
  reviewInputContainer: {
    padding: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    margin: 16,
  },
  writeReviewTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  reviewInput: {
    backgroundColor: '#3A3A3A',
    color: 'white',
    borderRadius: 6,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  yourRatingText: {
    color: 'white',
    marginTop: 12,
  },
  postReviewButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12,
  },
  postReviewButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Reviews section
  reviewsSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewSectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewSectionSubtitle: {
    color: '#FFD700',
    fontSize: 14,
  },
  reviewCard: {
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewUser: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  reviewRating: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 14,
  },
  reviewText: {
    color: '#ddd',
    marginVertical: 8,
    fontSize: 14,
  },
  reviewActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  helpfulText: {
    color: '#ccc',
    marginLeft: 4,
  },
  showMoreButton: {
    alignSelf: 'center',
    padding: 8,
  },
  showMoreButtonText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },

  // More Like This
  moreLikeThisContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  moreLikeThisTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  similarMovieCard: {
    width: 120,
    marginRight: 12,
  },
  similarPoster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    backgroundColor: '#444',
    marginBottom: 6,
  },
  similarTitle: {
    color: '#ccc',
    fontSize: 12,
    textAlign: 'center',
  },
});
