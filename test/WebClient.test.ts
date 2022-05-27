/**
 * @jest-environment jsdom
 */

import { WebClient } from '../src/WebClient';
import * as Cookies from 'js-cookie';

const amplitudeClientMock = {
	regenerateDeviceId: jest.fn(),
	setUserId: jest.fn(),
	setDeviceId: jest.fn(),
	init: jest.fn(),
	identify: jest.fn(),
	setVersionName: jest.fn(),
	getSessionId: jest.fn(),
	setSessionId: jest.fn(),
	logEvent: jest.fn(),
	options: {
		deviceId: 'test-device-id',
	},
};

const identiFyMock = {
	set: jest.fn().mockReturnValue({ set: jest.fn() }),
	setOnce: jest.fn(),
};

interface DOMPerformanceMetric {
	domInteractive: number;
	domComplete: number;
	loadEventEnd: number;
	startTime: number;
}

const mockWindowMetrics = (windowMetrics: DOMPerformanceMetric[]) => {
	const getEntriesByType = jest.fn().mockReturnValue(windowMetrics);
	const originalWindow = { ...window };
	const windowSpy = jest.spyOn(global, 'window', 'get');
	windowSpy.mockImplementation(
		() =>
			({
				...originalWindow,
				performance: {
					...originalWindow.performance,
					getEntriesByType,
				},
			} as any),
	);
};

jest.mock('mixpanel-browser', () => ({
	init: jest.fn(),
	get_distinct_id: jest.fn().mockReturnValue('mixpanel-distincdt-id'),
}));

jest.mock('amplitude-js', () => ({
	getInstance: () => amplitudeClientMock,
	Identify: () => identiFyMock,
}));

let client: WebClient;

beforeEach(() => {
	client = new WebClient(
		{
			projectName: 'balena-test',
			componentName: 'test',
		},
		'TEST',
	);
	amplitudeClientMock.regenerateDeviceId.mockClear();
	amplitudeClientMock.setUserId.mockClear();
	amplitudeClientMock.setDeviceId.mockClear();
	amplitudeClientMock.init.mockClear();
	amplitudeClientMock.identify.mockClear();
	amplitudeClientMock.setVersionName.mockClear();
	amplitudeClientMock.getSessionId.mockClear();

	identiFyMock.set.mockClear();
	identiFyMock.setOnce.mockClear();
});

describe('client interface tests', () => {
	test('deviceId', () => {
		expect(client.deviceId()).toBe('test-device-id');
		client.regenerateDeviceId();
		expect(amplitudeClientMock.regenerateDeviceId).toBeCalled();

		client.setDeviceId('test-2');
		expect(amplitudeClientMock.setDeviceId).toHaveBeenLastCalledWith('test-2');
	});

	test('sessionId', () => {
		client.setSessionId(3);
		expect(amplitudeClientMock.setSessionId).toHaveBeenCalledWith(3);
		client.sessionId();
		expect(amplitudeClientMock.getSessionId).toHaveBeenCalled();
	});

	test('device linking with different user', () => {
		client.linkDevices('test-user', ['d1', 'd2']);
		expect(amplitudeClientMock.identify.mock.calls.length).toBe(3); // Number of devices + original device ID.
		expect(amplitudeClientMock.setUserId.mock.calls.length).toBe(1);
		expect(amplitudeClientMock.setDeviceId.mock.calls.length).toBe(3);
		expect(amplitudeClientMock.regenerateDeviceId.mock.calls.length).toBe(0);
	});

	test('device linking only repeated user', () => {
		client.linkDevices('test-device-id', ['d1', 'test-device-id']);

		// Ensure we don't set device ID to a value equal to the user ID.
		expect(amplitudeClientMock.setDeviceId).toHaveBeenLastCalledWith('d1');
	});

	test('device linking only with same id', () => {
		client.linkDevices('test-device-id', ['test-device-id']);

		// Ensure regenerate is called when linkDevices only with same id
		expect(amplitudeClientMock.regenerateDeviceId.mock.calls.length).toBe(1);
	});

	test('amplitude config', () => {
		const clientWithEndpoint = new WebClient({
			projectName: 'balena-test',
			endpoint: 'some.host',
			componentName: 'test',
		});
		clientWithEndpoint.regenerateDeviceId();

		expect(amplitudeClientMock.init.mock.calls.length).toBe(1);
		expect(amplitudeClientMock.init.mock.lastCall[2].apiEndpoint).toBe(
			'some.host/amplitude',
		);
	});

	test('user properties', () => {
		client.setUserProperties({
			set: { p1: 'v1', p2: 'v2' },
			setOnce: { p3: 'v3', p4: 'v4' },
		});

		expect(amplitudeClientMock.identify.mock.calls.length).toBe(1);
		expect(identiFyMock.set.mock.calls[0]).toEqual(['p1', 'v1']);
		expect(identiFyMock.set.mock.calls[1]).toEqual(['p2', 'v2']);
		expect(identiFyMock.setOnce.mock.calls[0]).toEqual(['p3', 'v3']);
		expect(identiFyMock.setOnce.mock.calls[1]).toEqual(['p4', 'v4']);

		client.setUserProperties({});
		expect(amplitudeClientMock.identify.mock.calls.length).toBe(2);
	});

	test('amplitude configuration', () => {
		const configClient = new WebClient({
			projectName: 'balena-test',
			endpoint: 'some.host',
			componentName: 'test',
			deviceId: 'my-device-id',
			componentVersion: 'my-version',
			amplitude: {
				optOut: true,
			},
		});

		expect(amplitudeClientMock.init.mock.lastCall[2].deviceId).toBe(
			'my-device-id',
		);
		expect(amplitudeClientMock.init.mock.lastCall[2].optOut).toBe(true);
		expect(amplitudeClientMock.setVersionName.mock.lastCall[0]).toBe(
			'my-version',
		);

		configClient.regenerateDeviceId();
	});

	test('mixpanel device id', () => {
		Cookies.set('mp_balena-test', 'on');

		const mixPanelClient = new WebClient({
			projectName: 'balena-test',
			componentName: 'test',
		});

		expect(amplitudeClientMock.setDeviceId).toHaveBeenLastCalledWith(
			'mixpanel-distincdt-id',
		);

		mixPanelClient.regenerateDeviceId();
		Cookies.remove('mp_balena-test');
	});
});

