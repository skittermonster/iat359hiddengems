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
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconColor = focused ? '#FFFFFF' : '#999999';
          const iconSize = 26;

          switch (route.name) {
            case 'Home':
              return <HomeIcon color={iconColor} size={iconSize} />;
            case 'Archive':
              return <Gem color={iconColor} size={iconSize} />;
            case 'Profile':
              return <UserIcon color={iconColor} size={iconSize} />;
            default:
              return null;
          }
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: {
          backgroundColor: '#181820',
          height: 85,
          paddingTop: 10,
          paddingBottom: 25,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          marginTop: 4,
        },
        headerShown: false,
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