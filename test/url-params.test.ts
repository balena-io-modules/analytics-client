/**
 * @jest-environment jsdom
 */

import { Client } from '../src/client';
import { AnalyticsUrlParams } from '../src/url-params';
import { NoopClient } from '../src/noop-client';
import * as Cookies from 'js-cookie';
import { COOKIES_DEVICE_IDS } from '../src/config';

beforeEach(() => new AnalyticsUrlParams().clearCookies());

test('remove device ID from query string', () => {
	const urlParams = new AnalyticsUrlParams();

	const newQueryString = urlParams.consumeUrlParameters(
		'd_id=d1,d2,d3&other=value',
	);

	expect(newQueryString).toBe('other=value');
});

test('remove session ID from the query string', () => {
	const urlParams = new AnalyticsUrlParams();

	const newQueryString = urlParams.consumeUrlParameters('s_id=123&other=value');

	expect(newQueryString).toBe('other=value');
});

test('remove all relevant IDs from the query string', () => {
	const urlParams = new AnalyticsUrlParams();

	const newQueryString = urlParams.consumeUrlParameters(
		'd_id=d1,d2,d3&s_id=123&other=value',
	);

	expect(newQueryString).toBe('other=value');
});

test('accept session ID from the query string', () => {
	const urlParams = new AnalyticsUrlParams();

	urlParams.consumeUrlParameters('s_id=123&other=value');

	expect(urlParams.getSessionId()).toBe(123);
});

test('overwrite session ID from the query string', () => {
	const urlParams = new AnalyticsUrlParams();

	urlParams.consumeUrlParameters('s_id=123&other=value');
	urlParams.consumeUrlParameters('s_id=234&other=value');

	expect(urlParams.getSessionId()).toBe(234);
});

