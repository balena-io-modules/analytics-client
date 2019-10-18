import {
	getCookie,
	hasCookieSupport,
	removeCookie,
	setCookie,
} from '@analytics/cookie-utils';
import { Mixpanel } from 'mixpanel-browser';

const URL_PARAM_DEVICE_ID = 'd_id';
const COOKIES_DEVICE_IDS = '__analytics_dids';
const COOKIES_TTL_MS = 300 * 24 * 60 * 60 * 1000; // 300 days.

const deviceIdSeparator = /\s*,\s*/;

/**
 * AnalyticsUrlParams helps with handling analytics-related URL parameters
 * like anonymous device identifier.
 */
export class AnalyticsUrlParams {
	private readonly cookiesSupported = hasCookieSupport();
	private deviceIds: Set<string> = new Set();

	constructor(private mixpanel?: Mixpanel) {
		const storedValue = this.cookiesSupported
			? getCookie(COOKIES_DEVICE_IDS)
			: null;
		this.setDeviceIds(storedValue, null);
	}

	private setDeviceIds(
		inputIdString: string | null,
		currentDeviceId: string | null,
	) {
		const list = inputIdString ? inputIdString.split(deviceIdSeparator) : [];
		if (currentDeviceId) {
			list.push(currentDeviceId);
		}
		this.deviceIds = new Set(list.concat(Array.from(this.deviceIds)));
		if (this.cookiesSupported) {
			setCookie(
				COOKIES_DEVICE_IDS,
				Array.from(this.deviceIds).join(','),
				COOKIES_TTL_MS,
				'/',
			);
		}
		return list.length > 0 ? list[0] : null;
	}

	clearCookies() {
		if (this.cookiesSupported) {
			removeCookie(COOKIES_DEVICE_IDS);
		}
	}

	/**
	 * Analyzes the query string and stores the anonymous device ID if it's there.
	 * Returns null if the current URL query string should not be modified after consuming the data.
	 *
	 * @param queryString URL query string to process
	 * @return a modified query string that hides processed/consumed parameters if the query string should be modified
	 */
	consumeUrlParameters(queryString: string): string | null {
		const params = new URLSearchParams(queryString);

		const passedDeviceId = params.get(URL_PARAM_DEVICE_ID);
		if (passedDeviceId) {
			const originalMixpanelId =
				this.mixpanel != null ? this.mixpanel.get_distinct_id() : null;

			const newCurrentDeviceId = this.setDeviceIds(
				passedDeviceId,
				originalMixpanelId,
			);

			if (this.mixpanel != null && newCurrentDeviceId) {
				// Switch mixpanel ID to using the passed device ID, so we can track events in one timeline branch.
				// Previous user activity recorded with another device ID will be merged upon signup,
				// since we store the previous ID to pass it to other sites.
				this.mixpanel.register({
					distinct_id: newCurrentDeviceId,
					$device_id: newCurrentDeviceId,
				});
			}

			params.delete(URL_PARAM_DEVICE_ID);
			return params.toString();
		} else {
			return null;
		}
	}

	/**
	 * @return all anonymous device IDs that can be passed to other sites
	 */
	allDeviceIds() {
		const mixpanelId = this.mixpanel ? this.mixpanel.get_distinct_id() : null;
		if (mixpanelId == null) {
			return Array.from(this.deviceIds);
		}
		const res = new Set(this.deviceIds);
		res.add(mixpanelId);
		return Array.from(res);
	}

	/**
	 * @return part of a query parameter string that can be appended to URLs
	 */
	getDeviceIdsQueryString(): string {
		const ids = this.allDeviceIds();
		if (ids.length === 0) {
			return '';
		}
		return `${URL_PARAM_DEVICE_ID}=${encodeURIComponent(ids.join(','))}`;
	}
}
