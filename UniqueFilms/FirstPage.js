import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';

export default function FirstPage({ navigation }) {
  return (
    <ImageBackground
      source={require('./assets/FirstPageBG.png')}
      style={styles.background}
    >
      <View style={styles.overlay} />

      <View style={styles.container}>
        {/* Title */}
        <View style={styles.logoWrapper}>
            <Text style={styles.logoGlow}>GEM</Text>
            <Text style={styles.logoText}>GEM</Text>
        </View>

        {/* Tagline */}
        <Text style={styles.tagline}>
          Discover Hidden{"\n"}Cinematic Treasures
        </Text>

        {/* Log In Button */}
        {/* Log In Button + Glow Layer */}
        <View style={styles.loginWrapper}>
            <View style={styles.loginGlow} />
            <TouchableOpacity
                style={styles.loginButton}
                onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginButtonText}>Log In</Text>
            </TouchableOpacity>
        </View>

        {/* Signup Text Link */}
        <TouchableOpacity
          style={styles.signupButton}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.signupLinkText}>Need an Account?</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
    background: {
      flex: 1,
      resizeMode: 'cover',
    },
    container: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingBottom: 60,
    },
    logoWrapper: {
        position: 'absolute',
        top: 100,
        alignItems: 'center',
        justifyContent: 'center',
      },
      
      logoGlow: {
        position: 'absolute',
        fontSize: 42,
        fontFamily: 'Lato',
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: '#FFFFFF',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 7, // ✨ SHINY blur
        zIndex: 0,
      },
      
      logoText: {
        fontSize: 42,
        fontFamily: 'Lato',
        fontWeight: 'bold',
        color: '#FFFFFF',
        zIndex: 1,
      },
    tagline: {
      position: 'absolute',
      bottom: 180,
      fontSize: 16,
      color: '#fff',
      textAlign: 'center',
      lineHeight: 22,
    },
    loginWrapper: {
        position: 'relative',
        marginBottom: 17,
      },
      
      loginGlow: {
        position: 'absolute',
        width: 307,
        height: 56, // Same as button height
        borderWidth: 1,
        borderColor: '#F2EFD0',
        borderRadius: 16,
        shadowColor: '#F2EFD0',
        shadowOpacity: 0.7,
        shadowRadius: 7, // 💫 equivalent to layer blur
        zIndex: 0,
      },
      loginButton: {
        width: 307,
        height: 56,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#F2EFD0',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#F2EFD0',
        shadowOpacity: 0.7,
        shadowRadius: 7, // 💫 equivalent to layer blur
        zIndex: 1, // Ensures it's on top of the glow
      },
      loginButtonText: {
        color: '#F2EFD0', 
        fontSize: 20,
        fontFamily: 'Righteous',
      },
    signupButton: {
      marginTop: 5,
    },
    signupLinkText: {
        color: '#F2EFD0',
        textDecorationLine: 'underline',
        fontSize: 15,
        fontFamily: 'Righteous',
      },
  });