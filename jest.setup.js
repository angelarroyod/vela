// Make fonts resolve instantly in tests without pulling native font loaders.
jest.mock('expo-font', () => ({
  __esModule: true,
  useFonts: () => [true, null],
  isLoaded: () => true,
  loadAsync: jest.fn(() => Promise.resolve()),
}));
