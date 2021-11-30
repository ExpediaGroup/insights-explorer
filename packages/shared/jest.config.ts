import baseJest from '../../jest.config';
module.exports = {
  ...baseJest,
  moduleNameMapper: {
    '@iex/shared/(.*)': '<rootDir>/../../packages/shared/src/$1'
  },
  setupFiles: ['<rootDir>/../../test/jest-setup.ts']
};
