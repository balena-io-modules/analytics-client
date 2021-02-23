import * as Cookies from 'js-cookie';
import { Client } from './client';
import {
	COOKIES_DEVICE_IDS,
	COOKIES_TTL_DAYS,
	URL_PARAM_DEVICE_ID,
	URL_PARAM_OPT_OUT_REQUEST,
	URL_PARAM_SESSION_ID,
} from './config';

const deviceIdSeparator = /\s*,\s*/;

/**
 * AnalyticsUrlParams helps with handling analytics-related URL parameters
 * like anonymous device identifier.
 */
export class AnalyticsUrlParams {
	private deviceIds: Set<string> = new Set();
	private passedDeviceId: string | undefined;
	private sessionId: number | undefined;
	private optOutRequested: boolean = false;

	constructor(private client?: Client) {
		const storedDeviceIdValue = Cookies.get(COOKIES_DEVICE_IDS);
		this.setDeviceIds(storedDeviceIdValue, null);
	}

	private setDeviceIds(
		inputIdString: string | null | undefined,
		currentDeviceId: string | null,
	) {
		const list = inputIdString ? inputIdString.split(deviceIdSeparator) : [];
		if (list.length > 0) {
			this.passedDeviceId = list[0];
		}

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

	private setSessionId(storedValue: string | null | undefined) {
		if (storedValue) {
			this.sessionId = Number(storedValue);
		}
		return this.sessionId;
	}

	clearCookies() {
		Cookies.remove(COOKIES_DEVICE_IDS);
	}

	/**
	 * Analyzes the query string and stores the anonymous device or session ID if it's there.
	 * Returns null if the current URL query string should not be modified after consuming the data.
	 *
	 * @param queryString URL query string to process
	 * @return a modified query string that hides processed/consumed parameters if the query string should be modified
	 */
	consumeUrlParameters(queryString: string): string | null {
		const params = new URLSearchParams(queryString);

		this.optOutRequested = params.get(URL_PARAM_OPT_OUT_REQUEST) === 'true';

		const passedDeviceId = params.get(URL_PARAM_DEVICE_ID);
		if (passedDeviceId) {
			const originalDeviceId =
				this.client != null ? this.client.deviceId() : null;

			const newCurrentDeviceId = this.setDeviceIds(
				passedDeviceId,
				originalDeviceId,
			);
			if (this.client != null && newCurrentDeviceId != null) {
				this.client.setDeviceId(newCurrentDeviceId);
			}

			params.delete(URL_PARAM_DEVICE_ID);
		}

		const passedSessionId = params.get(URL_PARAM_SESSION_ID);
		if (passedSessionId) {
			const newCurrentSessionId = this.setSessionId(passedSessionId);

			if (this.client != null && newCurrentSessionId != null) {
				this.client.setSessionId(newCurrentSessionId);
			}

			params.delete(URL_PARAM_SESSION_ID);
		}

		const remainingQueryString = params.toString();
		return queryString === remainingQueryString ? null : remainingQueryString;
	}

	setClient(client: Client) {
		if (this.client) {
			throw new Error('Client is already set');
		}
		const newDeviceId = this.setDeviceIds(null, client.deviceId());
		if (newDeviceId != null) {
			client.setDeviceId(newDeviceId);
		}
		this.sessionId = client.sessionId();
		this.client = client;
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
	 * @return an array of passed Device Ids via the URL param if there was any
	 */
	getPassedDeviceId() {
		return this.passedDeviceId;
	}

	/**
	 * @return session ID that can be passed to other sites
	 */
	getSessionId() {
		return this.client ? this.client.sessionId() : this.sessionId;
	}

	/**
	 * @return part of the device ID query parameter string that can be appended to URLs
	 */
	getDeviceIdsQueryString(): string {
		const ids = this.allDeviceIds();
		if (ids.length === 0) {
			return '';
		}
		return `${URL_PARAM_DEVICE_ID}=${encodeURIComponent(ids.join(','))}`;
	}

	/**
	 * @return part of the session ID query parameter string that can be appended to URLs
	 */
	getSessionIdQueryString(): string {
		const id = this.getSessionId();
		if (id == null) {
			return '';
		}
		return `${URL_PARAM_SESSION_ID}=${id}`;
	}

	/**
	 * @return full query parameter string that can be appended to URLs
	 */
	getQueryString(): string {
		return [this.getDeviceIdsQueryString(), this.getSessionIdQueryString()]
			.filter(x => x)
			.join('&');
	}

	/**
	 * Use after consumeUrlParameters call.
	 * @return whether opt out from user behaviour tracking has been requested with a URL parameter
	 */
	isOptOutRequested(): boolean {
		return this.optOutRequested;
	}
}
