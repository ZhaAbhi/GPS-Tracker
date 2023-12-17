import React, {useEffect, useState} from 'react';
import {View, StyleSheet, Platform, Text} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions';
import GeoLocation from 'react-native-geolocation-service';

const HomeScreen = () => {
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [watchId, setWatchId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const handleLocationUpdates = (position: any) => {
    const {latitude, longitude} = position.coords;
    console.log(latitude, longitude);
    setCurrentLocation({latitude, longitude});
    setLoading(false);
  };

  const requestLocationPermission = async () => {
    try {
      const status = await check(
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      );

      if (status === RESULTS.DENIED) {
        const result = await request(
          Platform.OS === 'ios'
            ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
            : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        );

        if (result === RESULTS.GRANTED) {
          console.log(result);
          // Locating user to current position
        } else {
          console.log('Permission denied!');
        }
      } else {
        if (status === RESULTS.GRANTED) {
          const id = GeoLocation.watchPosition(
            handleLocationUpdates,
            error => {
              console.log(error.code, error.message);
            },
            {enableHighAccuracy: true},
          );
          setWatchId(id);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    requestLocationPermission();
    return () => {
      if (watchId) {
        GeoLocation.clearWatch(watchId);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <View>
          <Text>Loading...</Text>
        </View>
      ) : (
        <MapView
          style={styles.map}
          region={{
            latitude: currentLocation?.latitude || 0,
            longitude: currentLocation?.longitude || 0,
            latitudeDelta: 0.015,
            longitudeDelta: 0.0121,
          }}>
          <Marker
            coordinate={{
              latitude: currentLocation?.latitude || 0,
              longitude: currentLocation?.longitude || 0,
            }}
            title="Abhishek Jha"
            description="You are here!"
          />
        </MapView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default HomeScreen;
