module.exports = {
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less)$': 'identity-obj-proxy',
  },
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  // collectCoverage: true,
  setupFiles: ['<rootDir>/tests/jest.setup.js'],
  testTimeout: 30000,
};
