import { mutate } from '@/lib/db';

test('returns null on success', async () => {
  expect(await mutate(Promise.resolve({ error: null }))).toBeNull();
});

test('returns the error message on failure', async () => {
  expect(await mutate(Promise.resolve({ error: { message: 'boom' } }))).toBe('boom');
});
