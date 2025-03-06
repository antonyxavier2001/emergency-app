import React, { useEffect, useRef } from 'react';
import { View, Text, ImageBackground, StyleSheet, Animated, Dimensions, LinearGradient } from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function Home() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    
    const timer = setTimeout(() => {
      
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        router.replace('/login');
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <ImageBackground
      source={require('../assets/images/splash.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Enhanced Logo Container */}
        <View style={styles.logoOuterCircle}>
          <View style={styles.logoInnerCircle}>
            <View style={styles.logoContent}>
              <Text style={styles.logoMainText}>Clear</Text>
              <Text style={styles.logoSubText}>Lane</Text>
              <View style={styles.logoUnderline} />
            </View>
          </View>
        </View>

        <Text style={styles.tagline}>Your Path, Clear Ahead</Text>

        <View style={styles.loadingContainer}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(5px)',
  },
  contentContainer: {
    alignItems: 'center',
    width: width * 0.8,
  },
  logoOuterCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoInnerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  logoContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMainText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#007bff',
    letterSpacing: 1,
    lineHeight: 32,
  },
  logoSubText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0056b3',
    letterSpacing: 3,
    marginTop: -2,
  },
  logoUnderline: {
    width: 40,
    height: 3,
    backgroundColor: '#007bff',
    borderRadius: 2,
    marginTop: 4,
  },
  tagline: {
    fontSize: 18,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 30,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    margin: 3,
    opacity: 0.6,
  },
  dot1: {
    animationName: 'bounce',
    animationDuration: '0.6s',
    animationDelay: '0s',
    animationIterationCount: 'infinite',
  },
  dot2: {
    animationName: 'bounce',
    animationDuration: '0.6s',
    animationDelay: '0.2s',
    animationIterationCount: 'infinite',
  },
  dot3: {
    animationName: 'bounce',
    animationDuration: '0.6s',
    animationDelay: '0.4s',
    animationIterationCount: 'infinite',
  },
});