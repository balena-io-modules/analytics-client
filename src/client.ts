import amplitude = require('amplitude-js');
import * as Cookies from 'js-cookie';
import { Mixpanel } from 'mixpanel-browser';
import mixpanel = require('mixpanel-browser');
import { version } from '../package.json';
import {
	COOKIES_TTL_DAYS,
	USER_PROP_ANALYTICS_CLIENT_VERSION,
	USER_PROP_COMPONENT_NAME,
} from './config';

export interface Properties {
	[key: string]: any;
}

export interface UserProperties {
	set?: Properties;
	setOnce?: Properties;
}

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

	/** Track event of the defined type with specified event properties. */
	track(eventType: string, props?: Properties): void;

	/** Set current user ID. */
	setUserId(userId: string): void;

	setUserProperties(props: UserProperties): void;
}

/**
 * Analytics client configuration.
 */
export interface Config {
	/** Analytics backend base endpoint. */
	endpoint?: string;
	/** Project name for the analytics client. */
	projectName: string;
	/** Name of the component that does the reporting. */
	componentName: string;
	/** Component version name. */
	componentVersion?: string;

	/** Optional config for Amplitude client. */
	amplitude?: Exclude<AmplitudeOverride, amplitude.Config>;
	/** Optional mixpanel client instance. */
	mixpanelInstance?: Mixpanel;
}

interface AmplitudeOverride {
	apiEndpoint?: string;
	cookieExpiration?: number;
	includeReferrer?: boolean;
	includeUtm?: boolean;
}

const identifyObject = () =>
	new amplitude.Identify().set(USER_PROP_ANALYTICS_CLIENT_VERSION, version);

class DefaultClient implements Client {
	private readonly amplitudeInstance: amplitude.AmplitudeClient;

	constructor(private readonly config: Config) {
		this.amplitudeInstance = amplitude.getInstance(config.projectName);

		const amplConfig: amplitude.Config = Object.assign({}, config.amplitude);
		if (config.endpoint) {
			amplConfig.apiEndpoint = `${config.endpoint}/amplitude`;
		}
		// TODO: Move this to the web tracker.
		amplConfig.cookieExpiration = COOKIES_TTL_DAYS;
		amplConfig.includeReferrer = true;
		amplConfig.includeUtm = true;

		this.amplitudeInstance.init(config.projectName, undefined, amplConfig);
		this.checkMixpanelUsage();

		this.amplitudeInstance.identify(
			identifyObject().set(USER_PROP_COMPONENT_NAME, config.componentName),
		);
		if (config.componentVersion) {
			this.amplitudeInstance.setVersionName(config.componentVersion);
		}
	}

	private checkMixpanelUsage() {
		// TODO: Move this to the web tracker.
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
		this.setUserId(userId);

		const identifyData = identifyObject();

		// Make sure thee current device ID is associated.
		this.amplitudeInstance.identify(identifyData);

		for (const deviceId of deviceIds) {
			this.amplitudeInstance.setDeviceId(deviceId);
			this.amplitudeInstance.identify(identifyData);
		}

		// Continue reporting with the original device ID.
		this.amplitudeInstance.setDeviceId(originalDeviceId);
	}

	track(eventType: string, props?: Properties): void {
		this.amplitudeInstance.logEvent(eventType, props);
	}

	setUserId(userId: string) {
		this.amplitudeInstance.setUserId(userId);
	}

	setUserProperties(props: UserProperties) {
		const identify = new amplitude.Identify();
		for (const key in props.set) {
			if (props.set.hasOwnProperty(key)) {
				identify.set(key, props.set[key]);
			}
		}
		for (const key in props.setOnce) {
			if (props.setOnce.hasOwnProperty(key)) {
				identify.setOnce(key, props.setOnce[key]);
			}
		}

		this.amplitudeInstance.identify(identify);
	}
}

export function createClient(config: Config): Client {
	return new DefaultClient(config);
}
