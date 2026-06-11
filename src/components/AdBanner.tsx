import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

/**
 * Reserved advertisement slot. Swap the placeholder for a real ad unit when
 * shipping, e.g. with `react-native-google-mobile-ads` (requires an Expo dev build):
 *
 *   <BannerAd unitId={adUnitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
 *
 * `flexible` lets the slot grow into the remaining screen space (up to a
 * medium-rectangle height) instead of staying a fixed strip.
 */
export const AD_BANNER_HEIGHT = 56;

export function AdBanner({ flexible = false }: { flexible?: boolean }) {
  if (!flexible) {
    return (
      <View style={styles.strip}>
        <Text style={styles.label}>ADVERTISEMENT</Text>
      </View>
    );
  }
  return (
    <View style={styles.flexWrap}>
      <View style={styles.flexBox}>
        <Text style={styles.label}>ADVERTISEMENT</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    height: AD_BANNER_HEIGHT,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderTopWidth: 1,
    borderColor: theme.panelBorder,
  },
  flexWrap: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },
  flexBox: {
    flex: 1,
    alignSelf: 'stretch',
    minHeight: 44,
    maxHeight: 250,
    maxWidth: 480,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,220,170,0.25)',
    backgroundColor: 'rgba(0,0,0,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: 'rgba(255,246,232,0.28)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 3,
  },
});
