import {
  patient, nurse, family, vitals, medications,
  relevoTimeline, activityFeed, messages, careTeam, contacts,
} from '@/data';

test('patient fixture matches design', () => {
  expect(patient.fullName).toBe('Sra. Elena Rivas');
  expect(patient.age).toBe(78);
  expect(patient.status).toBe('Estable');
});

test('vitals match the 00:02 control', () => {
  expect(vitals.bp).toBe('128/82');
  expect(vitals.hr).toBe(72);
  expect(vitals.spo2).toBe(97);
});

test('medication progress is 4 of 5', () => {
  const administered = medications.filter((m) => m.status === 'administered').length;
  expect(administered).toBe(4);
  expect(medications.length).toBe(5);
});

test('message thread has 4 bubbles', () => {
  expect(messages.length).toBe(4);
  expect(messages[0].fromSelf).toBe(true);
});

test('collections are populated', () => {
  expect(relevoTimeline.length).toBe(4);
  expect(activityFeed.length).toBe(4);
  expect(careTeam.length).toBe(3);
  expect(contacts.length).toBe(2);
  expect(nurse.initials).toBe('CM');
  expect(family.initials).toBe('L');
});
