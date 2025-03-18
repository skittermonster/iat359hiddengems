// App.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './AuthStack';
import MainTabNavigator from './MainTabNavigator';
import OnboardingScreen from './OnboardingScreen';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View, ActivityIndicator } from 'react-native';

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [isOnboarded, setIsOnboarded] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Main auth state listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed:', currentUser ? 'logged in' : 'logged out');
      
      setUser(currentUser);
      
      if (!currentUser) {
        setIsOnboarded(null);
        setInitializing(false);
        return;
      }
      
      // Set up real-time listener for user document
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      // Subscribe to changes on the user document
      const unsubscribeDoc = onSnapshot(userDocRef, 
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const userData = docSnapshot.data();
            console.log('User data updated:', userData);
            setIsOnboarded(userData.isOnboarded === true);
          } else {
            console.log('No user document found');
            setIsOnboarded(false);
          }
          setInitializing(false);
        },
        (error) => {
          console.error('Error listening to user document:', error);
          setIsOnboarded(false);
          setInitializing(false);
        }
      );
      
      // Return cleanup function
      return () => unsubscribeDoc();
    });
    
    return () => unsubscribeAuth();
  }, []);

  if (initializing) {
    // Show a loading screen
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        // Not logged in - show auth stack
        <AuthStack />
      ) : !isOnboarded ? (
        // Logged in but not onboarded - show onboarding
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding">
            {props => <OnboardingScreen {...props} userId={user.uid} />}
          </Stack.Screen>
        </Stack.Navigator>
      ) : (
        // Logged in and onboarded - show main app
        <MainTabNavigator />
      )}
    </NavigationContainer>
  );
}