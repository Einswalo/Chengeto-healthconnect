import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="prescription-details" />
        <Stack.Screen name="record-details" />
        <Stack.Screen name="ai-history" />
        {/* profile is already inside (tabs) - don't duplicate here */}
      </Stack>

      <StatusBar style="dark" />
    </>
  );
}