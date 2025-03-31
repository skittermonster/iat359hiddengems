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

  // Use the camera to capture a profile image for a photo review
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
      // For demonstration, we’ll just store the local URI in Firestore
      const downloadUrl = uri; 

      // Save the downloadUrl to the user doc
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { profilePic: downloadUrl }, { merge: true });
      
      // Update state
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
      await updateProfile(user, { displayName: newUserName });
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { displayName: newUserName }, { merge: true });
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
      <View style={styles.profileHeaderRow}>
        <TouchableOpacity onPress={handlePickImage} style={styles.profileImageContainer}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.profileImage} />
          ) : (
            <Ionicons name="person-circle-outline" size={80} color="#555" />
          )}
        </TouchableOpacity>

        <View style={styles.userInfoContainer}>
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
        </View>
      </View>

      {/* "My Ratings" Button */}
      <TouchableOpacity 
        style={styles.mainButton} 
        onPress={() => navigation.navigate('Ratings')}
      >
        <Ionicons name="star" size={16} color="#0f0f0f" />
        <Text style={styles.mainButtonText}>  My Ratings</Text>
      </TouchableOpacity>

      {/* "My Notes" Button */}
      <TouchableOpacity 
        style={[styles.mainButton, { marginTop: 10 }]}
        onPress={() => navigation.navigate('Notes')} 
      >
        <Ionicons name="document-text-outline" size={16} color="#0f0f0f" />
        <Text style={styles.mainButtonText}>  My Notes</Text>
      </TouchableOpacity>

      {/* Account Settings */}
      <View style={styles.settingsContainer}>
        <Text style={styles.settingsTitle}>Account Settings</Text>
        <TouchableOpacity style={styles.settingsItem} onPress={() => navigation.navigate('EditProfile')}>
          <View style={styles.settingsItemLeft}>
            <Ionicons name="person-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.settingsItemText}>Edit Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem} onPress={() => navigation.navigate('Subscription')}>
          <View style={styles.settingsItemLeft}>
            <Ionicons name="card-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.settingsItemText}>Subscription & Billing</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem} onPress={() => navigation.navigate('Notifications')}>
          <View style={styles.settingsItemLeft}>
            <Ionicons name="notifications-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.settingsItemText}>Notifications</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem} onPress={() => navigation.navigate('PrivacySettings')}>
          <View style={styles.settingsItemLeft}>
            <Ionicons name="lock-closed-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.settingsItemText}>Privacy Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem} onPress={() => navigation.navigate('HelpSupport')}>
          <View style={styles.settingsItemLeft}>
            <Ionicons name="help-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.settingsItemText}>Help & Support</Text>
          </View>
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
    fontSize: 28,
    fontWeight: 'bold',
  },
  /***** PROFILE HEADER ROW *****/
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userInfoContainer: {
    flex: 1, 
    justifyContent: 'center',
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 4,
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
  /***** BUTTONS *****/
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4ECC3',
    paddingVertical: 10,
    width: '80%', // Both buttons will now have the same width
    borderRadius: 8,
    marginTop: 16,
    alignSelf: 'center',
  },
  mainButtonText: {
    color: '#0f0f0f',
    fontSize: 16,
    fontWeight: '600',
  },
  /***** SETTINGS *****/
  settingsContainer: {
    backgroundColor: '#1F1F1F',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#F4ECC3',
  },
  settingsTitle: {
    color: '#F4ECC3',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomColor: '#333',
    borderBottomWidth: 1,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsItemText: {
    color: '#fff',
    fontSize: 16,
  },
  /***** SIGN OUT *****/
  signOutButton: {
    marginTop: 15,
    alignSelf: 'center',
    backgroundColor: '#F4ECC3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signOutButtonText: {
    color: '#0f0f0f',
    fontSize: 16,
    fontWeight: '600',
  },
  /***** INFO (NO USER) *****/
  info: {
    color: '#fff',
    fontSize: 18,
    marginTop: 50,
    textAlign: 'center',
  },
});
