// app/reportincidents.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Map, Upload, X, Check, MapPin, Search } from 'lucide-react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';

interface LocationType {
  latitude: number;
  longitude: number;
  name?: string;
}

const ReportIncidentPage: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams(); // Get params passed from HomePage
  const [description, setDescription] = useState<string>('');
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [region, setRegion] = useState({
    latitude: 9.939093,
    longitude: 76.270523,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  useEffect(() => {
    (async () => {
      // Request image picker permissions
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Sorry, we need camera roll permissions to upload images.');
        }
      }

      // Check if location is passed from HomePage
      if (params.latitude && params.longitude) {
        const passedLocation: LocationType = {
          latitude: Number(params.latitude),
          longitude: Number(params.longitude),
          name: 'Current Location from Home',
        };
        setLocation(passedLocation);
        setRegion({
          ...region,
          latitude: passedLocation.latitude,
          longitude: passedLocation.longitude,
        });
        // Reverse geocode to get the address
        await reverseGeocodeLocation(passedLocation);
      } else {
        // Otherwise, get current location
        getCurrentLocation();
      }
    })();
  }, [params.latitude, params.longitude]);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for this feature.');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        name: 'Current Location',
      };

      setLocation(newLocation);
      setRegion({
        ...region,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      await reverseGeocodeLocation(newLocation);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location');
    }
  };

  const reverseGeocodeLocation = async (loc: LocationType) => {
    try {
      const geocode = await Location.reverseGeocodeAsync({
        latitude: loc.latitude,
        longitude: loc.longitude,
      });

      if (geocode && geocode.length > 0) {
        const address = geocode[0];
        const formattedAddress = [
          address.name,
          address.street,
          address.district,
          address.city,
          address.region,
          address.postalCode,
          address.country,
        ]
          .filter(Boolean)
          .join(', ');

        setLocation({
          ...loc,
          name: formattedAddress,
        });
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const searchLocation = async () => {
    if (searchQuery.trim() === '') return;

    try {
      setIsSearching(true);
      const apiKey = process.env.EXPO_PUBLIC_API_KEY;

      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        searchQuery
      )}&key=${apiKey}`;
      
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeJson = await geocodeResponse.json();

      if (geocodeJson.status === 'OK' && geocodeJson.results.length > 0) {
        const place = geocodeJson.results[0];
        const newLocation = {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          name: place.formatted_address,
        };

        setLocation(newLocation);
        setRegion({
          ...region,
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
        });

        if (showMap) {
          setShowMap(false);
        }
      } else {
        Alert.alert('Location not found', 'Please try another search term');
      }
    } catch (error) {
      console.error('Error searching for location:', error);
      Alert.alert('Error', 'Failed to search for location');
    } finally {
      setIsSearching(false);
    }
  };

  const handleMapPress = (event: any) => {
    const selectedLocation = {
      latitude: event.nativeEvent.coordinate.latitude,
      longitude: event.nativeEvent.coordinate.longitude,
    };

    setLocation({
      ...selectedLocation,
      name: 'Selected Location',
    });

    reverseGeocodeLocation(selectedLocation);
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description of the incident');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Please select a location for the incident');
      return;
    }

    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append('description', description);
      formData.append('latitude', location.latitude.toString());
      formData.append('longitude', location.longitude.toString());
      formData.append('locationName', location.name || '');
      
      if (image) {
        const fileExtension = image.split('.').pop();
        const fileName = `incident_${Date.now()}.${fileExtension}`;
        
        formData.append('image', {
          uri: image,
          name: fileName,
          type: `image/${fileExtension}`,
        } as any);
      }

      // Uncomment and replace with your actual API endpoint
      // const response = await fetch('YOUR_API_ENDPOINT', {
      //   method: 'POST',
      //   body: formData,
      //   headers: {
      //     'Content-Type': 'multipart/form-data',
      //   },
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Success',
        'Incident reported successfully',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error submitting incident report:', error);
      Alert.alert('Error', 'Failed to submit incident report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Incident</Text>
          <View style={styles.headerRight} />
        </View>

        {showMap ? (
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              region={region}
              onPress={handleMapPress}
            >
              {location && (
                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  title="Incident Location"
                />
              )}
            </MapView>
            <TouchableOpacity
              style={styles.closeMapButton}
              onPress={() => setShowMap(false)}
            >
              <Check size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.content}>
            <Text style={styles.label}>Incident Description</Text>
            <TextInput
              style={styles.descriptionInput}
              multiline
              placeholder="Describe the incident..."
              value={description}
              onChangeText={setDescription}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length}/500</Text>

            <Text style={styles.label}>Location</Text>
            <View style={styles.locationContainer}>
              <View style={styles.locationSearchBox}>
                <MapPin size={20} color="#666" />
                <TextInput
                  style={styles.locationInput}
                  placeholder="Search for a location..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={searchLocation}
                />
                {isSearching ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <TouchableOpacity onPress={searchLocation}>
                    <Search size={20} color="#007AFF" />
                  </TouchableOpacity>
                )}
              </View>
              
              <TouchableOpacity
                style={styles.mapButton}
                onPress={() => setShowMap(true)}
              >
                <Map size={20} color="#fff" />
                <Text style={styles.mapButtonText}>Select on Map</Text>
              </TouchableOpacity>
              
              {location && (
                <View style={styles.selectedLocation}>
                  <MapPin size={16} color="#2196F3" />
                  <Text style={styles.selectedLocationText}>{location.name}</Text>
                  <TouchableOpacity onPress={() => setLocation(null)}>
                    <X size={16} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Text style={styles.label}>
              Photo Evidence <Text style={styles.optional}>(Optional)</Text>
            </Text>
            
            <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
              {image ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: image }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setImage(null)}
                  >
                    <X size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Upload size={24} color="#666" />
                  <Text style={styles.uploadText}>Tap to upload photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, (!description.trim() || !location) && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={!description.trim() || !location || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>SUBMIT REPORT</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 120,
    backgroundColor: '#f9f9f9',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    marginRight: 8,
  },
  mapButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  mapButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  selectedLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f2ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  selectedLocationText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    marginRight: 8,
  },
  optional: {
    fontWeight: 'normal',
    fontSize: 14,
    color: '#666',
  },
  imageUpload: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
    minHeight: 150,
  },
  uploadPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  uploadText: {
    color: '#666',
    marginTop: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 30,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#b0d6f5',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  closeMapButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#2196F3',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default ReportIncidentPage;