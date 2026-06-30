export type AuthState = {
  hasSession: boolean;
  hasMembership: boolean;
  role: 'nurse' | 'family' | 'doctor' | null;
};

// Pure decision: where the router should be for a given auth/membership state.
export function routeForState(s: AuthState): string {
  if (!s.hasSession) return '/(auth)/welcome';
  if (!s.hasMembership || !s.role) return '/(auth)/onboarding';
  return s.role === 'nurse' ? '/(app)/nurse/inicio' : '/(app)/family/inicio';
}
