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
	client.amplitude().identify = () => {
		identifyCallsCount++;
	};

	client.linkDevices('test-user', ['d1', 'd2']);
	expect(identifyCallsCount).toBe(3); // Number of devices + original device ID.
});

test('amplitude config', () => {
	const client = createClient({
		projectName: 'balena-test',
		endpoint: `some.host`,
		componentName: 'test',
	});
	expect(client.amplitude().options.apiEndpoint).toEqual('some.host/amplitude');
});
