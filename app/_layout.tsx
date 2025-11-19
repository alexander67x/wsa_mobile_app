import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(worker)" />
        <Stack.Screen name="project-detail" />
        <Stack.Screen name="create-report" />
        <Stack.Screen name="attach-evidence" />
        <Stack.Screen name="report-detail" />
        <Stack.Screen name="kanban" />
        <Stack.Screen name="request-material" />
        <Stack.Screen name="material-request-detail" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
