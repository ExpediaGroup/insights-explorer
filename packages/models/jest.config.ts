import baseJest from '../../jest.config';
module.exports = {
  ...baseJest,
  setupFiles: ['<rootDir>/../../test/jest-setup.ts']
};
