import { mapVital, mapMed, mapMessage } from '@/features/care/hooks';

test('mapVital formats bp + fields', () => {
  const v = mapVital({ bp_sys: 128, bp_dia: 82, hr: 72, temp_c: 36.7, spo2: 97, taken_at: '2026-07-03T00:02:00Z', note: 'ok' });
  expect(v.bp).toBe('128/82');
  expect(v.hr).toBe(72);
  expect(v.note).toBe('ok');
});

test('mapMed marks administered vs pending', () => {
  expect(mapMed({ name: 'Losartán', dose: '50 mg', reason: 'PA', scheduled_at: '2026-07-03T23:30:00Z', status: 'administered' }).status).toBe('administered');
  expect(mapMed({ name: 'Levotiroxina', dose: '50 mcg', reason: 'Tiroides', scheduled_at: '2026-07-03T06:00:00Z', status: 'pending' }).sub).toBe('Próxima');
});

test('mapMessage flags self', () => {
  expect(mapMessage({ sender_id: 'me', body: 'hola', created_at: '2026-07-03T23:38:00Z' }, 'me').fromSelf).toBe(true);
  expect(mapMessage({ sender_id: 'nurse', body: 'hola', created_at: '2026-07-03T23:40:00Z' }, 'me').fromSelf).toBe(false);
});
