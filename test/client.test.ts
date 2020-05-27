import { createClient } from '../src/client';

test('deviceId', () => {
	const client = createClient({
		projectName: 'balena-test',
		componentName: 'test',
	});
	expect(client.deviceId()).toBeTruthy();
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
	client.amplitude().identify = obj => {
		callCount++;
		expect((obj as any).userPropertiesOperations).toStrictEqual({
			$set: { p1: 'v1', p2: 'v2' },
			$setOnce: { p3: 'v3', p4: 'v4' },
		});
	};
	client.setUserProperties({
		set: { p1: 'v1', p2: 'v2' },
		setOnce: { p3: 'v3', p4: 'v4' },
	});
	expect(callCount).toBe(1);
});
