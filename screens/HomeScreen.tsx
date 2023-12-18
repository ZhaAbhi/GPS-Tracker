import React, {useEffect, useState} from 'react';
import {View, StyleSheet, Platform, Text, AppState} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import {check, PERMISSIONS, RESULTS} from 'react-native-permissions';
import GeoLocation from 'react-native-geolocation-service';
import SQLite, {SQLiteDatabase} from 'react-native-sqlite-storage';

interface Location {
  latitude: number;
  longitude: number;
}

const HomeScreen: React.FC = (): JSX.Element => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Open SQLite database
  const db: SQLiteDatabase = SQLite.openDatabase(
    {name: 'location.db', location: 'default'},
    () => {},
    error => {
      console.log('Error opening database:', error);
    },
  );

  const handleLocationUpdates = async (position: any) => {
    try {
      const {latitude, longitude} = position.coords;
      console.log(latitude, longitude);

      // Update the marker position on the map
      setCurrentLocation({latitude, longitude});

      // Save the location data to SQLite
      db.transaction(tx => {
        tx.executeSql(
          'CREATE TABLE IF NOT EXISTS locations (id INTEGER PRIMARY KEY AUTOINCREMENT, latitude REAL, longitude REAL)',
          [],
          () => {
            tx.executeSql(
              'INSERT INTO locations (latitude, longitude) VALUES (?, ?)',
              [latitude, longitude],
              () => {},
              error => {
                console.log('Error inserting data:', error);
              },
            );
          },
          error => {
            console.log('Error creating table:', error);
          },
        );
      });

      setLoading(false);
    } catch (error) {
      console.log(error);
    }
  };

  //TODO: Background Synchronization when the app is running in the background

  useEffect(() => {
    const retrieveLastKnownLocation = async () => {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM locations ORDER BY id DESC LIMIT 1',
          [],
          (_, results) => {
            const {rows} = results;
            if (rows.length > 0) {
              const {latitude, longitude} = rows.item(0);
              setCurrentLocation({latitude, longitude});
              setLoading(false);
            }
          },
          error => {
            console.log('Error retrieving data:', error);
          },
        );
      });
    };

    const watchLocation = async () => {
      try {
        const id = GeoLocation.watchPosition(
          handleLocationUpdates,
          error => {
            console.log(error.code, error.message);
          },
          {enableHighAccuracy: true},
        );
        setWatchId(id);
      } catch (error) {
        console.log(error);
      }
    };

    const requestPermissionAndWatchLocation = async () => {
      try {
        const status = await check(
          Platform.OS === 'ios'
            ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
            : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        );

        if (status === RESULTS.GRANTED) {
          await retrieveLastKnownLocation(); // Retrieve last known location if available
          await watchLocation(); // Start watching location updates
        } else {
          console.log('Permission denied!');
        }
      } catch (error) {
        console.log(error);
      }
    };

    requestPermissionAndWatchLocation();

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
