// app/HomePage.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  SafeAreaView,
  Alert,
  Dimensions,
  DrawerLayoutAndroid,
  ActivityIndicator,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Bell, Menu, Edit2, AlertTriangle, LogOut, MapPin, Navigation, Search, Compass, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.02;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_API_KEY;

interface NotificationType {
  id: number;
  message: string;
  time: string;
}

interface UserDataType {
  name: string;
  phone: string;
  photo: string;
  vehicleId: string;
  role: 'ambulance driver' | 'vip vehicle driver';
}

interface RouteInfo {
  distance: string;
  duration: string;
  coordinates: any[];
}

interface LocationType {
  latitude: number;
  longitude: number;
  name?: string;
}

interface NavigationStep {
  instruction: string;
  distance: string;
  duration: string;
}

const HomePage: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startLocation, setStartLocation] = useState<LocationType | null>(null);
  const [destination, setDestination] = useState<LocationType | null>(null);
  const [selectedPriority, setPriority] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [isSearchingDest, setIsSearchingDest] = useState<boolean>(false);
  const [navigationSteps, setNavigationSteps] = useState<NavigationStep[] | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number }> | null>(null);
  const [navMapState, setNavMapState] = useState({
    camera: {
      heading: 0,
      pitch: 60,
      altitude: 1000,
      zoom: 18,
    },
  });

  const [region, setRegion] = useState({
    latitude: 9.939093,
    longitude: 76.270523,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });

  const drawerRef = useRef<DrawerLayoutAndroid>(null);
  const mapRef = useRef<MapView>(null);
  const watchIdRef = useRef<any>(null);

  const userData: UserDataType = {
    name: 'Antony Xavier',
    phone: '+91 7306148637',
    photo: './assets/images/splash.jpg', // Update to require() if needed
    vehicleId: 'AMB123',
    role: 'ambulance driver',
  };

  const notifications: NotificationType[] = [
    { id: 1, message: 'New route available', time: '2 mins ago' },
    { id: 2, message: 'Emergency alert in your area', time: '15 mins ago' },
  ];

  useEffect(() => {
    initializeLocation();
    return () => {
      if (watchIdRef.current) {
        Location.stopLocationUpdatesAsync(watchIdRef.current);
      }
    };
  }, []);

  const initializeLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        Alert.alert('Error', 'Location permission is required');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newStartLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        name: 'Current Location',
      };

      setStartLocation(newStartLocation);
      const newRegion = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };

      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
    } catch (error) {
      setErrorMsg('Error getting location');
      Alert.alert('Error', 'Failed to get your location');
      console.error(error);
    }
  };

  const decodePolyline = (encoded: string) => {
    const poly = [];
    let index = 0,
      lat = 0,
      lng = 0;

    while (index < encoded.length) {
      let b,
        shift = 0,
        result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = (result & 1) ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = (result & 1) ? ~(result >> 1) : result >> 1;
      lng += dlng;

      const point = {
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      };

      poly.push(point);
    }

    return poly;
  };

  const searchDestination = async () => {
    if (searchQuery.trim() === '') return;

    try {
      setIsSearchingDest(true);
      const apiKey = process.env.EXPO_PUBLIC_API_KEY;

      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        searchQuery
      )}&key=${apiKey}`;
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeJson = await geocodeResponse.json();

      if (geocodeJson.status === 'OK' && geocodeJson.results.length > 0) {
        const place = geocodeJson.results[0];
        const newDestination = {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          name: place.formatted_address,
        };

        setDestination(newDestination);

        if (startLocation) {
          getDirections(startLocation, newDestination);

          mapRef.current?.fitToCoordinates(
            [
              { latitude: startLocation.latitude, longitude: startLocation.longitude },
              { latitude: newDestination.latitude, longitude: newDestination.longitude },
            ],
            {
              edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
              animated: true,
            }
          );
        }
      } else {
        console.log('No locations found for the search query');
        Alert.alert(`Location not found: ${geocodeJson.status}`);
        setRouteInfo(null);
        setRouteCoordinates(null);
        setNavigationSteps(null);
      }
    } catch (error) {
      console.error('Error searching for location:', error);
      Alert.alert('Error searching for location. Please check your connection.');
      setRouteInfo(null);
      setRouteCoordinates(null);
      setNavigationSteps(null);
    } finally {
      setIsSearchingDest(false);
    }
  };

  const getDirections = async (
    startLoc: { latitude: number; longitude: number },
    destinationLoc: { latitude: number; longitude: number; name: string }
  ) => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_API_KEY;
      const origin = `${startLoc.latitude},${startLoc.longitude}`;
      const destination = `${destinationLoc.latitude},${destinationLoc.longitude}`;
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${apiKey}&mode=driving`;

      const response = await fetch(url);
      const json = await response.json();

      if (json.routes.length) {
        const route = json.routes[0];
        const leg = route.legs[0];

        setRouteInfo({
          distance: leg.distance.text,
          duration: leg.duration.text,
          coordinates: [],
        });

        const points = route.overview_polyline.points;
        const decodedCoords = decodePolyline(points);

        setRouteCoordinates(decodedCoords);

        const steps = leg.steps.map((step) => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ' ').trim(),
          distance: step.distance.text,
          duration: step.duration.text,
        }));

        setNavigationSteps(steps);
      } else {
        console.log('No routes found');
        Alert.alert('No route found to this destination');
        setRouteInfo(null);
        setRouteCoordinates(null);
        setNavigationSteps(null);
      }
    } catch (error) {
      console.error('Error fetching directions:', error);
      Alert.alert('Error fetching directions. Please try again.');
      setRouteInfo(null);
      setRouteCoordinates(null);
      setNavigationSteps(null);
    }
  };

  const startTracking = async () => {
    try {
      const watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 10,
        },
        (newLocation) => {
          if (isTracking) {
            const newLocationData = {
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              name: 'Current Location',
            };

            setStartLocation(newLocationData);

            if (isStarted && mapRef.current) {
              const heading = newLocation.coords.heading || 0;

              mapRef.current.animateCamera(
                {
                  center: {
                    latitude: newLocation.coords.latitude,
                    longitude: newLocation.coords.longitude,
                  },
                  heading: heading,
                  pitch: 60,
                  altitude: 1000,
                  zoom: 18,
                },
                { duration: 1000 }
              );

              setNavMapState({
                camera: {
                  heading: heading,
                  pitch: 60,
                  altitude: 1000,
                  zoom: 18,
                },
              });
            }

            if (destination && navigationSteps && navigationSteps.length > 0) {
              const timeElapsed = Date.now() - (watchIdRef.current?.startTime || Date.now());
              if (timeElapsed > 30000 && currentStep < navigationSteps.length - 1) {
                setCurrentStep(currentStep + 1);
                watchIdRef.current = {
                  ...watchIdRef.current,
                  startTime: Date.now(),
                };
              }
            }
          }
        }
      );

      watchIdRef.current = {
        ...watchId,
        startTime: Date.now(),
      };
    } catch (error) {
      console.error('Error starting tracking:', error);
      Alert.alert('Error', 'Failed to start tracking');
    }
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      watchIdRef.current.remove();
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  const handleStartNavigation = async () => {
    if (!destination || !startLocation) {
      Alert.alert('Error', 'Please select a destination');
      return;
    }

    if (!selectedPriority) {
      Alert.alert('Error', 'Please select a priority level');
      return;
    }

    setIsStarted(true);
    setIsTracking(true);
    setCurrentStep(0);

    if (mapRef.current && startLocation) {
      mapRef.current.animateCamera(
        {
          center: {
            latitude: startLocation.latitude,
            longitude: startLocation.longitude,
          },
          heading: 0,
          pitch: 60,
          altitude: 1000,
          zoom: 18,
        },
        { duration: 1000 }
      );
    }

    await startTracking();
  };

  const handleStopNavigation = () => {
    setIsStarted(false);
    stopTracking();
    setDestination(null);
    setSearchQuery('');
    setRouteInfo(null);
    setRouteCoordinates(null);
    setNavigationSteps(null);
    setPriority(null);

    mapRef.current?.animateToRegion(region, 1000);

    initializeLocation();
  };

  const goToMyLocation = async () => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      if (isStarted) {
        mapRef.current?.animateCamera(
          {
            center: {
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            },
            heading: currentLocation.coords.heading || 0,
            pitch: 60,
            zoom: 18,
          },
          { duration: 1000 }
        );
      } else {
        mapRef.current?.animateToRegion(
          {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          },
          1000
        );
      }

      setStartLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        name: 'Current Location',
      });
    } catch (error) {
      Alert.alert('Error', 'Could not get current location');
    }
  };

  const handleLogout = () => {
    // Close the drawer
    drawerRef.current?.closeDrawer();
    
    // Reset state (optional, depending on your app's needs)
    setStartLocation(null);
    setDestination(null);
    setPriority(null);
    setIsStarted(false);
    setRouteInfo(null);
    setRouteCoordinates(null);
    setNavigationSteps(null);
    setSearchQuery('');
    stopTracking();

    // Navigate to the login page
    router.replace('/login'); // Use replace to prevent going back to HomePage
  };

  const renderDrawerContent = () => (
    <View style={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        <Image source={{ uri: userData.photo }} style={styles.profilePhoto} />
        <Text style={styles.userName}>{userData.name}</Text>
        <Text style={styles.userPhone}>{userData.phone}</Text>
        <Text style={styles.userRole}>
          {userData.role === 'ambulance driver' ? 'Ambulance Driver' : 'VIP Vehicle Driver'}
        </Text>
        <Text style={styles.vehicleId}>Vehicle ID: {userData.vehicleId}</Text>
      </View>
      <View style={styles.drawerMenu}>
        <TouchableOpacity
          style={styles.drawerItem}
          onPress={() => {
            drawerRef.current?.closeDrawer();
            router.push('/editprofile');
          }}
        >
          <Edit2 size={24} color="#333" />
          <Text style={styles.drawerItemText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.drawerItem}
          onPress={handleLogout} // Call handleLogout on press
        >
          <LogOut size={24} color="#333" />
          <Text style={styles.drawerItemText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderNotifications = () => (
    <View style={styles.notificationPanel}>
      <Text style={styles.notificationTitle}>Notifications</Text>
      {notifications.map((notification) => (
        <View key={notification.id} style={styles.notificationItem}>
          <Text style={styles.notificationMessage}>{notification.message}</Text>
          <Text style={styles.notificationTime}>{notification.time}</Text>
        </View>
      ))}
    </View>
  );

  const renderSearchBox = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBox}>
        <MapPin size={20} color="#666" />
        <Text style={styles.startText}>{startLocation?.name || 'Current Location'}</Text>
      </View>

      <View style={[styles.searchBox, styles.secondSearchBox]}>
        <Navigation size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a location..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchDestination}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {isSearchingDest ? (
          <ActivityIndicator size="small" color="#007AFF" style={styles.searchButton} />
        ) : (
          <TouchableOpacity style={styles.searchButton} onPress={searchDestination}>
            <Search size={20} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      {destination && (
        <TouchableOpacity style={styles.clearButton} onPress={handleStopNavigation}>
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderNavigationPanel = () => {
    if (!isStarted || !navigationSteps || currentStep >= navigationSteps.length) return null;

    const step = navigationSteps[currentStep];

    return (
      <View style={styles.navigationViewContainer}>
        <View style={styles.navigationBanner}>
          <View style={styles.directionIconContainer}>
            <Text style={styles.directionIcon}>↑</Text>
          </View>
          <View style={styles.navigationTextContainer}>
            <Text style={styles.navigationTowardsText}>towards</Text>
            <Text style={styles.navigationStreetText}>
              {destination?.name?.split(',')[0] || 'Destination'}
            </Text>
          </View>
        </View>

        <View style={styles.nextStepContainer}>
          <Text style={styles.thenText}>Then</Text>
          <View style={styles.nextStepIconContainer}>
            <Text style={styles.nextStepIcon}>→</Text>
          </View>
        </View>

        <View style={styles.navigationBottomBar}>
          <TouchableOpacity onPress={handleStopNavigation} style={styles.exitNavButton}>
            <X size={24} color="#000" />
          </TouchableOpacity>

          <View style={styles.etaContainer}>
            <Text style={styles.etaText}>{routeInfo?.duration || '0 min'}</Text>
            <Text style={styles.distanceText}>
              {routeInfo?.distance || '0 km'} •{' '}
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          <TouchableOpacity style={styles.alternateRouteButton}>
            <Text style={styles.alternateRouteIcon}>↕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const MainContent = () => (
    <SafeAreaView style={styles.container}>
      {!isStarted && (
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => drawerRef.current?.openDrawer()}
            style={styles.menuButton}
          >
            <Menu size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowNotifications(!showNotifications)}
            style={styles.notificationButton}
          >
            <Bell size={24} color="#333" />
          </TouchableOpacity>
        </View>
      )}

      {showNotifications && renderNotifications()}
      {!isStarted && renderSearchBox()}

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={region}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={!isStarted}
          showsTraffic={true}
          loadingEnabled={true}
          mapPadding={isStarted ? { top: 80, right: 0, bottom: 100, left: 0 } : undefined}
          camera={
            isStarted
              ? {
                  center: {
                    latitude: startLocation?.latitude || region.latitude,
                    longitude: startLocation?.longitude || region.longitude,
                  },
                  heading: navMapState.camera.heading,
                  pitch: navMapState.camera.pitch,
                  altitude: navMapState.camera.altitude,
                  zoom: navMapState.camera.zoom,
                }
              : undefined
          }
          region={
            !isStarted
              ? destination
                ? {
                    latitude: destination.latitude,
                    longitude: destination.longitude,
                    latitudeDelta: LATITUDE_DELTA,
                    longitudeDelta: LONGITUDE_DELTA,
                  }
                : undefined
              : undefined
          }
        >
          {startLocation && !isStarted && (
            <Marker
              coordinate={{
                latitude: startLocation.latitude,
                longitude: startLocation.longitude,
              }}
              title="Your Location"
              pinColor="blue"
            />
          )}

          {destination && (
            <Marker
              coordinate={{
                latitude: destination.latitude,
                longitude: destination.longitude,
              }}
              title={destination.name}
              pinColor="red"
            />
          )}

          {routeCoordinates && (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={isStarted ? 6 : 4}
              strokeColor={isStarted ? '#4285F4' : '#007AFF'}
            />
          )}
        </MapView>

        {renderNavigationPanel()}

        {!isStarted && (
          <>
            <TouchableOpacity style={styles.defaultLocationButton} onPress={goToMyLocation}>
              <Compass size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.myLocationButton} onPress={goToMyLocation}>
              <MapPin size={24} color="#2196F3" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reportIncidentButton}
              onPress={() => router.push('/reportincidents')}
            >
              <AlertTriangle size={24} color="#fff" />
            </TouchableOpacity>

            {routeInfo && (
              <View style={styles.routeInfoContainer}>
                <Text style={styles.routeInfoText}>Distance: {routeInfo.distance}</Text>
                <Text style={styles.routeInfoText}>Duration: {routeInfo.duration}</Text>
              </View>
            )}
          </>
        )}
      </View>

      {isStarted && navigationSteps && currentStep < navigationSteps.length && (
        <View style={styles.navigationStepIndicator}>
          <Text style={styles.stepCounter}>
            Step {currentStep + 1} of {navigationSteps.length}
          </Text>
        </View>
      )}

      {!isStarted && destination && (
        <>
          <View style={styles.startButtonContainer}>
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartNavigation}
              disabled={!destination || !selectedPriority}
            >
              <Text style={styles.startButtonText}>START NAVIGATION</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.priorityContainer}>
            {['high', 'medium', 'low'].map((priority) => (
              <TouchableOpacity
                key={priority}
                style={[
                  styles.priorityButton,
                  selectedPriority === priority &&
                    styles[`selected${priority.charAt(0).toUpperCase() + priority.slice(1)}Priority`],
                ]}
                onPress={() => setPriority(priority)}
              >
                <Text
                  style={[
                    styles.priorityText,
                    selectedPriority === priority && styles.selectedPriorityText,
                  ]}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </SafeAreaView>
  );

  return Platform.OS === 'ios' ? (
    <MainContent />
  ) : (
    <DrawerLayoutAndroid
      ref={drawerRef}
      drawerWidth={300}
      drawerPosition="left"
      renderNavigationView={renderDrawerContent}
    >
      <MainContent />
    </DrawerLayoutAndroid>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  menuButton: {
    padding: 8,
  },
  notificationButton: {
    padding: 8,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    zIndex: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondSearchBox: {
    marginTop: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    marginRight: 8,
  },
  startText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#333',
  },
  searchButton: {
    padding: 8,
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  defaultLocationButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#2196F3',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 10,
  },
  reportIncidentButton: {
    position: 'absolute',
    bottom: 180,
    right: 20,
    backgroundColor: '#FF3B30',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 10,
  },
  routeInfoContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  routeInfoText: {
    fontSize: 14,
    color: '#333',
  },
  startButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
  },
  startButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  priorityContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  selectedHighPriority: {
    backgroundColor: '#FF0000',
  },
  selectedMediumPriority: {
    backgroundColor: '#FFA500',
  },
  selectedLowPriority: {
    backgroundColor: '#00FF00',
  },
  priorityText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  selectedPriorityText: {
    color: '#fff',
  },
  drawerContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  drawerHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    alignItems: 'center',
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  vehicleId: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  drawerMenu: {
    padding: 16,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  drawerItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  notificationPanel: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    elevation: 4,
    zIndex: 1000,
    width: 250,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  notificationItem: {
    marginBottom: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#333',
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  navigationViewContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  navigationBanner: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  directionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  directionIcon: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  navigationTextContainer: {
    flex: 1,
  },
  navigationTowardsText: {
    fontSize: 14,
    color: '#666',
  },
  navigationStreetText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  nextStepContainer: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thenText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  nextStepIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextStepIcon: {
    fontSize: 16,
    color: '#333',
  },
  navigationBottomBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    elevation: 4,
  },
  exitNavButton: {
    padding: 8,
  },
  etaContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  etaText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
  },
  alternateRouteButton: {
    padding: 8,
  },
  alternateRouteIcon: {
    fontSize: 20,
    color: '#666',
  },
  navigationStepIndicator: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 4,
  },
  stepCounter: {
    color: '#fff',
    fontSize: 14,
  },
});

export default HomePage;