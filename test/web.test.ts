import { createClient } from '../src/client';
import { createWebTracker } from '../src/web';

describe('WebTracker', () => {
	const client = createClient({
		projectName: 'balena-test',
		componentName: 'test',
	});

	let passedEventType: string = '';
	let passedData: any = null;
	client.amplitude().logEvent = (event: string, data?: any) => {
		passedEventType = event;
		passedData = data;
		return 0;
	};

	const ensurePageViewProperties = () => {
		expect(passedData).toHaveProperty('metrics');
		expect(passedData).toHaveProperty('current_url');
		expect(passedData).toHaveProperty('current_url_path');
	};

	describe('With prefix', () => {
		const tracker = createWebTracker(client, 'prefix');

		it('tracks generic event', () => {
			tracker.track('event', { p1: 'v1', p2: 42 });
			expect(passedEventType).toStrictEqual('[prefix] event');
			expect(passedData).toBeTruthy();
			expect(passedData.p1).toStrictEqual('v1');
			expect(passedData.p2).toStrictEqual(42);
		});

		it('tracks page view', () => {
			tracker.trackPageView();
			expect(passedEventType).toStrictEqual('[prefix] Page View');
			ensurePageViewProperties();

			tracker.trackPageView('test event');
			expect(passedEventType).toStrictEqual('[prefix] test event');
			ensurePageViewProperties();
		});
	});

	describe('No prefix', () => {
		const tracker = createWebTracker(client);

		it('tracks generic event', () => {
			tracker.track('event', { p1: 'v1', p2: 42 });
			expect(passedEventType).toStrictEqual('event');
			expect(passedData).toBeTruthy();
			expect(passedData.p1).toStrictEqual('v1');
			expect(passedData.p2).toStrictEqual(42);
		});

		it('tracks page view', () => {
			tracker.trackPageView();
			expect(passedEventType).toStrictEqual('Page View');
			ensurePageViewProperties();

			tracker.trackPageView('test event');
			expect(passedEventType).toStrictEqual('test event');
			ensurePageViewProperties();
		});
	});
});
