import amplitude from 'amplitude-js';
import Cookies from 'js-cookie';
import { Mixpanel } from 'mixpanel-browser';
import mixpanel = require('mixpanel-browser');
import { COOKIES_TTL_DAYS } from './config';

/**
 * Client defines an interface for interaction wih balena analytics backend.
 */
export interface Client {
	/** Returns Amplitude service client configured to interact with balena analytics backend. */
	amplitude(): amplitude.AmplitudeClient;

	/** Return the ID used to identify the current device. */
	deviceId(): string;

	/** Associate all input device IDs with a user ID. */
	linkDevices(userId: string, deviceIds: string[]): void;
}

/**
 * Analytics client configuration.
 */
export interface Config {
	/** Analytics backend base endpoint. */
	endpoint?: string;
	/** Project name for the analytics client. */
	projectName: string;

	/** Optional config for Amplitude client. */
	amplitude?: Exclude<AmplitudeOverride, amplitude.Config>;
	/** Optional miixpanel client instance. */
	mixpanelInstance?: Mixpanel;
}

interface AmplitudeOverride {
	apiEndpoint?: string;
	cookieExpiration?: number;
}

class DefaultClient implements Client {
	private readonly amplitudeInstance: amplitude.AmplitudeClient;

	constructor(private readonly config: Config) {
		this.amplitudeInstance = amplitude.getInstance(config.projectName);

		const amplConfig: amplitude.Config = Object.assign({}, config.amplitude);
		if (config.endpoint) {
			amplConfig.apiEndpoint = config.endpoint;
		}
		amplConfig.cookieExpiration = COOKIES_TTL_DAYS;
		this.amplitudeInstance.init(config.projectName, undefined, amplConfig);
		this.checkMixpanelUsage();
	}

	private checkMixpanelUsage() {
		const mp = this.config.mixpanelInstance;

		if (mp == null) {
			let mixpanelDataPresent = false;
			for (const key in Cookies.get()) {
				if (key.startsWith('mp_' + this.config.projectName)) {
					mixpanelDataPresent = true;
					break;
				}
			}

			if (mixpanelDataPresent) {
				mixpanel.init(this.config.projectName, {
					autotrack: false,
					track_pageview: false,
				});
				this.amplitudeInstance.setDeviceId(mixpanel.get_distinct_id());
			}
		} else {
			this.amplitudeInstance.setDeviceId(mp.get_distinct_id());
		}
	}

	amplitude(): amplitude.AmplitudeClient {
		return this.amplitudeInstance;
	}

	deviceId(): string {
		return this.amplitudeInstance.options.deviceId!!;
	}

	linkDevices(userId: string, deviceIds: string[]): void {
		const originalDeviceId = this.deviceId();
		this.amplitudeInstance.setUserId(userId);

		// Make sure thee current device ID is associated.
		this.amplitudeInstance.identify(new amplitude.Identify());

		for (const deviceId of deviceIds) {
			this.amplitudeInstance.setDeviceId(deviceId);
			this.amplitudeInstance.identify(new amplitude.Identify());
		}

		// Continue reporting with the original device ID.
		this.amplitudeInstance.setDeviceId(originalDeviceId);
	}
}

export function createClient(config: Config): Client {
	return new DefaultClient(config);
}
