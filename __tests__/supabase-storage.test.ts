import { makeStorage } from '@/lib/supabase';

test('web storage uses the provided localStorage-like backend', async () => {
  const mem: Record<string, string> = {};
  const web = makeStorage({
    getItem: (k) => mem[k] ?? null,
    setItem: (k, v) => { mem[k] = v; },
    removeItem: (k) => { delete mem[k]; },
  });
  await web.setItem('k', 'v');
  expect(await web.getItem('k')).toBe('v');
  await web.removeItem('k');
  expect(await web.getItem('k')).toBeNull();
});
