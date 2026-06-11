import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';

/** Subtle wooden-plank texture drawn over the background gradient. */
export function WoodBackground() {
  const { width, height } = useWindowDimensions();
  const planks = 6;
  const pw = width / planks;

  const art = useMemo(() => {
    const seams: React.ReactElement[] = [];
    const grains: React.ReactElement[] = [];
    const knots: React.ReactElement[] = [];
    let seed = 7;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = 1; i < planks; i++) {
      seams.push(<Line key={`s${i}`} x1={i * pw} y1={0} x2={i * pw} y2={height} stroke="rgba(0,0,0,0.35)" strokeWidth={2.5} />);
      seams.push(<Line key={`sh${i}`} x1={i * pw + 2} y1={0} x2={i * pw + 2} y2={height} stroke="rgba(255,200,130,0.06)" strokeWidth={1.5} />);
    }
    for (let i = 0; i < planks; i++) {
      const gx = i * pw;
      for (let g = 0; g < 4; g++) {
        const x0 = gx + pw * (0.2 + rand() * 0.6);
        const amp = 6 + rand() * 14;
        grains.push(
          <Path
            key={`g${i}-${g}`}
            d={`M ${x0} 0 C ${x0 + amp} ${height * 0.3}, ${x0 - amp} ${height * 0.6}, ${x0 + amp * 0.5} ${height}`}
            stroke="rgba(0,0,0,0.16)"
            strokeWidth={1.4}
            fill="none"
          />,
        );
      }
      if (rand() > 0.45) {
        const ky = height * (0.1 + rand() * 0.8);
        const kx = gx + pw * (0.25 + rand() * 0.5);
        knots.push(
          <React.Fragment key={`k${i}`}>
            <Ellipse cx={kx} cy={ky} rx={9} ry={14} fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth={2} />
            <Ellipse cx={kx} cy={ky} rx={4} ry={7} fill="rgba(0,0,0,0.3)" />
            <Circle cx={kx} cy={ky} r={1.6} fill="rgba(255,190,120,0.15)" />
          </React.Fragment>,
        );
      }
      // alternating plank tint
      if (i % 2 === 0) {
        grains.push(<Rect key={`t${i}`} x={gx} y={0} width={pw} height={height} fill="rgba(255,190,110,0.03)" />);
      }
    }
    return { seams, grains, knots };
  }, [width, height, pw]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height}>
        {art.grains}
        {art.seams}
        {art.knots}
      </Svg>
    </View>
  );
}
