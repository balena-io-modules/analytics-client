import { Client, createNoopClient } from '../src/client';
import { AnalyticsUrlParams } from '../src/url-params';

beforeEach(() => new AnalyticsUrlParams().clearCookies());

test('remove device ID from query string', () => {
	const urlParams = new AnalyticsUrlParams();

	const newQueryString = urlParams.consumeUrlParameters(
		'd_id=d1,d2,d3&other=value',
	);

	expect(newQueryString).toBe('other=value');
});

test('merge device IDs', () => {
	const urlParams = new AnalyticsUrlParams();

	urlParams.consumeUrlParameters('d_id=d1,d2,d3&other=value');
	urlParams.consumeUrlParameters('d_id=d2,d3,d4&other=value');

	['d1', 'd2', 'd3', 'd4'].forEach(id =>
		expect(urlParams.allDeviceIds()).toContain(id),
	);
});

test('accept URI encoded list', () => {
	const urlParams = new AnalyticsUrlParams();
	urlParams.consumeUrlParameters(
		'd_id=' + encodeURIComponent('d1,d2,d3') + '&other=value',
	);
	expect(urlParams.allDeviceIds()).toStrictEqual(['d1', 'd2', 'd3']);
});

test('device ID query string', () => {
	const urlParams = new AnalyticsUrlParams();
	expect(urlParams.getDeviceIdsQueryString()).toBe('');

	urlParams.consumeUrlParameters('d_id=d1,d2,d3&other=value');
	expect(urlParams.getDeviceIdsQueryString()).toBe(
		'd_id=' + encodeURIComponent('d1,d2,d3'),
	);
});

test('not changing current URL', () => {
	const urlParams = new AnalyticsUrlParams();
	const newQuery = urlParams.consumeUrlParameters('other=value&and=another');
	expect(newQuery).toBeNull();
});

interface AnalyticsMock {
	setDeviceIdParams: string | null;
	deviceIdRetrieved: boolean;
}

const clientMock = () =>
	({
		setDeviceIdParams: null,
		deviceIdRetrieved: false,

		deviceId() {
			this.deviceIdRetrieved = true;
			return 'test_device_id';
		},
		setDeviceId(deviceId: string) {
			this.setDeviceIdParams = deviceId;
		},
	} as Client & AnalyticsMock);

const clientUrlParameters = (): [AnalyticsUrlParams, AnalyticsMock] => {
	const mp = clientMock();
	return [new AnalyticsUrlParams(mp), mp];
};

test('use mixpanel distinct ID', () => {
	const [urlParams] = clientUrlParameters();

	urlParams.consumeUrlParameters('d_id=d1,d2,d3&other=value');
	urlParams.consumeUrlParameters('d_id=d2,d3,d4&other=value');

	['d1', 'd2', 'd3', 'd4', 'test_device_id'].forEach(id =>
		expect(urlParams.allDeviceIds()).toContain(id),
	);
});

test("don't call client in constructor", () => {
	const [, mock] = clientUrlParameters();
	expect(mock.deviceIdRetrieved).toBeFalsy();
});

test('update client state', () => {
	const [urlParams, mock] = clientUrlParameters();

	urlParams.consumeUrlParameters('d_id=test_input&other=value');

	['test_input', 'test_device_id'].forEach(id =>
		expect(urlParams.allDeviceIds()).toContain(id),
	);

	expect(mock.setDeviceIdParams).toStrictEqual('test_input');
});

test('use first device id for analytics client', () => {
	const [urlParams, mock] = clientUrlParameters();

	urlParams.consumeUrlParameters('d_id=test_input1,d2');

	expect(mock.setDeviceIdParams).toStrictEqual('test_input1');
});

test('device IDs with analytics client', () => {
	const [urlParams] = clientUrlParameters();
	expect(urlParams.allDeviceIds()).toStrictEqual(['test_device_id']);
	urlParams.consumeUrlParameters('d_id=d1,d2,d3&other=value');
	expect(urlParams.allDeviceIds()).toStrictEqual([
		'd1',
		'd2',
		'd3',
		'test_device_id',
	]);
});

test('preserve device IDs in cookies', () => {
	new AnalyticsUrlParams().consumeUrlParameters('d_id=1');
	new AnalyticsUrlParams().consumeUrlParameters('d_id=2');
	expect(new AnalyticsUrlParams().allDeviceIds()).toContain('1');
	expect(new AnalyticsUrlParams().allDeviceIds()).toContain('2');
});

test('encodes URI component', () => {
	new AnalyticsUrlParams().consumeUrlParameters(
		'd_id=' + encodeURIComponent('%%$!!'),
	);
	expect(new AnalyticsUrlParams().allDeviceIds()).toStrictEqual(['%%$!!']);
	expect(new AnalyticsUrlParams().getDeviceIdsQueryString()).toBe(
		'd_id=%25%25%24!!',
	);
});

test('opt out parameter', () => {
	const urlParams = new AnalyticsUrlParams();
	urlParams.consumeUrlParameters('d_id=42&optOutAnalytics=true');
	expect(urlParams.isOptOutRequested()).toBeTruthy();
	urlParams.consumeUrlParameters('d_id=42&optOutAnalytics=false');
	expect(urlParams.isOptOutRequested()).toBeFalsy();
	urlParams.consumeUrlParameters('d_id=42');
	expect(urlParams.isOptOutRequested()).toBeFalsy();
	urlParams.consumeUrlParameters('');
	expect(urlParams.isOptOutRequested()).toBeFalsy();
});

test('set noop client', () => {
	const urlParams = new AnalyticsUrlParams();
	urlParams.consumeUrlParameters('optOutAnalytics=true');
	expect(urlParams.isOptOutRequested()).toBeTruthy();
	urlParams.setClient(createNoopClient());
});

test('set default client', () => {
	const urlParams = new AnalyticsUrlParams();
	urlParams.consumeUrlParameters('optOutAnalytics=false');
	expect(urlParams.isOptOutRequested()).toBeFalsy();

	const client = clientMock();
	const initialDeviceId = client.deviceId();
	urlParams.setClient(client);
	expect(client.deviceIdRetrieved).toBeTruthy();
	expect(client.setDeviceIdParams).toStrictEqual(initialDeviceId);
});
