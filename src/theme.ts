export const colors = {
  primary: '#5C8A77', primaryDeep: '#3C6353', ink: '#28332E',
  serifHead: '#3C4D45', bodyOnCard: '#52605A',
  gradWelcome: ['#5C8A77', '#41685A'] as const,
  gradFamilyHero: ['#5C8A77', '#487062'] as const,
  mint: '#E3EFE9', mint2: '#DCEAE3', mint3: '#EAF3EE',
  onGreenText: '#D6ECE1', onGreenSub: '#CFE6DA', heroDot: '#BFE6D2',
  appBg: '#F1F5F2', chatBg: '#EEF3F0', white: '#fff', chipBg: '#F2F6F3',
  border: '#E7EEE9', cardBorder: '#EEF3EF', chatBorder: '#EAF0EC',
  track: '#EAF0EC', divider: '#F0F4F1', dashed: '#D6DEDA', pendingRing: '#C9D3CD',
  timeline: '#E2EAE5',
  muted: '#7C8A82', muted2: '#8A968E', muted3: '#A9B4AD', chevron: '#C2CCC6',
  amber: '#C0913F', amberRole: '#B07A4E', anomalyDot: '#D6A547',
  amberFill: '#F6ECD9', amberFill2: '#F3EADF', anomalyBg: '#FBF4E6',
  anomalyBorder: '#F0E2C4', anomalyAvatar: '#F2E4C2',
  amberText: '#8A6A1E', amberBody: '#8A7338', amberCond: '#9A7B2E',
  amberMuted: '#A88A4A', amberStroke: '#B58A2E', amberTs: '#B49454', amberTs2: '#C0A463',
  rosaInitials: '#A56F42',
  docBlue: '#5E739B', docBlueBg: '#E4E9F0',
  shadowBase: '#355E50',
};

export const font = { serif: 'InstrumentSerif_400Regular' };

const weightMap: Record<number, string> = {
  400: 'HankenGrotesk_400Regular', 500: 'HankenGrotesk_500Medium',
  600: 'HankenGrotesk_600SemiBold', 700: 'HankenGrotesk_700Bold',
  800: 'HankenGrotesk_800ExtraBold',
};
export const fontFamilyForWeight = (w: number) => weightMap[w] ?? weightMap[400];

export const radius = { phone: 46, card: 24, sm: 16, pill: 999, button: 18 };

export const shadow = {
  phone: { shadowColor: colors.shadowBase, shadowOpacity: 0.16, shadowRadius: 35, shadowOffset: { width: 0, height: 30 }, elevation: 12 },
  card: { shadowColor: colors.shadowBase, shadowOpacity: 0.06, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  button: { shadowColor: '#5C8A77', shadowOpacity: 0.34, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
};
