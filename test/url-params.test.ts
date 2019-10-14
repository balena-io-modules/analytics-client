import { Mixpanel } from 'mixpanel-browser';
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

interface MpMock {
	registerParams: any;
	distinctIdRetrieved: boolean;
}

const mpMock = () =>
	({
		registerParams: null,
		distinctIdRetrieved: false,

		get_distinct_id() {
			this.distinctIdRetrieved = true;
			return 'test_mp_distinct_id';
		},
		register(params: any) {
			this.registerParams = params;
		},
	} as Mixpanel & MpMock);

const mpUrlParameters = (): [AnalyticsUrlParams, MpMock] => {
	const mp = mpMock();
	return [new AnalyticsUrlParams(mp), mp];
};

test('use mixpanel distinct ID', () => {
	const [urlParams] = mpUrlParameters();

	urlParams.consumeUrlParameters('d_id=d1,d2,d3&other=value');
	urlParams.consumeUrlParameters('d_id=d2,d3,d4&other=value');

	['d1', 'd2', 'd3', 'd4', 'test_mp_distinct_id'].forEach(id =>
		expect(urlParams.allDeviceIds()).toContain(id),
	);
});

test("don't call mixpanel in constructor", () => {
	const [, mock] = mpUrlParameters();
	expect(mock.distinctIdRetrieved).toBeFalsy();
});

test('update mixpanel state', () => {
	const [urlParams, mp] = mpUrlParameters();

	urlParams.consumeUrlParameters('d_id=test_input&other=value');

	['test_input', 'test_mp_distinct_id'].forEach(id =>
		expect(urlParams.allDeviceIds()).toContain(id),
	);

	expect(mp.registerParams).toStrictEqual({
		distinct_id: 'test_input',
		$device_id: 'test_input',
	});
});

test('use first device id for mixpanel', () => {
	const [urlParams, mp] = mpUrlParameters();

	urlParams.consumeUrlParameters('d_id=test_input1,d2');

	expect(mp.registerParams).toStrictEqual({
		distinct_id: 'test_input1',
		$device_id: 'test_input1',
	});
});

test('device IDs with mixpanel', () => {
	const [urlParams] = mpUrlParameters();
	expect(urlParams.allDeviceIds()).toStrictEqual(['test_mp_distinct_id']);
	urlParams.consumeUrlParameters('d_id=d1,d2,d3&other=value');
	expect(urlParams.allDeviceIds()).toStrictEqual([
		'd1',
		'd2',
		'd3',
		'test_mp_distinct_id',
	]);
});

test('preserve device IDs in cookies', () => {
	new AnalyticsUrlParams().consumeUrlParameters('d_id=1');
	new AnalyticsUrlParams().consumeUrlParameters('d_id=2');
	expect(new AnalyticsUrlParams().allDeviceIds()).toStrictEqual(['1', '2']);
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
