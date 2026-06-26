// Static mock fixtures pulled verbatim from the Vela design canvas.
// M3 will replace the *source* of this data with Supabase while keeping these types.

export interface Vitals {
  bp: string;
  hr: number;
  tempC: number;
  spo2: number;
  takenAt: string;
  note: string;
}
export interface Medication {
  name: string;
  dose: string;
  reason: string;
  time: string;
  status: 'administered' | 'pending';
  sub: string;
  highlight?: boolean;
}
export interface TimelineEntry {
  title: string;
  time: string;
  body: string;
  tone: 'normal' | 'anomaly';
}
export interface FeedEntry {
  who: string;
  initials: string;
  action: string;
  time: string;
  tone: 'normal' | 'anomaly';
  chips?: string[];
  body?: string;
}
export interface Message {
  body: string;
  time: string;
  fromSelf: boolean;
}
export interface Member {
  name: string;
  initials: string;
  role: string;
  bg: string;
  fg: string;
}
export interface Contact {
  name: string;
  sub: string;
  initials: string;
  bg: string;
  fg: string;
}

export const patient = {
  fullName: 'Sra. Elena Rivas',
  shortName: 'Elena',
  age: 78,
  room: 'Habitación principal',
  status: 'Estable' as const,
  conditions: ['Hipertensión', 'Movilidad reducida'],
  conditionsFull: ['Hipertensión', 'Hipotiroidismo', 'Movilidad reducida'],
  allergy: 'Penicilina',
};

export const nurse = {
  name: 'Carmen Morales',
  short: 'Carmen',
  initials: 'CM',
  shift: 'Turno nocturno · 22:00 – 06:00',
};

export const family = { name: 'Lucía Rivas', short: 'Lucía', initials: 'L' };

export const vitals: Vitals = {
  bp: '128/82',
  hr: 72,
  tempC: 36.7,
  spo2: 97,
  takenAt: '00:02',
  note: 'Durmió tranquila las últimas dos horas. Sin molestias ni dolor. Piel hidratada.',
};

export const medsProgress = { done: 4, total: 5 };

export const medications: Medication[] = [
  { name: 'Amlodipino', dose: '5 mg', reason: 'Presión arterial', time: '08:00', status: 'administered', sub: 'Administrada' },
  { name: 'Atorvastatina', dose: '20 mg', reason: 'Colesterol', time: '20:00', status: 'administered', sub: 'Administrada' },
  { name: 'Paracetamol', dose: '1 g', reason: 'Dolor leve', time: '14:00', status: 'administered', sub: 'Administrada' },
  { name: 'Losartán', dose: '50 mg', reason: 'Presión arterial', time: '23:30', status: 'administered', sub: 'hace 14 min', highlight: true },
  { name: 'Levotiroxina', dose: '50 mcg', reason: 'Tiroides · en ayunas', time: '06:00', status: 'pending', sub: 'Próxima' },
];

export const relevoTimeline: TimelineEntry[] = [
  { title: 'Medicación administrada', time: '23:30', body: 'Losartán 50 mg · sin reacción', tone: 'normal' },
  { title: 'Signos vitales', time: '00:02', body: 'PA 128/82 · FC 72 · 36.7° · SpO₂ 97% — todo normal', tone: 'normal' },
  { title: 'Anomalía leve', time: '01:15', body: 'Tos seca ocasional, sin fiebre. Se mantiene en observación.', tone: 'anomaly' },
  { title: 'Cambio de posición', time: '03:00', body: 'Descansó cómoda el resto de la noche', tone: 'normal' },
];

export const recommendation = 'Vigilar la tos y ofrecer líquidos tibios. Avisar al médico si aparece fiebre.';

export const activityFeed: FeedEntry[] = [
  { who: 'Carmen', initials: 'CM', action: 'registró signos vitales', time: '00:02', tone: 'normal', chips: ['PA 128/82', '72 lpm', '36.7°', '97%'] },
  { who: 'Carmen', initials: 'CM', action: 'notó algo a observar', time: '01:15', tone: 'anomaly', body: 'Tos seca ocasional, sin fiebre. La mantengo vigilada y con líquidos tibios. Nada de qué preocuparse por ahora.' },
  { who: 'Carmen', initials: 'CM', action: 'administró la medicación', time: '23:30', tone: 'normal', body: 'Losartán 50 mg · tomada sin problema 💊' },
  { who: 'Carmen', initials: 'CM', action: 'acomodó a Elena para dormir', time: '22:40', tone: 'normal', body: 'Cómoda y tranquila. Cena ligera completa.' },
];

export const messages: Message[] = [
  { body: 'Hola Carmen, ¿cómo va la noche? ¿Logró dormir mamá?', time: '23:38 · Leído', fromSelf: true },
  { body: 'Hola Lucía 🌙 Todo tranquilo. Está descansando muy bien, signos vitales normales.', time: '23:40', fromSelf: false },
  { body: 'Tuvo algo de tos seca pero sin fiebre. La estoy vigilando y le di líquidos tibios.', time: '23:41', fromSelf: false },
  { body: 'Gracias por cuidarla tan bien 🙏 Me deja mucho más tranquila.', time: '23:43', fromSelf: true },
];

export const careTeam: Member[] = [
  { name: 'Carmen', initials: 'CM', role: 'Noche', bg: '#DCEAE3', fg: '#3C6353' },
  { name: 'Rosa', initials: 'RG', role: 'Día', bg: '#F3EADF', fg: '#A56F42' },
  { name: 'Dr. Méndez', initials: 'DM', role: 'Cardio', bg: '#E4E9F0', fg: '#5E739B' },
];

export const contacts: Contact[] = [
  { name: 'Dr. Méndez', sub: 'Cardiología', initials: 'DM', bg: '#E4E9F0', fg: '#5E739B' },
  { name: 'Lucía Rivas', sub: 'Hija · contacto principal', initials: 'L', bg: '#DCEAE3', fg: '#3C6353' },
];
