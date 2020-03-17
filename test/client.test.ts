import { createClient } from '../src/client';

test('deviceId', () => {
	const client = createClient({
		projectName: 'balena-test',
	});
	expect(client.deviceId()).toBeTruthy();
});

test('device linking', () => {
	const client = createClient({
		projectName: 'balena-test',
		endpoint: `non-existing-endpoint`,
	});

	let identifyCallsCount = 0;
	client.amplitude().identify = () => {
		identifyCallsCount++;
	};

	client.linkDevices('test-user', ['d1', 'd2']);
	expect(identifyCallsCount).toBe(3); // Number of devices + original device ID.
});
