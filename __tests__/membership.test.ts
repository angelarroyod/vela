import { pickActiveMembership } from '@/features/auth/useMembership';

test('prefers a nurse membership, else first', () => {
  expect(
    pickActiveMembership([
      { role: 'family', patient_id: 'p' },
      { role: 'nurse', patient_id: 'q' },
    ]),
  ).toEqual({ role: 'nurse', patient_id: 'q' });
});

test('returns null when there are no memberships', () => {
  expect(pickActiveMembership([])).toBeNull();
});

test('falls back to the first membership when no nurse role', () => {
  expect(pickActiveMembership([{ role: 'family', patient_id: 'p' }])).toEqual({ role: 'family', patient_id: 'p' });
});
