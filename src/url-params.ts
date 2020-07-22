import * as Cookies from 'js-cookie';
import { Client } from './client';
import {
	COOKIES_DEVICE_IDS,
	COOKIES_TTL_DAYS,
	URL_PARAM_DEVICE_ID,
	URL_PARAM_OPT_OUT_REQUEST,
} from './config';

const deviceIdSeparator = /\s*,\s*/;

/**
 * AnalyticsUrlParams helps with handling analytics-related URL parameters
 * like anonymous device identifier.
 */
export class AnalyticsUrlParams {
	private deviceIds: Set<string> = new Set();
	private optOutRequsted: boolean = false;

	constructor(private client?: Client) {
		const storedValue = Cookies.get(COOKIES_DEVICE_IDS);
		this.setDeviceIds(storedValue, null);
	}

	private setDeviceIds(
		inputIdString: string | null | undefined,
		currentDeviceId: string | null,
	) {
		const list = inputIdString ? inputIdString.split(deviceIdSeparator) : [];
		if (currentDeviceId) {
			list.push(currentDeviceId);
		}
		this.deviceIds = new Set(list.concat(Array.from(this.deviceIds)));
		Cookies.set(COOKIES_DEVICE_IDS, Array.from(this.deviceIds).join(','), {
			expires: COOKIES_TTL_DAYS,
			path: '/',
		});
		return list.length > 0 ? list[0] : null;
	}

	clearCookies() {
		Cookies.remove(COOKIES_DEVICE_IDS);
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

		this.optOutRequsted = params.get(URL_PARAM_OPT_OUT_REQUEST) === 'true';

		const passedDeviceId = params.get(URL_PARAM_DEVICE_ID);
		if (passedDeviceId) {
			const originalDeviceId =
				this.client != null ? this.client.deviceId() : null;

			const newCurrentDeviceId = this.setDeviceIds(
				passedDeviceId,
				originalDeviceId,
			);
			if (this.client != null && newCurrentDeviceId != null) {
				this.client.amplitude().setDeviceId(newCurrentDeviceId);
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
		const currentId = this.client != null ? this.client.deviceId() : null;
		if (currentId == null) {
			return Array.from(this.deviceIds);
		}
		const res = new Set(this.deviceIds);
		res.add(currentId);
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

	/**
	 * Use after consumeUrlParameters call.
	 * @return whether opt out from user behaviour tracking has been requested with a URL parameter
	 */
	isOptOutRequested(): boolean {
		return this.optOutRequsted;
	}
}
