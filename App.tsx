// App.tsx - Versão corrigida
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import ExcelImporter from './components/ExcelImporter';

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
        <ExcelImporter />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}