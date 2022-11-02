import { Client } from '../src/client';
import { createWebTracker } from '../src/web';

describe('WebTracker', () => {
	let passedEventType: string = '';
	let passedData: any = null;
	const createMockClient = (): Client => {
		return {
			track: (event: string, data?: any) => {
				passedEventType = event;
				passedData = data;
			},
			deviceId: jest.fn(),
			sessionId: jest.fn(),
			regenerateDeviceId: jest.fn(),
			linkDevices: jest.fn(),
			setDeviceId: jest.fn(),
			setSessionId: jest.fn(),
			setUserId: jest.fn(),
			setUserProperties: jest.fn(),
			identify: jest.fn(),
		};
	};

	const client = createMockClient();

	const ensurePageViewProperties = () => {
		expect(passedData).toHaveProperty('metrics');
		expect(passedData).toHaveProperty('current_url');
		expect(passedData).toHaveProperty('current_url_path');
	};

	const ensureNavigationClickProperties = () => {
		expect(passedData).toHaveProperty('current_url');
		expect(passedData).toHaveProperty('current_url_path');
		expect(passedData).toHaveProperty('href');
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

		it('tracks navigation click', () => {
			tracker.trackNavigationClick('https://balena.io/docs');
			expect(passedEventType).toStrictEqual('[prefix] Navigation Click');
			ensureNavigationClickProperties();

			tracker.trackNavigationClick('https://balena.io/docs', { p: 0 });
			expect(passedEventType).toStrictEqual('[prefix] Navigation Click');
			ensureNavigationClickProperties();
			expect(passedData.p).toStrictEqual(0);
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

	describe('Page load metrics', () => {
		const tracker = createWebTracker(client);

		it('should return with performance measures from window entries', () => {
			Object.defineProperty(window, 'performance', {
				value: {
					getEntriesByType: jest.fn().mockReturnValue([
						{
							domInteractive: 8,
							domComplete: 9,
							loadEventEnd: 10,
							startTime: 2,
						},
					]),
				},
			});

			tracker.trackPageView();
			expect(passedData.metrics).toEqual({
				domInteractive: 6,
				domComplete: 7,
				loadEventEnd: 8,
			});
		});
	});
});
