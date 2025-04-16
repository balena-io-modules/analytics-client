// eslint-disable-next-line @typescript-eslint/no-require-imports
const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
	baseDirectory: __dirname,
});
module.exports = [
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	...require('@balena/lint/config/eslint.config'),
	...compat.config({
		parserOptions: {
			project: 'tsconfig.dev.json',
		},
		rules: {
			'object-literal-sort-keys': 'off',
			'only-arrow-functions': ['off'],
			'max-classes-per-file': ['off'],
			'member-access': 'off',
			'member-ordering': ['off'],
			'no-shadowed-variable': 'off',
			'@typescript-eslint/no-var-requires': 'error',
			'arrow-parens': 'off',
			'no-angle-bracket-type-assertion': 'off',
			'no-console': ['off'],
			'no-empty-interface': 'off',
			'no-string-literal': 'off',
			'no-restricted-imports': [
				'error',
				{ paths: ['lodash', 'react-icons/lib/fa/'] },
			],
			'interface-name': ['off'],
			'interface-over-type-literal': 'off',
		},
	}),
];
