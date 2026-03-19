import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testEnvironment: 'node',
  // .env laden bevor Tests starten
  setupFiles: ['<rootDir>/../jest.setup.ts'],
  // Tenant-Isolations-Tests brauchen mehr Zeit (Datenbank-Operationen)
  testTimeout: 30000,
};

export default config;
