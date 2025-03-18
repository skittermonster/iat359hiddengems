import React, { useState } from 'react';
import { View, Button, Image, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import { auth, db } from './firebase';
import { doc, setDoc, collection } from 'firebase/firestore';
import { uploadImage } from './firebaseStorage';

export default function PhotoScreen({ navigation }) {
  const [photoUri, setPhotoUri] = useState(null);
  const [uploading, setUploading] = useState(false);

  const takePhoto = () => {
    const options = {
      mediaType: 'photo',
      saveToPhotos: true, // saves the image to the device gallery
      quality: 0.8,
    };

    launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.error('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', response.errorMessage);
      } else {
        // response.assets is an array; typically, you'll get the first asset
        const asset = response.assets && response.assets[0];
        if (asset) {
          setPhotoUri(asset.uri);
        }
      }
    });
  };

  const handleUpload = async () => {
    if (!photoUri) {
      Alert.alert('Error', 'Please take a photo first');
      return;
    }

    try {
      setUploading(true);
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        Alert.alert('Error', 'You must be logged in to upload photos');
        setUploading(false);
        return;
      }

      // Upload image to Firebase Storage
      const url = await uploadImage(photoUri);
      
      // Save photo data to Firestore
      const photoData = {
        imageUrl: url,
        userId: userId,
        createdAt: new Date().toISOString(),
        type: 'review'
      };
      
      // Create a new document in the photos collection
      const photoCollection = collection(db, 'users', userId, 'photos');
      await setDoc(doc(photoCollection), photoData);
      
      Alert.alert(
        'Success', 
        'Your photo review was uploaded successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Error', 'Failed to upload photo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Photo Review</Text>
      
      <TouchableOpacity 
        style={styles.cameraButton} 
        onPress={takePhoto}
      >
        <Text style={styles.buttonText}>Take Photo</Text>
      </TouchableOpacity>
      
      {photoUri && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photoUri }} style={styles.preview} />
          <TouchableOpacity 
            style={[styles.uploadButton, uploading && styles.disabledButton]} 
            onPress={handleUpload}
            disabled={uploading}
          >
            <Text style={styles.buttonText}>
              {uploading ? 'Uploading...' : 'Upload Photo Review'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  previewContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  preview: {
    width: 300,
    height: 300,
    borderRadius: 8,
    marginBottom: 20,
  },
  cameraButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '80%',
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: 300,
  },
  disabledButton: {
    backgroundColor: '#9E9E9E',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});