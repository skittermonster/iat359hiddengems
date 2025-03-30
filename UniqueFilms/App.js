// App.js 
import * as Font from 'expo-font';
import { useFonts } from 'expo-font';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import FirstPage from './FirstPage';
import LoginScreen from './LoginScreen';
import SignupScreen from './SignupScreen';
import OnboardingScreen from './OnboardingScreen';
import RatingsScreen from './RatingsScreen';
import HomeScreen from './HomeScreen';           // make sure this exists
import MovieDetailScreen from './MovieDetailScreen'; // make sure this exists
import PhotoGalleryScreen from './PhotoGalleryScreen'; // make sure this exists
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View, ActivityIndicator } from 'react-native';

const Stack = createStackNavigator();

// Create a new stack navigator that integrates your screens.
function MainStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="MovieDetail" component={MovieDetailScreen} />
      <Stack.Screen 
        name="Ratings" 
        component={RatingsScreen} 
        options={({ route }) => ({ 
          title: route.params?.movie ? `Rate ${route.params.movie.title}` : "Your Reviews" 
        })}
      />
      <Stack.Screen name="PhotoGallery" component={PhotoGalleryScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [isOnboarded, setIsOnboarded] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const [fontsLoaded] = useFonts({
    Righteous: require('./assets/Righteous-Regular.ttf'),
    Lato_Black: require('./assets/Lato-Black.ttf')
  });

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed:', currentUser ? 'logged in' : 'logged out');
      setUser(currentUser);
      
      if (!currentUser) {
        setIsOnboarded(null);
        setInitializing(false);
        return;
      }
      
      // Set up a real-time listener for the user's document in Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
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
      
      // Cleanup document subscription when the auth state changes
      return () => unsubscribeDoc();
    });
    
    return () => unsubscribeAuth();
  }, []);

  if (initializing) {
    // Render a loading indicator while the app initializes
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
        // If no user is logged in, show the authentication flow.
        <Stack.Navigator initialRouteName="FirstPage" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="FirstPage" component={FirstPage} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </Stack.Navigator>
      ) : !isOnboarded ? (
        // If the user hasn't completed onboarding, show the OnboardingScreen.
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding">
            {props => <OnboardingScreen {...props} userId={user.uid} />}
          </Stack.Screen>
        </Stack.Navigator>
      ) : (
        // If logged in and onboarded, render the MainStackNavigator.
        <MainStackNavigator />
      )}
    </NavigationContainer>
  );
}