test('merge device IDs', () => {
	const urlParams = new AnalyticsUrlParams();

	urlParams.consumeUrlParameters('d_id=d1,d2,d3&other=value');
	urlParams.consumeUrlParameters('d_id=d2,d3,d4&other=value');

	['d1', 'd2', 'd3', 'd4'].forEach((id) =>
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

test('session ID query string', () => {
	const urlParams = new AnalyticsUrlParams();
	expect(urlParams.getSessionIdQueryString()).toBe('');

	urlParams.consumeUrlParameters('s_id=123&other=value');
	expect(urlParams.getSessionIdQueryString()).toBe('s_id=123');
});

test('full query string', () => {
	const urlParams = new AnalyticsUrlParams();
	expect(urlParams.getQueryString()).toBe('');

	urlParams.consumeUrlParameters('s_id=123&other=value');
	expect(urlParams.getQueryString()).toBe('s_id=123');

	urlParams.consumeUrlParameters('d_id=d1&other=value');
	expect(urlParams.getQueryString()).toBe('d_id=d1&s_id=123');
});

test('not changing current URL', () => {
	const urlParams = new AnalyticsUrlParams();
	const newQuery = urlParams.consumeUrlParameters('other=value&and=another');
	expect(newQuery).toBeNull();
});

test('parsing and matching destination and actual URL to regex', () => {
	const urlParams = new AnalyticsUrlParams();
	expect(urlParams.getQueryString()).toBe('');

	urlParams.consumeUrlParameters('s_id=123&other=value');
	expect(urlParams.getQueryString()).toBe('s_id=123');

	// Case when not passing any destination or actual URL
	urlParams.consumeUrlParameters('d_id=d1&other=value');
	expect(urlParams.getQueryString()).toBe('d_id=d1&s_id=123');

	// Case when passing matching destination and actual URL while a d_id and s_id exist.
	expect(
		urlParams.getQueryString(
			new URL('https://test.domain.io'),
			new URL('https://domain.io'),
		),
	).toBe('');

	// Case when passing none matching destination and actual URL while a d_id and s_id exist.
	expect(
		urlParams.getQueryString(
			new URL('https://test.domain.io'),
			new URL('https://otherdomain.com'),
		),
	).toBe('d_id=d1&s_id=123');

	// Case when passing destination URL that violates the TLD regex assumption.
	// Here it will result in matching URL "edge.io", when in fact
	// it should be treated as different URLs and return the d_id and s_id params
	expect(
		urlParams.getQueryString(
			new URL('https://test.domain.edge.io'),
			new URL('https://domain2.edge.io'),
		),
	).toBe('');

	// Case when passing a relative URL as destinationUrl
	expect(
		urlParams.getQueryString('/etcher', new URL('https://domain2.edge.io')),
	).toBe('');

	// Case when passing an absolute URL as a string for destinationUrl and no passing is expected
	expect(
		urlParams.getQueryString(
			'https://test.domain.io',
			new URL('https://domain.io'),
		),
	).toBe('');

	// Case when passing an absolute URL as a string for destinationUrl and passing is expected
	expect(
		urlParams.getQueryString(
			'https://test.domain.io',
			new URL('https://otherdomain.com'),
		),
	).toBe('d_id=d1&s_id=123');
});

interface AnalyticsMock {
	setDeviceIdParams: string | null;
	deviceIdRetrieved: boolean;
	knownSessionId: number | null;
}

const clientMock = () =>
({
	setDeviceIdParams: null,
	deviceIdRetrieved: false,
	knownSessionId: 123,

	deviceId() {
		this.deviceIdRetrieved = true;
		if (!this.setDeviceIdParams) {
			return 'test_device_id';
		}
		return this.setDeviceIdParams;
	},
	sessionId() {
		return this.knownSessionId;
	},
	setDeviceId(deviceId: string) {
		this.setDeviceIdParams = deviceId;
	},
	setSessionId(sessionId: number) {
		this.knownSessionId = sessionId;
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

	['d1', 'd2', 'd3', 'd4', 'test_device_id'].forEach((id) =>
		expect(urlParams.allDeviceIds()).toContain(id),
	);
});

test("don't call client in constructor", () => {
	const [, mock] = clientUrlParameters();
	expect(mock.deviceIdRetrieved).toBeFalsy();
});

test('update client state', () => {
	const [urlParams, mock] = clientUrlParameters();

	urlParams.consumeUrlParameters('d_id=test_input&s_id=234&other=value');

	['test_input', 'test_device_id'].forEach((id) =>
		expect(urlParams.allDeviceIds()).toContain(id),
	);
	expect(urlParams.getSessionId()).toBe(234);

	expect(mock.setDeviceIdParams).toStrictEqual('test_input');
	expect(mock.knownSessionId).toStrictEqual(234);
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
	urlParams.setClient(new NoopClient());
});

test('set default client', () => {
	const urlParams = new AnalyticsUrlParams();
	urlParams.consumeUrlParameters('optOutAnalytics=false');
	expect(urlParams.isOptOutRequested()).toBeFalsy();

	const passedDeviceId = urlParams.getPassedDeviceId();
	const client = clientMock();

	if (passedDeviceId) {
		client.setDeviceId(passedDeviceId);
	}
	urlParams.setClient(client);
	const allDeviceIds = urlParams.allDeviceIds();
	expect(client.setDeviceIdParams).toStrictEqual(null);
	expect(allDeviceIds).toEqual(['test_device_id']);
	expect(client.knownSessionId).toStrictEqual(123);
});

test('set default client with passed sessionId', () => {
	const urlParams = new AnalyticsUrlParams();
	urlParams.consumeUrlParameters('s_id=999&optOutAnalytics=false');
	expect(urlParams.isOptOutRequested()).toBeFalsy();
	const passedSessonId = urlParams.getSessionId();

	const client = clientMock();
	urlParams.setClient(client);
	expect(client.setDeviceIdParams).toStrictEqual(null);
	expect(client.knownSessionId).toStrictEqual(passedSessonId);
});

test('set default client with passed deviceId', () => {
	const urlParams = new AnalyticsUrlParams();
	urlParams.consumeUrlParameters('d_id=999,888,777');

	const passedDeviceId = urlParams.getPassedDeviceId();
	const client = clientMock();

	if (passedDeviceId) {
		client.setDeviceId(passedDeviceId);
	}
	const allDeviceIds = urlParams.allDeviceIds();
	urlParams.setClient(client);
	expect(client.setDeviceIdParams).toStrictEqual('999');
	expect(allDeviceIds).toEqual(['999', '888', '777']);
	expect(client.knownSessionId).toStrictEqual(123);
	expect(urlParams.getClient()).toEqual(client);
});

test('throws if trying to set a client twice', () => {
	const urlParams = new AnalyticsUrlParams();
	urlParams.setClient(new NoopClient());

	expect(() => urlParams.setClient(new NoopClient())).toThrow(
		'Client is already set',
	);
});

test('set client with device id', () => {
	const client = clientMock();
	client.setDeviceId = jest.fn();
	client.deviceId = jest.fn().mockReturnValue('d1');

	Cookies.set(COOKIES_DEVICE_IDS, 'd_id');

	const urlParams = new AnalyticsUrlParams();
	urlParams.setClient(client);

	expect(client.setDeviceId).toHaveBeenLastCalledWith('d1');

	Cookies.remove(COOKIES_DEVICE_IDS);
});
