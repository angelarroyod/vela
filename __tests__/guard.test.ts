import { routeForState } from '@/features/auth/guard';

test('no session -> auth welcome', () => {
  expect(routeForState({ hasSession: false, hasMembership: false, role: null })).toBe('/(auth)/welcome');
});
test('session but no membership -> onboarding', () => {
  expect(routeForState({ hasSession: true, hasMembership: false, role: null })).toBe('/(auth)/onboarding');
});
test('nurse membership -> nurse home', () => {
  expect(routeForState({ hasSession: true, hasMembership: true, role: 'nurse' })).toBe('/(app)/nurse/inicio');
});
test('family membership -> family home', () => {
  expect(routeForState({ hasSession: true, hasMembership: true, role: 'family' })).toBe('/(app)/family/inicio');
});
