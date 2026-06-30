import { generateInviteCode, normalizeInviteCode } from '@/features/auth/invite';

test('generated code is 6 uppercase alphanumerics', () => {
  const c = generateInviteCode();
  expect(c).toMatch(/^[A-Z0-9]{6}$/);
});

test('generated code length is configurable', () => {
  expect(generateInviteCode(8)).toHaveLength(8);
});

test('normalize trims, uppercases, strips spaces/dashes', () => {
  expect(normalizeInviteCode(' ab-c d1 ')).toBe('ABCD1');
});
