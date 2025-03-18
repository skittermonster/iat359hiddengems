// ProfileScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { auth } from './firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log("User signed out successfully.");
      // Once signed out, the AuthStack should be rendered automatically.
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Profile</Text>
      {user ? (
        <>
          <Text style={styles.info}>Email: {user.email}</Text>
          {/* Add more profile details or settings options here */}
          <Button title="Sign Out" onPress={handleSignOut} />
        </>
      ) : (
        <Text style={styles.info}>No user information available.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    marginBottom: 20,
  },
  info: {
    fontSize: 18,
    marginBottom: 10,
  },
});