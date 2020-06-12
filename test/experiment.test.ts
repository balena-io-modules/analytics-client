import { createClient } from '../src/client';
import { LocalExperiment } from '../src/experiment';

describe('LocalExperiment', () => {
	test('define bad fractions', () => {
		expect.assertions(2);
		try {
			const exp = new LocalExperiment<'var1' | 'var2'>('test');
			exp.define('var1', 50).define('var2', 51);
		} catch (e) {
			expect(e.message).toContain('var1');
			expect(e.message).toContain('var2');
		}
	});

	test('define duplicated variations', () => {
		expect.assertions(1);
		try {
			const exp = new LocalExperiment<'var1' | 'var2'>('test');
			exp.define('var1', 50).define('var1', 30);
		} catch (e) {
			expect(e.message).toContain('var1');
		}
	});

	test('missing variations', () => {
		expect.assertions(1);
		const exp = new LocalExperiment<'var1' | 'var2'>('test').define('var1', 99);
		try {
			exp.engage('test-device');
		} catch (e) {
			expect(e.message).toContain('fully');
		}
	});

	describe('two variations experiment', () => {
		const twoVariants = new LocalExperiment<'var1' | 'var2'>('test');
		twoVariants.define('var1', 50).define('var2', 50);

		test('engage user idempotence', () => {
			const variation = twoVariants.engage('test-device-id');
			expect(variation).toBeTruthy();

			expect(twoVariants.engage('test-device-id')).toStrictEqual(variation);
			expect(twoVariants.engage('test-device-id')).toStrictEqual(variation);
		});

		test('engage user variance', () => {
			let var1Counter = 0;
			let var2Counter = 0;
			for (let i = 0; i < 100; i++) {
				if (twoVariants.engage(`test-device-id-${i}`) === 'var1') {
					var1Counter++;
				} else {
					var2Counter++;
				}
			}
			console.log('counters:', var1Counter, var2Counter);
			expect(var1Counter).toBeGreaterThan(0);
			expect(var2Counter).toBeGreaterThan(0);
		});
	});

	describe('Amplitude integration', () => {
		const analytics = createClient({
			projectName: 'balena-test',
			componentName: 'test',
		});
		let identifyCallsCount = 0;
		analytics.amplitude().identify = () => {
			identifyCallsCount++;
		};

		const exp = new LocalExperiment<'var1' | 'var2'>(
			'amplitude-test',
			analytics,
		);
		exp.define('var1', 30).define('var2', 70);

		it('sets user property', () => {
			exp.engage('test-device-1');
			expect(identifyCallsCount).toStrictEqual(1);
			exp.engage('test-device-1');
			// identify is called on every engage call.
			expect(identifyCallsCount).toStrictEqual(2);
		});
	});
});
