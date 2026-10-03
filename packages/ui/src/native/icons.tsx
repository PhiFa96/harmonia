// Eigene Symbole (24er-Raster, 2 pt Linie, runde Enden), passend zur Design-Richtung.
// Bibliotheken wurden geprüft und verworfen (docs/plan/design-richtung.md, Abschnitt Symbole).
// Symbole sind für Screenreader ausgeblendet; die Bedeutung trägt immer ein Text oder eine Beschriftung.

import type { ColorValue } from 'react-native';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

export type IconName =
  | 'check'
  | 'close'
  | 'chevronRight'
  | 'chevronLeft'
  | 'chevronDown'
  | 'speaker'
  | 'play'
  | 'headphones'
  | 'sparkle'
  | 'lock'
  | 'flame'
  | 'path'
  | 'metronome'
  | 'person'
  | 'globe'
  | 'moon'
  | 'vibration'
  | 'motion'
  | 'target'
  | 'bell'
  | 'crown';

export interface IconProps {
  readonly name: IconName;
  readonly size?: number;
  readonly color: ColorValue;
  /** Gefüllte Variante (z. B. aktiver Tab), soweit vorhanden */
  readonly filled?: boolean;
  /** Linienstärke im 24er-Raster. Standard: 2 */
  readonly strokeWidth?: number;
}

/** Ein Symbol. Unbekannte Füllvarianten fallen auf die Linienform zurück. */
export function Icon({ name, size = 24, color, filled = false, strokeWidth = 2 }: IconProps) {
  const line = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: 'none',
  } as const;
  // Ausblenden über eine View: Am Svg selbst landen die Props im Web als ungültige DOM-Attribute
  return (
    <View aria-hidden>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {shape(name, line, color, filled)}
      </Svg>
    </View>
  );
}

interface Line {
  readonly stroke: ColorValue;
  readonly strokeWidth: number;
  readonly strokeLinecap: 'round';
  readonly strokeLinejoin: 'round';
  readonly fill: 'none';
}

function shape(name: IconName, line: Line, color: ColorValue, filled: boolean) {
  switch (name) {
    case 'check':
      return <Path d="M5 12.5l4.5 4.5L19 7.5" {...line} />;
    case 'close':
      return <Path d="M6 6l12 12M18 6L6 18" {...line} />;
    case 'chevronRight':
      return <Path d="M9 6l6 6-6 6" {...line} />;
    case 'chevronLeft':
      return <Path d="M15 6l-6 6 6 6" {...line} />;
    case 'chevronDown':
      return <Path d="M6 9l6 6 6-6" {...line} />;
    case 'speaker':
      return (
        <>
          <Path d="M4 10h3l5-4v12l-5-4H4z" {...line} />
          <Path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" {...line} />
        </>
      );
    case 'play':
      return (
        <Path
          d="M8 5.5v13a1 1 0 0 0 1.5.9l10.4-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z"
          fill={color}
        />
      );
    case 'headphones':
      return (
        <>
          <Path d="M4 15v-3a8 8 0 0 1 16 0v3" {...line} />
          <Path
            d="M4 15h3v6H5.5A1.5 1.5 0 0 1 4 19.5zM20 15h-3v6h1.5a1.5 1.5 0 0 0 1.5-1.5z"
            {...line}
          />
        </>
      );
    case 'sparkle':
      return (
        <>
          <Path d="M12 3l1.8 4.9L19 9.7l-5.2 1.8L12 16.5l-1.8-5L5 9.7l5.2-1.8z" {...line} />
          <Path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" {...line} />
        </>
      );
    case 'lock':
      return (
        <>
          <Path
            d="M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z"
            {...line}
          />
          <Path d="M8 11V8a4 4 0 0 1 8 0v3" {...line} />
        </>
      );
    case 'flame':
      return (
        <Path
          d="M12 2.5c.9 3 4.8 4.9 4.8 10a4.8 4.8 0 0 1-9.6 0c0-2 .9-3.4 2-4.4.2 1.5 1 2.6 2.1 3.1-.4-3.6.1-6.4.7-8.7z"
          fill={color}
        />
      );
    case 'path':
      return (
        <>
          <Path d="M6 19c0-4 12-2.5 12-7S8 9 8 5" {...line} />
          <Circle cx={6} cy={19.5} r={2} fill={color} />
          <Circle cx={8} cy={4.5} r={2} fill={color} />
        </>
      );
    case 'metronome':
      return (
        <>
          <Path d="M9 3h6l3.5 18h-13z" {...line} fill={filled ? color : 'none'} />
          <Path d="M12 15l5-9" {...line} />
          <Path d="M7 16h10" {...line} />
        </>
      );
    case 'person':
      return filled ? (
        <>
          <Circle cx={12} cy={8} r={4} fill={color} />
          <Path d="M4 21a8 8 0 0 1 16 0z" fill={color} />
        </>
      ) : (
        <>
          <Circle cx={12} cy={8} r={4} {...line} />
          <Path d="M4 21a8 8 0 0 1 16 0" {...line} />
        </>
      );
    case 'globe':
      return (
        <>
          <Circle cx={12} cy={12} r={9} {...line} />
          <Path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" {...line} />
        </>
      );
    case 'moon':
      return <Path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" {...line} />;
    case 'vibration':
      return (
        <>
          <Path
            d="M9 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
            {...line}
          />
          <Path d="M3 9v6M21 9v6" {...line} />
        </>
      );
    case 'motion':
      return <Path d="M3 17c3 0 3-10 6-10s3 10 6 10 3-6 6-6" {...line} />;
    case 'target':
      return (
        <>
          <Circle cx={12} cy={12} r={8} {...line} />
          <Circle cx={12} cy={12} r={4} {...line} />
          <Circle cx={12} cy={12} r={1} fill={color} />
        </>
      );
    case 'bell':
      return (
        <>
          <Path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" {...line} />
          <Path d="M10 21h4" {...line} />
        </>
      );
    case 'crown':
      return <Path d="M4 18h16M5 15l-1.5-8 5 3.5L12 5l3.5 5.5 5-3.5L19 15z" {...line} />;
  }
}
