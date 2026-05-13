// app/(tabs)/_layout.tsx
import { Tabs, useRouter, usePathname } from 'expo-router';
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
  const pathname = usePathname();

  // Hide tab bar on specific pages
  const hiddenRoutes = ['/history', '/summary'];
  if (hiddenRoutes.includes(pathname)) {
    return null;
  }

  const isThingsActive = pathname === '/things';
  const isSettingsActive = pathname === '/settings';

  const handleClockPress = () => {
    if (pathname === '/' || pathname === '/index') {
      router.push('/main');
    } else {
      router.push('/');
    }
  };

  return (
    <View style={styles.tabBar}>
      {/* Things Tab */}
      <TouchableOpacity
        onPress={() => navigation.navigate('things')}
        style={styles.tabItem}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name="layers-outline"
          size={isThingsActive ? 32 : 26}
          color={isThingsActive ? activeColor : '#666'}
        />
      </TouchableOpacity>

      {/* Live Clock in the middle */}
      <TouchableOpacity
        onPress={handleClockPress}
        style={styles.clockButton}
        activeOpacity={0.7}
      >
        <LiveClock />
      </TouchableOpacity>

      {/* Settings Tab */}
      <TouchableOpacity
        onPress={() => navigation.navigate('settings')}
        style={styles.tabItem}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name="grid-outline"
          size={isSettingsActive ? 32 : 26}
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
    paddingBottom: 10,
    height: 80,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockButton: {
    paddingVertical: 4,      // was 12
    paddingHorizontal: 10,   // was 20
    marginVertical: 0,       // was -12
    marginHorizontal: 0,     // was -10
  },
  clockContainer: {
    paddingHorizontal: 12,   // was 20
    paddingVertical: 4,      // was 8
    borderRadius: 16,        // was 20
  },
  clockText: {
    color: '#fff',
    fontSize: 20,            // was 22
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,                  // was 4
    marginTop: 1,            // was 2
  },
  dateText: {
    color: '#888',
    fontSize: 10,            // was 11
    textAlign: 'center',
  },
  batteryText: {
    color: '#888',
    fontSize: 10,            // was 11
  },
});
