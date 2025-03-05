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
import MapView, { 
  PROVIDER_GOOGLE, 
  Marker, 
  Callout,
  Circle,
  Polyline,
  PROVIDER_DEFAULT
} from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { Bell, Menu, Edit2, AlertTriangle, LogOut, MapPin, Navigation, Search } from 'lucide-react-native';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.02;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const GOOGLE_MAPS_API_KEY = 'AIzaSyBAfFGzfR6FdIvGrnCZ21nAbuc91TcLwfw'; // Replace with your API key

type NotificationType = {
  id: number;
  message: string;
  time: string;
};

type UserDataType = {
  name: string;
  phone: string;
  photo: string;
};

type RouteInfo = {
  distance: string;
  duration: string;
  coordinates: any[];
};

type LocationType = {
  latitude: number;
  longitude: number;
  name?: string;
};

const HomePage = () => {
  const [startText, setStartText] = useState<string>('Current Location');
  const [destinationText, setDestinationText] = useState<string>('');
  const [startLocation, setStartLocation] = useState<LocationType | null>(null);
  const [destination, setDestination] = useState<LocationType | null>(null);
  const [selectedPriority, setPriority] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [watchId, setWatchId] = useState<any>(null);
  const [isSearchingStart, setIsSearchingStart] = useState<boolean>(false);
  const [isSearchingDest, setIsSearchingDest] = useState<boolean>(false);
  
  const [region, setRegion] = useState({
    latitude: 0,
    longitude: 0,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });

  const drawerRef = useRef<DrawerLayoutAndroid | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const userData: UserDataType = {
    name: 'Antony Xavier',
    phone: '+91 9876543210',
    photo: './assets/images/ANTONY.jpg',
  };

  const notifications: NotificationType[] = [
    { id: 1, message: 'New route available', time: '2 mins ago' },
    { id: 2, message: 'Emergency alert in your area', time: '15 mins ago' },
  ];

  useEffect(() => {
    initializeLocation();
    return () => {
      if (watchId) {
        Location.removeWatchPositionAsync(watchId);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
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

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(location);
      setStartLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        name: 'Current Location'
      });
      
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
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

  const handleSearchInputChange = (text: string, isStart: boolean) => {
    if (isStart) {
      setStartText(text);
    } else {
      setDestinationText(text);
    }

    if (!text.trim().length) {
      isStart ? setIsSearchingStart(false) : setIsSearchingDest(false);
      isStart ? setStartLocation(location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        name: 'Current Location'
      } : null) : setDestination(null);
    }
  };

  const searchPlace = async (searchText: string, isStart: boolean) => {
    if (!searchText.trim()) return;

    try {
      isStart ? setIsSearchingStart(true) : setIsSearchingDest(true);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          searchText
        )}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const place = data.results[0];
        const newLocation = {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          name: place.formatted_address,
        };
        
        if (isStart) {
          setStartLocation(newLocation);
        } else {
          setDestination(newLocation);
        }

        if (startLocation && destination) {
          const coords = [
            {
              latitude: startLocation.latitude,
              longitude: startLocation.longitude,
            },
            {
              latitude: destination.latitude,
              longitude: destination.longitude,
            },
          ];
          mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        } else if (newLocation) {
          mapRef.current?.animateToRegion({
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }, 1000);
        }
      } else {
        Alert.alert('Error', 'Location not found');
      }
    } catch (error) {
      console.error('Error searching place:', error);
      Alert.alert('Error', 'Failed to search location');
    } finally {
      isStart ? setIsSearchingStart(false) : setIsSearchingDest(false);
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
          setLocation(newLocation);
          if (isTracking) {
            mapRef.current?.animateToRegion({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            }, 1000);
          }
        }
      );
      setWatchId(watchId);
    } catch (error) {
      console.error('Error starting tracking:', error);
      Alert.alert('Error', 'Failed to start tracking');
    }
  };

  const stopTracking = () => {
    if (watchId) {
      watchId.remove();
      setWatchId(null);
    }
    setIsTracking(false);
  };

  const handleStartNavigation = async () => {
    if (!destination || !startLocation) {
      Alert.alert('Error', 'Please select both start and destination locations');
      return;
    }

    if (!selectedPriority) {
      Alert.alert('Error', 'Please select a priority level');
      return;
    }

    setIsStarted(true);
    setIsTracking(true);
    await startTracking();

    if (mapRef.current && startLocation && destination) {
      const coords = [
        {
          latitude: startLocation.latitude,
          longitude: startLocation.longitude,
        },
        {
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
      ];

      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  const handleStopNavigation = () => {
    setIsStarted(false);
    stopTracking();
    setDestination(null);
    setDestinationText('');
    setRouteInfo(null);
    setPriority(null);
    if (location) {
      setStartLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        name: 'Current Location'
      });
    }
    setStartText('Current Location');
  };

  const goToMyLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };

      setStartLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        name: 'Current Location'
      });
      setStartText('Current Location');
      mapRef.current?.animateToRegion(newRegion, 1000);
    } catch (error) {
      Alert.alert('Error', 'Could not get current location');
    }
  };

  const renderDrawerContent = () => (
    <View style={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        <Image
          source={{ uri: userData.photo }}
          style={styles.profilePhoto}
        />
        <Text style={styles.userName}>{userData.name}</Text>
        <Text style={styles.userPhone}>{userData.phone}</Text>
      </View>
      <View style={styles.drawerMenu}>
        <TouchableOpacity style={styles.drawerItem}>
          <Edit2 size={24} color="#333" />
          <Text style={styles.drawerItemText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerItem}>
          <AlertTriangle size={24} color="#333" />
          <Text style={styles.drawerItemText}>Report Incident</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerItem}>
          <LogOut size={24} color="#333" />
          <Text style={styles.drawerItemText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderNotifications = () => (
    <View style={styles.notificationPanel}>
      <Text style={styles.notificationTitle}>Notifications</Text>
      {notifications.map(notification => (
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
        <TextInput
          style={styles.searchInput}
          placeholder="Enter start location"
          value={startText}
          onChangeText={(text) => handleSearchInputChange(text, true)}
          onSubmitEditing={() => searchPlace(startText, true)}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {isSearchingStart ? (
          <ActivityIndicator size="small" color="#666" style={styles.searchButton} />
        ) : (
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => searchPlace(startText, true)}
          >
            <Search size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.searchBox, styles.secondSearchBox]}>
        <Navigation size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Enter destination"
          value={destinationText}
          onChangeText={(text) => handleSearchInputChange(text, false)}
          onSubmitEditing={() => searchPlace(destinationText, false)}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {isSearchingDest ? (
          <ActivityIndicator size="small" color="#666" style={styles.searchButton} />
        ) : (
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => searchPlace(destinationText, false)}
          >
            <Search size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {(startLocation || destination) && (
        <View style={styles.selectedLocations}>
          {startLocation && (
            <Text style={styles.selectedText}>
              Start: {startLocation.name}
            </Text>
          )}
          {destination && (
            <Text style={styles.selectedText}>
              Dest: {destination.name}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  const MainContent = () => (
    <SafeAreaView style={styles.container}>
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

      {showNotifications && renderNotifications()}
      {renderSearchBox()}

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={region}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          showsTraffic={true}
          loadingEnabled={true}
          minZoomLevel={3}
          maxZoomLevel={20}
        >
          {startLocation && (
            <Marker
              coordinate={{
                latitude: startLocation.latitude,
                longitude: startLocation.longitude,
              }}
              title={startLocation.name}
              description="Start location"
              pinColor="#2196F3"
            />
          )}

          {destination && (
            <Marker
              coordinate={{
                latitude: destination.latitude,
                longitude: destination.longitude,
              }}
              title={destination.name}
              description="Destination"
              pinColor="#FF0000"
            />
          )}

          {startLocation && destination && (
            <MapViewDirections
              origin={{
                latitude: startLocation.latitude,
                longitude: startLocation.longitude,
              }}
              destination={{
                latitude: destination.latitude,
                longitude: destination.longitude,
              }}
              apikey={GOOGLE_MAPS_API_KEY}
              strokeWidth={3}
              strokeColor="#2196F3"
              onReady={(result) => {
                setRouteInfo({
                  distance: result.distance,
                  duration: result.duration,
                  coordinates: result.coordinates,
                });
                mapRef.current?.fitToCoordinates(result.coordinates, {
                  edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                  animated: true,
                });
              }}
            />
          )}
        </MapView>

        <TouchableOpacity 
          style={styles.myLocationButton}
          onPress={goToMyLocation}
        >
          <MapPin size={24} color="#2196F3" />
        </TouchableOpacity>

        {routeInfo && (
          <View style={styles.routeInfoContainer}>
            <Text style={styles.routeInfoText}>
              Distance: {routeInfo.distance.toFixed(2)} km
            </Text>
            <Text style={styles.routeInfoText}>
              Duration: {routeInfo.duration.toFixed(0)} mins
            </Text>
          </View>
        )}
      </View>

      <View style={styles.startButtonContainer}>
        <TouchableOpacity
          style={[
            styles.startButton,
            isStarted && styles.stopButton,
          ]}
          onPress={() => isStarted ? handleStopNavigation() : handleStartNavigation()}
        >
          <Text style={styles.startButtonText}>
            {isStarted ? 'STOP NAVIGATION' : 'START NAVIGATION'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.priorityContainer}>
        <TouchableOpacity
          style={[
            styles.priorityButton,
            selectedPriority === 'high' && styles.selectedHighPriority,
          ]}
          onPress={() => setPriority('high')}
          disabled={isStarted}
        >
          <Text style={[
            styles.priorityText,
            selectedPriority === 'high' && styles.selectedPriorityText
          ]}>High</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.priorityButton,
            selectedPriority === 'medium' && styles.selectedMediumPriority,
          ]}
          onPress={() => setPriority('medium')}
          disabled={isStarted}
        >
          <Text style={[
            styles.priorityText,
            selectedPriority === 'medium' && styles.selectedPriorityText
          ]}>Medium</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.priorityButton,
            selectedPriority === 'low' && styles.selectedLowPriority,
          ]}
          onPress={() => setPriority('low')}
          disabled={isStarted}
        >
          <Text style={[
            styles.priorityText,
            selectedPriority === 'low' && styles.selectedPriorityText
          ]}>Low</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  if (Platform.OS === 'ios') {
    return <MainContent />;
  }

  return (
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  searchButton: {
    padding: 8,
  },
  selectedLocations: {
    marginTop: 8,
  },
  selectedText: {
    fontSize: 14,
    color: '#666',
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
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    shadowOpacity: 0.1,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButton: {
    backgroundColor: '#FF0000',
  },
  startButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
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
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
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
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 2,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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
});

export default HomePage;