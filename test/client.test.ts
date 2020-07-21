import { createClient, createNoopClient } from '../src/client';

test('deviceId', () => {
	const client = createClient({
		projectName: 'balena-test',
		componentName: 'test',
	});
	expect(client.deviceId()).toBeTruthy();

	let callsCount = 0;
	client.amplitude().regenerateDeviceId = () => {
		callsCount++;
	};
	client.regenerateDeviceId();
	expect(callsCount).toBe(1);
});

test('device linking', () => {
	const client = createClient({
		projectName: 'balena-test',
		endpoint: `non-existing-endpoint`,
		componentName: 'test',
	});

	let identifyCallsCount = 0;
	let setUserIdCallsCount = 0;
	client.amplitude().identify = () => {
		identifyCallsCount++;
	};
	client.amplitude().setUserId = () => {
		setUserIdCallsCount++;
	};

	client.linkDevices('test-user', ['d1', 'd2']);
	expect(identifyCallsCount).toBe(3); // Number of devices + original device ID.
	expect(setUserIdCallsCount).toBe(1);
});

test('amplitude config', () => {
	const client = createClient({
		projectName: 'balena-test',
		endpoint: `some.host`,
		componentName: 'test',
	});
	expect(client.amplitude().options.apiEndpoint).toEqual('some.host/amplitude');
});

test('user properties', () => {
	const client = createClient({
		projectName: 'balena-test',
		endpoint: `some.host`,
		componentName: 'test',
	});

	let callCount = 0;
	let expectedProps: any = null;
	client.amplitude().identify = obj => {
		callCount++;
		expect((obj as any).userPropertiesOperations).toStrictEqual(expectedProps);
	};

	expectedProps = {
		$set: { p1: 'v1', p2: 'v2' },
		$setOnce: { p3: 'v3', p4: 'v4' },
	};
	client.setUserProperties({
		set: { p1: 'v1', p2: 'v2' },
		setOnce: { p3: 'v3', p4: 'v4' },
	});
	expect(callCount).toBe(1);

	expectedProps = {};
	client.setUserProperties({});
	expect(callCount).toBe(2);
});

test('noop client', () => {
	const client = createNoopClient(true);
	client.setUserId('test');
	client.track('test event', { a: 42 });
});
