import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { auth, db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  where, 
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { Star, Send, Edit, Trash } from 'lucide-react-native';

export default function RatingsScreen({ route, navigation }) {
  const { movie } = route.params || {};
  
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userReviews, setUserReviews] = useState([]);
  const [userName, setUserName] = useState('');
  const [movieDetails, setMovieDetails] = useState(null);

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (userId) {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            setUserName(userDoc.data().displayName || 'Anonymous User');
          }
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
      }
    };

    fetchUserName();
    
    // If we have a specific movie, fetch that movie's reviews
    if (movie) {
      fetchMovieReviews(movie.id);
      setMovieDetails(movie);
    } else {
      fetchUserReviews();
    }
  }, [movie]);

  const fetchMovieReviews = async (movieId) => {
    try {
      setLoading(true);
      
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('movieId', '==', movieId.toString()),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(reviewsQuery);
      const fetchedReviews = [];
      
      querySnapshot.forEach((doc) => {
        fetchedReviews.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        });
      });
      
      setReviews(fetchedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReviews = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        Alert.alert('Error', 'You must be logged in to view your reviews');
        setLoading(false);
        return;
      }
      
      const userReviewsQuery = query(
        collection(db, 'reviews'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(userReviewsQuery);
      const fetchedReviews = [];
      
      // Create a set of promises to fetch movie details for each review
      const moviePromises = [];
      
      querySnapshot.forEach((doc) => {
        const reviewData = {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        };
        
        fetchedReviews.push(reviewData);
        
        // Create a promise to fetch movie details if not already included
        if (!reviewData.movieTitle || !reviewData.moviePoster) {
          const moviePromise = fetch(
            `https://api.themoviedb.org/3/movie/${reviewData.movieId}?api_key=1102d81d4603c7d20f1fc0ba2d1b6031`
          )
          .then(response => response.json())
          .then(data => {
            // Update the review with movie details
            reviewData.movieTitle = data.title;
            reviewData.moviePoster = data.poster_path;
            return reviewData;
          })
          .catch(error => {
            console.error('Error fetching movie details:', error);
            return reviewData;
          });
          
          moviePromises.push(moviePromise);
        }
      });
      
      // Wait for all movie details to be fetched
      if (moviePromises.length > 0) {
        await Promise.all(moviePromises);
      }
      
      setUserReviews(fetchedReviews);
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      Alert.alert('Error', 'Failed to load your reviews');
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'You must be logged in to leave a review');
      return;
    }
    
    if (!movie) {
      Alert.alert('Error', 'No movie selected for review');
      return;
    }
    
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const reviewData = {
        userId: auth.currentUser.uid,
        userName: userName || 'Anonymous User',
        movieId: movie.id.toString(),
        movieTitle: movie.title,
        moviePoster: movie.poster_path,
        rating: rating,
        review: review.trim(),
        createdAt: serverTimestamp()
      };
      
      // Add to Firestore
      await addDoc(collection(db, 'reviews'), reviewData);
      
      // Reset form
      setRating(0);
      setReview('');
      
      // Refresh reviews
      fetchMovieReviews(movie.id);
      
      Alert.alert('Success', 'Your review has been submitted!');
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit your review: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (reviewId) => {
    try {
      // Delete from Firestore - implementation will depend on your Firestore structure
      // Here we'll use the doc() and deleteDoc() functions
      const reviewRef = doc(db, 'reviews', reviewId);
      await deleteDoc(reviewRef);
      
      // Update local state
      if (movie) {
        // If we're viewing a specific movie's reviews
        setReviews(reviews.filter(review => review.id !== reviewId));
      } else {
        // If we're viewing user's reviews
        setUserReviews(userReviews.filter(review => review.id !== reviewId));
      }
      
      Alert.alert('Success', 'Review deleted successfully');
    } catch (error) {
      console.error('Error deleting review:', error);
      Alert.alert('Error', 'Failed to delete review: ' + error.message);
    }
  };

  const confirmDeleteReview = (reviewId) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteReview(reviewId)
        }
      ]
    );
  };

  const renderStars = (count, onSelect = null) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={onSelect ? () => onSelect(star) : null}
            disabled={!onSelect}
            style={styles.starButton}
          >
            <Star
              size={24}
              color="#FFD700"
              fill={star <= count ? "#FFD700" : "transparent"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderReviewItem = ({ item }) => {
    const isUserReview = item.userId === auth.currentUser?.uid;
    
    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewUserName}>{item.userName || 'Anonymous User'}</Text>
          <Text style={styles.reviewDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        
        {renderStars(item.rating)}
        
        {item.review ? (
          <Text style={styles.reviewText}>{item.review}</Text>
        ) : null}
        
        {isUserReview && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => confirmDeleteReview(item.id)}
          >
            <Trash size={16} color="#F44336" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderUserReviewItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.userReviewCard}
        onPress={() => {
          if (item.movieId) {
            // Navigate to movie details or back to this review
            navigation.navigate('MovieDetail', { movieId: item.movieId });
          }
        }}
      >
        <View style={styles.userReviewContent}>
          <View style={styles.userReviewPosterContainer}>
            {item.moviePoster ? (
              <Image
                source={{ uri: `https://image.tmdb.org/t/p/w200${item.moviePoster}` }}
                style={styles.userReviewPoster}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.noImageContainer}>
                <Text style={styles.noImageText}>No Image</Text>
              </View>
            )}
          </View>
          
          <View style={styles.userReviewDetails}>
            <Text style={styles.userReviewMovieTitle}>{item.movieTitle || 'Unknown Movie'}</Text>
            {renderStars(item.rating)}
            <Text style={styles.userReviewDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            
            {item.review ? (
              <Text style={styles.userReviewText} numberOfLines={2}>{item.review}</Text>
            ) : null}
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => confirmDeleteReview(item.id)}
        >
          <Trash size={16} color="#F44336" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Render different UI based on whether we're viewing a specific movie or the user's reviews
  if (movie) {
    // Movie review view
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {movieDetails ? `Reviews for ${movieDetails.title}` : 'Movie Reviews'}
          </Text>
        </View>
        
        {/* Review Form */}
        <View style={styles.reviewForm}>
          <Text style={styles.ratingLabel}>Rate this movie:</Text>
          {renderStars(rating, setRating)}
          
          <TextInput
            style={styles.reviewInput}
            placeholder="Write your review here..."
            multiline
            value={review}
            onChangeText={setReview}
          />
          
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.disabledButton]}
            onPress={submitReview}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Send size={20} color="white" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Submit Review</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Reviews List */}
        <View style={styles.reviewsList}>
          <Text style={styles.sectionTitle}>All Reviews</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />
          ) : reviews.length > 0 ? (
            <FlatList
              data={reviews}
              renderItem={renderReviewItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.reviewsListContent}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No reviews yet for this movie.</Text>
              <Text style={styles.emptySubText}>Be the first to share your thoughts!</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  } else {
    // User's reviews view
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Reviews</Text>
        </View>
        
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />
        ) : userReviews.length > 0 ? (
          <FlatList
            data={userReviews}
            renderItem={renderUserReviewItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.userReviewsListContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>You haven't reviewed any movies yet.</Text>
            <Text style={styles.emptySubText}>Discover movies and share your thoughts!</Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.browseButtonText}>Browse Movies</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  reviewForm: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  starButton: {
    marginRight: 8,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9E9E9E',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  reviewsList: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    paddingBottom: 8,
  },
  reviewsListContent: {
    padding: 12,
    paddingTop: 0,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewUserName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  reviewDate: {
    color: '#666',
    fontSize: 14,
  },
  reviewText: {
    marginTop: 12,
    color: '#333',
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    padding: 8,
    marginTop: 8,
  },
  deleteButtonText: {
    color: '#F44336',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  loadingIndicator: {
    marginTop: 30,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  browseButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  browseButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userReviewsListContent: {
    padding: 12,
  },
  userReviewCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  userReviewContent: {
    flexDirection: 'row',
  },
  userReviewPosterContainer: {
    width: 80,
    height: 120,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  userReviewPoster: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ddd',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#999',
  },
  userReviewDetails: {
    flex: 1,
  },
  userReviewMovieTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  userReviewDate: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
  },
  userReviewText: {
    color: '#333',
    fontSize: 14,
    lineHeight: 20,
  },
});