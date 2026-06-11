import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GameScreen } from './src/screens/GameScreen';
import { GameSetup, MenuScreen } from './src/screens/MenuScreen';

export default function App() {
  const [setup, setSetup] = useState<GameSetup | null>(null);
  const [lastSetup, setLastSetup] = useState<GameSetup | undefined>(undefined);
  const [gameId, setGameId] = useState(0);

  return (
    <>
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
    </>
  );
}
