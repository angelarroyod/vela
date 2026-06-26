import Svg, { Path, Rect, Circle } from 'react-native-svg';

export type IconName =
  | 'drop' | 'pulse' | 'heart' | 'pill' | 'clipboard' | 'home' | 'user'
  | 'message' | 'send' | 'check' | 'plus' | 'chevronRight' | 'chevronLeft'
  | 'warningTri' | 'warningCircle' | 'bell' | 'phone' | 'bulb'
  | 'signal' | 'wifi' | 'battery';

export function Icon({
  name,
  size = 24,
  color = '#28332E',
  strokeWidth = 1.9,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const stroke = {
    fill: 'none' as const,
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M3 10.5 12 3l9 7.5" {...stroke} />
          <Path d="M5 9.5V20h14V9.5" {...stroke} />
        </Svg>
      );
    case 'pulse':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M3 12h4l2-6 3 12 2-6h7" {...stroke} />
        </Svg>
      );
    case 'user':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx={12} cy={8} r={3.5} {...stroke} />
          <Path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6" {...stroke} />
        </Svg>
      );
    case 'clipboard':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x={6} y={4} width={12} height={17} rx={2.5} {...stroke} />
          <Path d="M9.5 4h5v3h-5z" {...stroke} />
          <Path d="M9 11.5h6M9 15h4" {...stroke} />
        </Svg>
      );
    case 'message':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M5 6h14v9H10l-4 3.5V15H5z" {...stroke} />
        </Svg>
      );
    case 'chevronRight':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M9 5l7 7-7 7" {...stroke} />
        </Svg>
      );
    case 'chevronLeft':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M15 5l-7 7 7 7" {...stroke} />
        </Svg>
      );
    case 'plus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 5v14M5 12h14" {...stroke} />
        </Svg>
      );
    case 'check':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M5 12.5l4.5 4.5L19 6.5" {...stroke} />
        </Svg>
      );
    case 'send':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" {...stroke} />
        </Svg>
      );
    case 'heart':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 20s-6.5-4-6.5-8.5A3.4 3.4 0 0 1 12 8a3.4 3.4 0 0 1 6.5 3.5C18.5 16 12 20 12 20z" {...stroke} />
        </Svg>
      );
    case 'drop':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 3c0 4-3 5-3 8a3 3 0 0 0 6 0c0-3-3-4-3-8z" fill={color} />
          <Path d="M8 16a4 4 0 0 0 8 0" stroke={color} strokeWidth={1.6} strokeLinecap="round" fill="none" />
        </Svg>
      );
    case 'pill':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M10.5 13.5 7 17a3.5 3.5 0 0 1-5-5l3.5-3.5" {...stroke} />
          <Path d="M13.5 10.5 17 7a3.5 3.5 0 0 0-5-5L8.5 5.5" {...stroke} />
          <Path d="M9 15l6-6" {...stroke} />
        </Svg>
      );
    case 'warningTri':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 8v5" {...stroke} />
          <Circle cx={12} cy={16.5} r={0.3} {...stroke} />
          <Path d="M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z" {...stroke} />
        </Svg>
      );
    case 'warningCircle':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 8v5" {...stroke} />
          <Circle cx={12} cy={16.5} r={0.4} {...stroke} />
        </Svg>
      );
    case 'bell':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" {...stroke} />
          <Path d="M10.5 21a1.8 1.8 0 0 0 3 0" {...stroke} />
        </Svg>
      );
    case 'phone':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L20 13l1 4v2a2 2 0 0 1-2 2A16 16 0 0 1 3 7a2 2 0 0 1 2-3z" {...stroke} />
        </Svg>
      );
    case 'bulb':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c.6.6 1 1.3 1 2h6c0-.7.4-1.4 1-2a6 6 0 0 0-4-10z" {...stroke} />
        </Svg>
      );
    case 'signal':
      return (
        <Svg width={size} height={12} viewBox="0 0 18 12">
          <Rect x={0} y={7} width={3} height={5} rx={1} fill={color} />
          <Rect x={5} y={4} width={3} height={8} rx={1} fill={color} />
          <Rect x={10} y={2} width={3} height={10} rx={1} fill={color} />
          <Rect x={15} y={0} width={3} height={12} rx={1} fill={color} />
        </Svg>
      );
    case 'wifi':
      return (
        <Svg width={17} height={12} viewBox="0 0 17 12">
          <Path
            d="M1 4.4C5.2 1 11.8 1 16 4.4M3.6 6.9C6.2 4.9 10.8 4.9 13.4 6.9M6.2 9.2C7.5 8.2 9.5 8.2 10.8 9.2"
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'battery':
      return (
        <Svg width={26} height={13} viewBox="0 0 26 13">
          <Rect x={0.5} y={0.5} width={21} height={12} rx={3.5} stroke={color} strokeOpacity={0.4} fill="none" />
          <Rect x={2} y={2} width={16.5} height={9} rx={2} fill={color} />
          <Rect x={23.5} y={4.5} width={2} height={4} rx={1} fill={color} fillOpacity={0.4} />
        </Svg>
      );
    default:
      return null;
  }
}
