import { renderHook, waitFor } from '@testing-library/react-native';
import { useLiveList } from '@/features/care/useLiveList';

const mockOrder = jest.fn(() => Promise.resolve({ data: [{ n: 1 }, { n: 2 }] }));
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ order: mockOrder }) }) }),
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: jest.fn(),
  },
}));

test('fetches and maps rows for a patient', async () => {
  const { result } = renderHook(() =>
    useLiveList('vitals', 'p1', { col: 'taken_at', asc: false }, (r: { n: number }) => r.n * 10),
  );
  await waitFor(() => expect(result.current).toEqual([10, 20]));
});

test('returns empty with no patient', () => {
  const { result } = renderHook(() =>
    useLiveList('vitals', undefined, { col: 'taken_at', asc: false }, (r: unknown) => r),
  );
  expect(result.current).toEqual([]);
});
