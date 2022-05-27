module.exports = {
    roots: [
        '<rootDir>/test'
    ],
    transform: {
        '^.+\\.ts?$': 'ts-jest'
    },
    verbose: true,
    collectCoverage: true,
    coveragePathIgnorePatterns: ['./src/NoopClient.ts']
};
