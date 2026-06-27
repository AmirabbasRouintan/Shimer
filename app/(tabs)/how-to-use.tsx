import { Header } from "@/components/Header";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  Text,
  View,
} from "react-native";

export default function HowToUseScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-black">
      <Header title="How to Use Shimer" onBack={() => router.push("/settings")} />

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mt-2 mb-6 py-7 px-5">
          <View className="w-16 h-16 rounded-full justify-center items-center mb-4">
            <Ionicons name="rocket-outline" size={36} color="#fff" />
          </View>
          <Text className="text-white text-[26px] font-bold tracking-tight mb-2">
            Welcome to Shimer
          </Text>
          <Text className="text-gray-400 text-base text-center leading-6 max-w-[300px]">
            Your all-in-one time tracking, productivity, and personal organization app
          </Text>
        </View>

        <View className="gap-0.5 mb-1">
          <View className="rounded-xl p-4 mb-0">
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-lg justify-center items-center bg-white/10">
                <Ionicons name="timer-outline" size={20} color="#fff" />
              </View>
              <Text className="text-white text-base font-semibold tracking-tight">Live Timer</Text>
            </View>
            <View className="h-[0.5px] bg-[#1a1a1a] my-3 -mx-1" />
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Tap on any activity from the Activities tab to start tracking your time</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• The main screen shows a live clock with countdown and stopwatch modes</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Use the "+" button to add 5 minutes to your current timer</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Tap the "i" button to invert the timer (counts up instead of down)</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Long-press the clock to access customization options</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Tap the clock to start a 5-minute break when timer is running</Text>
          </View>

          <View className="rounded-xl p-4 mb-0">
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-lg justify-center items-center bg-[#96CEB4]/20">
                <Ionicons name="layers-outline" size={20} color="#96CEB4" />
              </View>
              <Text className="text-white text-base font-semibold tracking-tight">Activities</Text>
            </View>
            <View className="h-[0.5px] bg-[#1a1a1a] my-3 -mx-1" />
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Create, edit, and delete activities with custom names, icons, and colors</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Drag and drop to reorder your activities list</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Each activity can have its own Pomodoro timer duration</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Link checklists to activities for task management</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Link goals to activities to track progress</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Set "Keep Screen On" option for specific activities</Text>
          </View>

          <View className="rounded-xl p-4 mb-0">
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-lg justify-center items-center bg-[#FFEAA7]/20">
                <Ionicons name="flag-outline" size={20} color="#FFEAA7" />
              </View>
              <Text className="text-white text-base font-semibold tracking-tight">Goals</Text>
            </View>
            <View className="h-[0.5px] bg-[#1a1a1a] my-3 -mx-1" />
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Create goals with custom titles, colors, and completion emojis</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Set repeat schedules (Daily, Weekly, or specific days)</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Choose duration for each goal (30 min, 1h, 2h, 3h, 4h, or Custom)</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Track progress with visual progress bars (up to 100%)</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Add extra time (+1m) when a goal timer reaches zero</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Long-press the +1m button to add 1 hour instead</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Link checklists to goals for task tracking</Text>
          </View>

          <View className="rounded-xl p-4 mb-0">
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-lg justify-center items-center bg-[#DDA0DD]/20">
                <Ionicons name="checkbox-outline" size={20} color="#DDA0DD" />
              </View>
              <Text className="text-white text-base font-semibold tracking-tight">Checklists</Text>
            </View>
            <View className="h-[0.5px] bg-[#1a1a1a] my-3 -mx-1" />
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Create reusable checklists with custom icons</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Add, remove, and reorder checklist items</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Mark items as completed by tapping the checkbox</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Link checklists to activities or goals</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Choose which checklist appears on your home screen</Text>
          </View>

          <View className="rounded-xl p-4 mb-0">
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-lg justify-center items-center bg-[#45B7D1]/20">
                <Ionicons name="stats-chart-outline" size={20} color="#45B7D1" />
              </View>
              <Text className="text-white text-base font-semibold tracking-tight">Summary & Statistics</Text>
            </View>
            <View className="h-[0.5px] bg-[#1a1a1a] my-3 -mx-1" />
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• View your time distribution with an interactive donut chart</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Tap on any donut slice to see detailed activity info</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Filter data by Today, Yesterday, 7 days, or 30 days</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• See percentage change compared to previous period</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Activity breakdown with progress bars and percentages</Text>
          </View>

          <View className="rounded-xl p-4 mb-0">
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-lg justify-center items-center bg-[#F7B731]/20">
                <Ionicons name="time-outline" size={20} color="#F7B731" />
              </View>
              <Text className="text-white text-base font-semibold tracking-tight">History</Text>
            </View>
            <View className="h-[0.5px] bg-[#1a1a1a] my-3 -mx-1" />
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• View your daily activity timeline with visual bars</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Tap on any entry to edit the activity type or duration</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Long-press or use the edit modal to delete entries</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Manually add new entries with custom start times</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Navigate between dates using the calendar picker</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• See currently running timer at the bottom of the list</Text>
          </View>

          <View className="rounded-xl p-4 mb-0">
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-lg justify-center items-center bg-[#FF9F4A]/20">
                <Ionicons name="folder-outline" size={20} color="#FF9F4A" />
              </View>
              <Text className="text-white text-base font-semibold tracking-tight">Tasks & Folders</Text>
            </View>
            <View className="h-[0.5px] bg-[#1a1a1a] my-3 -mx-1" />
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Organize tasks into custom folders (Today, Tomorrow, etc.)</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Add tasks with descriptions, activities, and optional timers</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Tap a task to instantly start a timer for that activity</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Tasks automatically move from Tomorrow to Today at midnight</Text>
          </View>

          <View className="rounded-xl p-4 mb-0">
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-lg justify-center items-center bg-[#E8635E]/20">
                <Ionicons name="calendar-outline" size={20} color="#E8635E" />
              </View>
              <Text className="text-white text-base font-semibold tracking-tight">Calendar & JSON Planner</Text>
            </View>
            <View className="h-[0.5px] bg-[#1a1a1a] my-3 -mx-1" />
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• View your monthly calendar with event indicators</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Add time-based events to any day</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Create JSON-based daily plans with schedules and checklists</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Save and restore plans for any date</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• View all your saved plans in the "All Plans" section</Text>
          </View>

          <View className="rounded-xl p-4 mb-0">
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-lg justify-center items-center bg-[#6C5CE7]/20">
                <Ionicons name="mic-outline" size={20} color="#6C5CE7" />
              </View>
              <Text className="text-white text-base font-semibold tracking-tight">Voice Notes</Text>
            </View>
            <View className="h-[0.5px] bg-[#1a1a1a] my-3 -mx-1" />
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Record and save voice notes with automatic naming</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Swipe left on any note to delete it</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Tap to play back your recordings</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Visual audio meter while recording</Text>
          </View>

          <View className="rounded-xl p-4 mb-0">
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-lg justify-center items-center bg-[#98D8C8]/20">
                <Ionicons name="document-text-outline" size={20} color="#98D8C8" />
              </View>
              <Text className="text-white text-base font-semibold tracking-tight">Rich Text Notes</Text>
            </View>
            <View className="h-[0.5px] bg-[#1a1a1a] my-3 -mx-1" />
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Create formatted notes with headings, bold, italic, and underline</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Add images from gallery or camera</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Insert links and code blocks</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Categorize notes and link to other notes</Text>
          </View>

          <View className="rounded-xl p-4 mb-0">
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-lg justify-center items-center bg-[#888]/15">
                <Ionicons name="lock-closed-outline" size={20} color="#888888" />
              </View>
              <Text className="text-white text-base font-semibold tracking-tight">Secure File Vault</Text>
            </View>
            <View className="h-[0.5px] bg-[#1a1a1a] my-3 -mx-1" />
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Protect sensitive files with PIN, Pattern, or Fingerprint lock</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Store documents, images, and other files securely</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Files are encrypted and stored locally on your device</Text>
          </View>

          <View className="rounded-xl p-4 mb-0">
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-lg justify-center items-center bg-[#4ECDC4]/20">
                <Ionicons name="cloud-upload-outline" size={20} color="#4ECDC4" />
              </View>
              <Text className="text-white text-base font-semibold tracking-tight">Backup & Restore</Text>
            </View>
            <View className="h-[0.5px] bg-[#1a1a1a] my-3 -mx-1" />
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Create full backups of all your app data (activities, history, notes, etc.)</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Save backups to phone storage or share via email/cloud</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Restore from previously saved backup files</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Set automatic backup frequency (Daily, Weekly, Monthly)</Text>
          </View>

          <View className="rounded-xl p-4 mb-0">
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-lg justify-center items-center bg-[#A8E6CF]/20">
                <Ionicons name="home-outline" size={20} color="#A8E6CF" />
              </View>
              <Text className="text-white text-base font-semibold tracking-tight">Home Screen Customization</Text>
            </View>
            <View className="h-[0.5px] bg-[#1a1a1a] my-3 -mx-1" />
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Choose which checklist appears on your home screen</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Toggle checklist visibility on/off</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Drag and drop to reorder goals on your home screen</Text>
            <Text className="text-neutral-400 text-sm leading-5 mb-1.5 ml-0.5">• Create and manage goals directly from the home screen</Text>
          </View>
        </View>

        <View className="rounded-xl p-4 mt-4 mb-4 border-[0.5px] border-white/10">
          <View className="flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-lg justify-center items-center bg-white/10">
              <Ionicons name="bulb-outline" size={20} color="#fff" />
            </View>
            <Text className="text-white text-base font-semibold tracking-tight">Tips & Tricks</Text>
          </View>
          <View className="h-[0.5px] bg-[#1a1a1a] my-3 -mx-1" />
          <Text className="text-neutral-400 text-xs leading-6 mb-1.5 ml-0.5">💡 Long-press on any history entry to quickly delete it</Text>
          <Text className="text-neutral-400 text-xs leading-6 mb-1.5 ml-0.5">💡 Swipe left on voice notes or planned dates to delete</Text>
          <Text className="text-neutral-400 text-xs leading-6 mb-1.5 ml-0.5">💡 Drag the handle (⋮⋮) on activities and goals to reorder</Text>
          <Text className="text-neutral-400 text-xs leading-6 mb-1.5 ml-0.5">💡 Tap the clock during a timer to start a 5-minute break</Text>
          <Text className="text-neutral-400 text-xs leading-6 mb-1.5 ml-0.5">💡 Use the "Auto Backup" feature to never lose your data</Text>
          <Text className="text-neutral-400 text-xs leading-6 mb-1.5 ml-0.5">💡 Link checklists to activities for better task management</Text>
          <Text className="text-neutral-400 text-xs leading-6 mb-1.5 ml-0.5">💡 Create goals with repeat schedules to build habits</Text>
        </View>

        <View className="items-center mt-2 mb-5 py-5">
          <Text className="text-gray-600 text-xs font-medium mb-1">Made with ❤️ for better productivity</Text>
          <Text className="text-gray-700 text-[11px] font-medium">Shimer v2026.1.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}
