// MainTabNavigator.js

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home as HomeIcon, Gem, User as UserIcon } from 'lucide-react-native';

import HomeScreen from './HomeScreen';
import MyArchiveScreen from './MyArchiveScreen';
import ProfileScreen from './ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      // Common styling for the tab bar
      screenOptions={({ route }) => ({
        // Provide a function that returns the icon based on the route name
        tabBarIcon: ({ focused, color, size }) => {
          switch (route.name) {
            case 'Home':
              return <HomeIcon color={color} size={size} />;
            case 'Archive':
              // You can switch to <Airplane /> if you prefer that
              return <Gem color={color} size={size} />;
            case 'Profile':
              return <UserIcon color={color} size={size} />;
            default:
              return null;
          }
        },
        // Tab bar colors
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: {
          backgroundColor: '#1C1C1C', // or whatever dark color you like
        },
        // Label style if you want to tweak font size, etc.
        tabBarLabelStyle: {
          fontSize: 12,
        },
        headerShown: false, // Hides the top header if you prefer
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="Archive" 
        component={MyArchiveScreen} 
        options={{ title: 'Archive' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
