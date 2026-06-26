import { colors, font, radius, shadow, fontFamilyForWeight } from '@/theme';

test('core brand colors present', () => {
  expect(colors.primary).toBe('#5C8A77');
  expect(colors.ink).toBe('#28332E');
  expect(colors.appBg).toBe('#F1F5F2');
});

test('weight maps to google-font family', () => {
  expect(fontFamilyForWeight(700)).toBe('HankenGrotesk_700Bold');
  expect(fontFamilyForWeight(400)).toBe('HankenGrotesk_400Regular');
  expect(font.serif).toBe('InstrumentSerif_400Regular');
});

test('phone frame shadow shaped for RN', () => {
  expect(shadow.phone.shadowColor).toBe('#355E50');
  expect(radius.phone).toBe(46);
});
