import React, { useState } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GameScreen } from './src/screens/GameScreen';
import { GameSetup, MenuScreen } from './src/screens/MenuScreen';

// Mobile browsers size `height: 100%` to the layout viewport, which extends
// underneath the URL bar — cutting off the bottom of the app (the PLAY button).
// `100dvh` tracks the *visible* viewport as browser chrome shows and hides.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = 'html, body, #root { height: 100% } @supports (height: 100dvh) { html, body, #root { height: 100dvh } }';
  document.head.appendChild(style);
}

export default function App() {
  const [setup, setSetup] = useState<GameSetup | null>(null);
  const [lastSetup, setLastSetup] = useState<GameSetup | undefined>(undefined);
  const [gameId, setGameId] = useState(0);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {setup ? (
        <GameScreen
          // remount per game so all animation state starts clean
          key={gameId}
          setup={setup}
          onExit={() => {
            setSetup(null);
            setGameId((n) => n + 1);
          }}
        />
      ) : (
        <MenuScreen
          initial={lastSetup}
          onStart={(s) => {
            setSetup(s);
            setLastSetup(s);
            setGameId((n) => n + 1);
          }}
        />
      )}
    </SafeAreaProvider>
  );
}
