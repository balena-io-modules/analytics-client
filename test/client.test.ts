import * as amplitude from '@amplitude/analytics-browser';
import { createInstance } from '@amplitude/analytics-browser';
import { createClient, createNoopClient, Client } from '../src/client';

jest.mock('@amplitude/analytics-browser');

const AmplitudeMock = jest.mocked(amplitude);
const mockedCreateInstance = jest.mocked(createInstance);

describe('analytics-client suite', () => {
	let client: Client;
	beforeEach(() => {
		mockedCreateInstance.mockReturnValue(AmplitudeMock);
		client = createClient({
			projectName: 'balena-test',
			endpoint: `non-existing-endpoint`,
			componentName: 'test',
		});
		jest.clearAllMocks();
	});

	it('should call amplitude reset function when regenerating deviceId', () => {
		client.regenerateDeviceId();
		expect(AmplitudeMock.reset).toBeCalledTimes(1);
	});

	it('should set the final ID to the first linked device which device ID is not equal to user ID ', () => {
		client.linkDevices('test-user', ['d1', 'd2']);
		expect(AmplitudeMock.identify).toHaveBeenCalledTimes(3); // Number of devices + original device ID.

		expect(AmplitudeMock.setUserId).toHaveBeenCalledTimes(1);
		expect(AmplitudeMock.setUserId.mock.calls[0][0]).toEqual('test-user');

		expect(AmplitudeMock.setDeviceId).toHaveBeenCalledTimes(3); // Number of devices + original device ID.
		expect(AmplitudeMock.setDeviceId.mock.lastCall?.[0]).toEqual('d1');
	});

	it('should not set the device ID to be equal to the user ID', () => {
		const userId = 'test-user';
		AmplitudeMock.getDeviceId.mockReturnValue(userId);
		expect(client.deviceId()).toStrictEqual(userId);
		client.linkDevices(userId, ['d1', userId]);
		expect(AmplitudeMock.setDeviceId.mock.lastCall?.[0]).toStrictEqual('d1');
	});

	it('should call regenerate id in case where only possible device ID is equal to user ID', () => {
		const userId = 'test-user';
		client.regenerateDeviceId = jest.fn();
		AmplitudeMock.getDeviceId.mockReturnValue(userId);
		expect(client.deviceId()).toStrictEqual(userId);
		client.linkDevices(userId, [userId]);
		expect(client.regenerateDeviceId).toHaveBeenCalledTimes(1);
	});

	it('should allow for override amplitude configuration directly', () => {
		createClient({
			projectName: 'test-project',
			endpoint: `some.host`,
			componentName: 'test',
			componentVersion: '1.0.0',
			deviceId: 'device-id',
			amplitude: {
				partnerId: 'test',
			},
		});
		expect(AmplitudeMock.init).toHaveBeenCalledTimes(1);
		expect(AmplitudeMock.init.mock.calls[0][0]).toEqual('test-project');
		expect(AmplitudeMock.init.mock.calls[0][1]).toBeUndefined();

		const amplitudeConfigForwarded = AmplitudeMock.init.mock.calls[0][2];
		expect(amplitudeConfigForwarded).toStrictEqual({
			serverUrl: 'https://some.host/amplitude/2/httpapi',
			cookieOptions: { expiration: 300 },
			partnerId: 'test',
			deviceId: 'device-id',
			appVersion: '1.0.0',
			autocapture: false,
		});
	});

	it('should allow for setting multiple user properties at once', () => {
		const setFn = jest.fn();
		const setOnceFn = jest.fn();

		jest
			.spyOn(AmplitudeMock.Identify.prototype, 'set')
			.mockImplementation(setFn);
		jest
			.spyOn(AmplitudeMock.Identify.prototype, 'setOnce')
			.mockImplementation(setOnceFn);

		client.setUserProperties({
			set: { p1: 'v1', p2: 'v2' },
			setOnce: { p3: 'v3', p4: 'v4' },
		});

		expect(setFn).toHaveBeenCalledTimes(2);
		expect(setOnceFn).toHaveBeenCalledTimes(2);
		expect(setFn.mock.calls[0]).toEqual(['p1', 'v1']);
		expect(setFn.mock.calls[1]).toEqual(['p2', 'v2']);
		expect(setOnceFn.mock.calls[0]).toEqual(['p3', 'v3']);
		expect(setOnceFn.mock.calls[1]).toEqual(['p4', 'v4']);
	});

	it('should not call amplitude with noop client', () => {
		const noopClient = createNoopClient();
		noopClient.setUserId('test');
		noopClient.track('test event', { a: 42 });
		expect(AmplitudeMock.setUserId).toHaveBeenCalledTimes(0);
		expect(AmplitudeMock.track).toHaveBeenCalledTimes(0);
	});
});
