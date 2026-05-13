// app/(tabs)/_layout.tsx
import { Tabs, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Helper function to determine battery color
const getBatteryColor = (level: number, isCharging: boolean): string => {
  if (isCharging) return '#4CAF50'; // Green when charging
  if (level <= 10) return '#FF4444'; // Red - critical
  if (level <= 20) return '#FF9F4A'; // Orange - warning
  return '#888'; // Default gray
};

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

  const batteryColor = getBatteryColor(batteryLevel, isCharging);

  return (
    <View style={styles.clockContainer}>
      <Text style={styles.clockText}>{hours}:{minutes}</Text>
      <View style={styles.dateRow}>
        <Text style={[styles.batteryText, { color: batteryColor }]}>
          {batteryLevel}%
        </Text>
        <Ionicons
          name="flash"
          size={12}
          color={isCharging ? '#4CAF50' : batteryColor}
        />
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
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginVertical: 0,
    marginHorizontal: 0,
  },
  clockContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  clockText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  dateText: {
    color: '#888',
    fontSize: 10,
    textAlign: 'center',
  },
  batteryText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
