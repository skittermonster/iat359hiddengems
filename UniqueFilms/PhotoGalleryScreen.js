import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
  Dimensions
} from 'react-native';
import { doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { X, Trash2 } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function PhotoGalleryScreen({ route, navigation }) {
  const { photos = [], onDeletePhoto } = route.params;
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const deletePhoto = async (photoId) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      
      // Delete the photo document from Firestore
      await deleteDoc(doc(db, 'users', userId, 'photos', photoId));
      
      // Close the photo viewer
      setViewerVisible(false);
      setSelectedPhoto(null);
      
      // Call the refresh callback from the parent component
      if (onDeletePhoto) {
        onDeletePhoto();
      }
      
      Alert.alert('Success', 'Photo deleted successfully');
      
      // Navigate back if there are no photos left
      const updatedPhotos = photos.filter(photo => photo.id !== photoId);
      if (updatedPhotos.length === 0) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      Alert.alert('Error', 'Failed to delete photo: ' + error.message);
    }
  };

  const openPhotoViewer = (photo) => {
    setSelectedPhoto(photo);
    setViewerVisible(true);
  };

  const renderPhotoItem = ({ item, index }) => {
    // Calculate dimensions for grid layout (2 columns)
    const itemWidth = (width - 48) / 2;
    
    return (
      <TouchableOpacity 
        style={[styles.photoItem, { width: itemWidth }]}
        onPress={() => openPhotoViewer(item)}
      >
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.photoImage}
          resizeMode="cover"
        />
        <Text style={styles.photoDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    );
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Photo Viewer Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Photo Review</Text>
              <TouchableOpacity onPress={() => setViewerVisible(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {selectedPhoto && (
              <View style={styles.photoViewerContainer}>
                <Image 
                  source={{ uri: selectedPhoto.imageUrl }} 
                  style={styles.viewerImage}
                  resizeMode="contain"
                />
                <Text style={styles.photoViewerDate}>
                  Taken on: {formatDate(selectedPhoto.createdAt)}
                </Text>
                
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    Alert.alert(
                      'Delete Photo',
                      'Are you sure you want to delete this photo?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Delete', 
                          style: 'destructive',
                          onPress: () => deletePhoto(selectedPhoto.id)
                        }
                      ]
                    );
                  }}
                >
                  <Trash2 size={20} color="white" style={styles.buttonIcon} />
                  <Text style={styles.deleteButtonText}>Delete Photo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <X size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Photo Reviews</Text>
        <View style={styles.headerRight} />
      </View>

      {photos.length > 0 ? (
        <FlatList
          data={photos}
          renderItem={renderPhotoItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.photosGrid}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No photos found. Add some photo reviews from the home screen.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    width: 24, // For balanced centering
  },
  photosGrid: {
    padding: 16,
  },
  photoItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  photoImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#ddd',
  },
  photoDate: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  photoViewerContainer: {
    alignItems: 'center',
    padding: 16,
  },
  viewerImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  photoViewerDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    marginBottom: 16,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
});