import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text,
  TextInput,
  Image,
  TouchableOpacity, 
  StyleSheet, 
  Alert 
} from 'react-native';
import { signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { auth, db } from './firebase'; 
// If you have a storage helper, e.g. "uploadImage(uri)", import it here
//import { uploadImage } from './firebaseStorage'; 

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [isEditingUserName, setIsEditingUserName] = useState(false);
  const [newUserName, setNewUserName] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Initialize the editable username state
        setNewUserName(currentUser.displayName || 'User Name');

        // Attempt to fetch existing profilePic from Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          if (userData.profilePic) {
            setProfilePic(userData.profilePic);
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log('User signed out successfully.');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Use the gallery to pick a profile image
  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission to access the gallery is required!');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled) {
        const uri = result.assets[0].uri;
        await updateProfilePic(uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  // Use the camera to capture a profile image
  const handleCaptureImage = async () => {
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
        await updateProfilePic(uri);
      }
    } catch (error) {
      console.error('Error capturing image:', error);
    }
  };

  // Upload the new profile image and update Firestore
  const updateProfilePic = async (uri) => {
    try {
      if (!user) {
        Alert.alert('Error', 'User is not logged in!');
        return;
      }
      // 1) Upload to Firebase Storage to get a download URL
      //    Replace this with your actual upload logic:
      // const downloadUrl = await uploadImage(uri);
      
      // For demonstration, we’ll just store the local URI in Firestore
      const downloadUrl = uri; 

      // 2) Save the downloadUrl to the user doc
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { profilePic: downloadUrl }, { merge: true });
      
      // 3) Update state
      setProfilePic(downloadUrl);
    } catch (error) {
      console.error('Error updating profile picture:', error);
      Alert.alert('Error', 'Could not update profile picture');
    }
  };

  // Handle username update: update Firebase Auth profile and Firestore
  const handleUpdateUserName = async () => {
    if (!newUserName.trim()) {
      Alert.alert('Invalid username', 'Username cannot be empty.');
      return;
    }
    try {
      // Update Firebase Authentication profile
      await updateProfile(user, { displayName: newUserName });
      // Also update Firestore user doc (if you store username there)
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { displayName: newUserName }, { merge: true });
      // Update local state
      setUser({ ...user, displayName: newUserName });
      setIsEditingUserName(false);
      Alert.alert('Success', 'Username updated successfully.');
    } catch (error) {
      console.error('Error updating username:', error);
      Alert.alert('Error', 'Could not update username.');
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.info}>No user information available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top bar with "GEM" and a search icon */}
      <View style={styles.topBar}>
        <Text style={styles.logo}>GEM</Text>
        <Ionicons name="search" size={24} color="#fff" />
      </View>

      {/* Profile Header Section */}
      <View style={styles.profileHeader}>
        {/* Pressing on the avatar triggers picking an image from gallery */}
        <TouchableOpacity onPress={handlePickImage} style={styles.profileImageContainer}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.profileImage} />
          ) : (
            <Ionicons name="person-circle-outline" size={100} color="#555" />
          )}
        </TouchableOpacity>

        {/* Display or Edit Username */}
        {isEditingUserName ? (
          <View style={styles.editUserNameContainer}>
            <TextInput 
              style={styles.userNameInput}
              value={newUserName}
              onChangeText={setNewUserName}
              placeholder="Enter username"
              placeholderTextColor="#ccc"
            />
            <TouchableOpacity onPress={handleUpdateUserName} style={styles.saveUserNameButton}>
              <Text style={styles.saveUserNameButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsEditingUserName(false)} style={styles.cancelUserNameButton}>
              <Text style={styles.cancelUserNameButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setIsEditingUserName(true)}>
            <Text style={styles.userName}>{user.displayName || 'User Name'}</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.userEmail}>{user.email}</Text>

        {/* "My Ratings" Button */}
        <TouchableOpacity 
          style={styles.ratingsButton} 
          onPress={() => navigation.navigate('Ratings')}
        >
          <Ionicons name="star" size={16} color="#fff" />
          <Text style={styles.ratingsButtonText}> My Ratings</Text>
        </TouchableOpacity>

        {/* Extra button for capturing a new image from the camera */}
        <TouchableOpacity 
          style={[styles.ratingsButton, { marginTop: 10, backgroundColor: '#2196F3' }]}
          onPress={handleCaptureImage}
        >
          <Ionicons name="camera" size={16} color="#fff" />
          <Text style={styles.ratingsButtonText}> Capture Image</Text>
        </TouchableOpacity>
      </View>

      {/* Account Settings */}
      <View style={styles.settingsContainer}>
        <Text style={styles.settingsTitle}>Account Settings</Text>
        <TouchableOpacity style={styles.settingsItem} onPress={() => navigation.navigate('EditProfile')}>
          <Text style={styles.settingsItemText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem} onPress={() => navigation.navigate('Subscription')}>
          <Text style={styles.settingsItemText}>Subscription & Billing</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem} onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.settingsItemText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem} onPress={() => navigation.navigate('PrivacySettings')}>
          <Text style={styles.settingsItemText}>Privacy Settings</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem} onPress={() => navigation.navigate('HelpSupport')}>
          <Text style={styles.settingsItemText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

/* Example styling that mimics your attached design. Feel free to customize. */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  topBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#181818',
  },
  logo: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
  },
  profileImageContainer: {
    marginBottom: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  editUserNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userNameInput: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    borderBottomColor: '#fff',
    borderBottomWidth: 1,
    marginRight: 10,
    paddingVertical: 2,
    width: 150,
  },
  saveUserNameButton: {
    backgroundColor: '#4CAF50',
    padding: 6,
    borderRadius: 4,
    marginRight: 5,
  },
  saveUserNameButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  cancelUserNameButton: {
    backgroundColor: '#F44336',
    padding: 6,
    borderRadius: 4,
  },
  cancelUserNameButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  userEmail: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 8,
  },
  ratingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  ratingsButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  settingsContainer: {
    backgroundColor: '#1F1F1F',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  settingsTitle: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomColor: '#333',
    borderBottomWidth: 1,
  },
  settingsItemText: {
    color: '#fff',
    fontSize: 16,
  },
  signOutButton: {
    marginTop: 30,
    alignSelf: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  info: {
    color: '#fff',
    fontSize: 18,
    marginTop: 50,
    textAlign: 'center',
  },
});

