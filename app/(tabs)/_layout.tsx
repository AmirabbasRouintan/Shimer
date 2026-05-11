// app/(tabs)/_layout.js
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function LiveClock() {
  const [time, setTime] = useState(new Date());
  const [batteryLevel, setBatteryLevel] = useState(86);
  const [isCharging, setIsCharging] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkBattery = async () => {
      try {
        const { getBatteryLevelAsync, getBatteryStateAsync } = await import('expo-battery');
        const level = await getBatteryLevelAsync();
        const state = await getBatteryStateAsync();
        setBatteryLevel(Math.round(level * 100));
        setIsCharging(state === 2);
      } catch (e) { }
    };
    checkBattery();
    const interval = setInterval(checkBattery, 10000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayName = days[time.getDay()];
  const month = months[time.getMonth()];
  const day = time.getDate();
  const dateString = `${dayName} ${month} ${day}`;

  return (
    <View style={styles.clockContainer}>
      <Text style={styles.clockText}>{hours}:{minutes}</Text>
      <View style={styles.dateRow}>
        <Text style={styles.batteryText}>{batteryLevel}%</Text>
        <Ionicons name="flash" size={12} color={isCharging ? '#4CAF50' : '#888'} />
        <Text style={styles.dateText}>{dateString}</Text>
      </View>
    </View>
  );
}

function CustomTabBar({ state, descriptors, navigation }) {
  const colorScheme = useColorScheme();
  const activeColor = Colors[colorScheme ?? 'light'].tint;
  const router = useRouter();

  const handleClockPress = () => {
    if (state.index === 0) {
      router.push('/main');
    } else {
      navigation.navigate('index');
    }
  };

  const isHomeActive = state.index === 0;
  const isSettingsActive = state.index === 1;

  return (
    <View style={styles.tabBar}>
      {/* Things Tab */}
      <TouchableOpacity
        onPress={() => navigation.navigate('things')}
        style={styles.tabItem}>
        <Ionicons
          name="layers-outline"
          size={26}
          color={isHomeActive ? activeColor : '#666'}
        />
      </TouchableOpacity>

      {/* Live Clock in the middle */}
      <TouchableOpacity onPress={handleClockPress}>
        <LiveClock />
      </TouchableOpacity>

      {/* Settings Tab */}
      <TouchableOpacity
        onPress={() => navigation.navigate('settings')}
        style={styles.tabItem}>
        <Ionicons
          name="grid-outline"
          size={26}
          color={isSettingsActive ? activeColor : '#666'}
        />
      </TouchableOpacity>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#111',
    height: 70,
    paddingBottom: 10,
    paddingTop: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clockText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dateText: {
    color: '#888',
    fontSize: 11,
    textAlign: 'center',
  },
  batteryText: {
    color: '#888',
    fontSize: 11,
  },
});