describe('webtracker interface tests', () => {
	test('track event with prefix', () => {
		client.track('simple event', { p1: 'd1' });
		expect(amplitudeClientMock.logEvent).toHaveBeenCalledWith(
			'[TEST] simple event',
			{ p1: 'd1' },
		);
	});

	test('track event without prefix', () => {
		const noPrefixClient = new WebClient({
			projectName: 'balena-test',
			componentName: 'test',
		});
		noPrefixClient.track('simple event', { p1: 'd1' });
		expect(amplitudeClientMock.logEvent).toHaveBeenCalledWith('simple event', {
			p1: 'd1',
		});
	});

	test('track navigation click', () => {
		client.trackNavigationClick('https://balena.io/docs');
		expect(amplitudeClientMock.logEvent.mock.lastCall[0]).toBe(
			'[TEST] Navigation Click',
		);
		expect(amplitudeClientMock.logEvent.mock.lastCall[1].href).toBe(
			'https://balena.io/docs',
		);
		expect(amplitudeClientMock.logEvent.mock.lastCall[1]).toHaveProperty(
			'current_url',
		);
		expect(amplitudeClientMock.logEvent.mock.lastCall[1]).toHaveProperty(
			'current_url_path',
		);

		client.trackNavigationClick('https://balena.io/docs', { p1: 'd1' });
		expect(amplitudeClientMock.logEvent.mock.lastCall[0]).toBe(
			'[TEST] Navigation Click',
		);
		expect(amplitudeClientMock.logEvent.mock.lastCall[1].href).toBe(
			'https://balena.io/docs',
		);
		expect(amplitudeClientMock.logEvent.mock.lastCall[1].p1).toBe('d1');
		expect(amplitudeClientMock.logEvent.mock.lastCall[1]).toHaveProperty(
			'current_url',
		);
		expect(amplitudeClientMock.logEvent.mock.lastCall[1]).toHaveProperty(
			'current_url_path',
		);
	});

	test('track page view', () => {
		client.trackPageView();
		expect(amplitudeClientMock.logEvent.mock.lastCall[0]).toBe(
			'[TEST] Page View',
		);
		expect(amplitudeClientMock.logEvent.mock.lastCall[1].metrics).toEqual({});
		expect(amplitudeClientMock.logEvent.mock.lastCall[1]).toHaveProperty(
			'current_url',
		);
		expect(amplitudeClientMock.logEvent.mock.lastCall[1]).toHaveProperty(
			'current_url_path',
		);
	});

	test('track page view with ampty metrics', () => {
		mockWindowMetrics([]);

		client.trackPageView();
		expect(amplitudeClientMock.logEvent.mock.lastCall[0]).toBe(
			'[TEST] Page View',
		);
		expect(amplitudeClientMock.logEvent.mock.lastCall[1].metrics).toEqual({});
		expect(amplitudeClientMock.logEvent.mock.lastCall[1]).toHaveProperty(
			'current_url',
		);
		expect(amplitudeClientMock.logEvent.mock.lastCall[1]).toHaveProperty(
			'current_url_path',
		);
	});

	test('track page view with performance metrics', () => {
		mockWindowMetrics([
			{
				domInteractive: 5,
				domComplete: 4,
				loadEventEnd: 3,
				startTime: 2,
			},
		]);

		client.trackPageView();
		expect(amplitudeClientMock.logEvent.mock.lastCall[0]).toBe(
			'[TEST] Page View',
		);
		expect(amplitudeClientMock.logEvent.mock.lastCall[1].metrics).toEqual({
			domInteractive: 3,
			domComplete: 2,
			loadEventEnd: 1,
		});
		expect(amplitudeClientMock.logEvent.mock.lastCall[1]).toHaveProperty(
			'current_url',
		);
		expect(amplitudeClientMock.logEvent.mock.lastCall[1]).toHaveProperty(
			'current_url_path',
		);
	});
});
