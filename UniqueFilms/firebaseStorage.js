//firebase storage

import { storage } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// Function to upload an image to Firebase Storage
export const uploadImage = async (uri) => {
  try {
    // Create a unique file name using timestamp and random string
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    // Create a reference to the location where we'll store the file
    const storageRef = ref(storage, `photos/${fileName}`);
    
    // Convert uri to blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Upload the blob
    const uploadTask = uploadBytesResumable(storageRef, blob);
    
    // Wait for upload to complete and get download URL
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Optional: Track upload progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
        },
        (error) => {
          // Handle unsuccessful uploads
          reject(error);
        },
        async () => {
          // Handle successful upload
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  } catch (error) {
    console.error('Error preparing upload:', error);
    throw error;
  }
};
