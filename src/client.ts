import { Identify, Types, createInstance } from '@amplitude/analytics-browser';
import { version } from '../package.json';
import { getAmplitudeEndpoint } from './common';
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
	/** Return the ID used to identify the current device. */
	deviceId(): string;

	/** Return the ID used to identify the current session. */
	sessionId(): number;

	/** Generate a new device identifier used for reporting. */
	regenerateDeviceId(): void;

	/** Associate all input device IDs with a user ID. */
	linkDevices(userId: string, deviceIds: string[]): void;

	/** Track event of the defined type with specified event properties. */
	track(eventType: string, props?: Properties): void;

	/** Set current device ID. */
	setDeviceId(deviceId: string): void;

	/** Set current session ID. */
	setSessionId(sessionId: number): void;

	/** Set current user ID. */
	setUserId(userId: string): void;

	setUserProperties(props: UserProperties): void;

	identify(identify: Identify): void;
}

/**
 * Analytics client configuration.
 */
export interface Config {
	/** Analytics backend base endpoint. e.g data.balena-cloud.com */
	endpoint?: string;

	/** Project name for the analytics client. */
	projectName: string;

	/** Name of the component that does the reporting. */
	componentName: string;

	/** Component version name. */
	componentVersion?: string;

	/** Optional config for Amplitude client. */
	amplitude?: Omit<Types.BrowserOptions, keyof AmplitudeOverride>;

	/** Optional device_id for Amplitude client. */
	deviceId?: string;
}

interface AmplitudeOverride {
	endpoint?: string;
	deviceId?: string;
	cookieExpiration?: number;
}

const getIdentifyObject = () => {
	const identifyObject = new Identify();
	identifyObject.set(USER_PROP_ANALYTICS_CLIENT_VERSION, version);
	return identifyObject;
};

class DefaultClient implements Client {
	private readonly amplitudeInstance: Types.BrowserClient;

	constructor(config: Config) {
		this.amplitudeInstance = createInstance();

		const amplConfig: Types.BrowserOptions = Object.assign(
			{},
			config.amplitude,
		);

		if (config.endpoint) {
			amplConfig.serverUrl = getAmplitudeEndpoint(config.endpoint);
		}
		if (config.deviceId) {
			amplConfig.deviceId = config.deviceId;
		}
		if (config.componentVersion) {
			amplConfig.appVersion = config.componentVersion;
		}

		// TODO: Move this to the web tracker.
		amplConfig.cookieExpiration = COOKIES_TTL_DAYS;

		this.amplitudeInstance.init(config.projectName, undefined, amplConfig);

		const identifyObject = getIdentifyObject();
		identifyObject.set(USER_PROP_COMPONENT_NAME, config.componentName);
		this.amplitudeInstance.identify(identifyObject);
	}

	deviceId(): string {
		return this.amplitudeInstance.getDeviceId()!;
	}

	sessionId(): number {
		return this.amplitudeInstance.getSessionId()!;
	}

	setDeviceId(deviceId: string): void {
		this.amplitudeInstance.setDeviceId(deviceId);
	}

	setSessionId(sessionId: number): void {
		this.amplitudeInstance.setSessionId(sessionId);
	}

	regenerateDeviceId(): void {
		const userId = this.amplitudeInstance.getUserId();
		this.amplitudeInstance.reset();
		this.amplitudeInstance.setUserId(userId);
	}

	linkDevices(userId: string, deviceIds: string[]): void {
		let finalDeviceId: string | null = this.deviceId();
		if (finalDeviceId === userId) {
			finalDeviceId = null;
		}
		this.setUserId(userId);

		const identifyData = getIdentifyObject();

		// Make sure the current device ID is associated.
		this.amplitudeInstance.identify(identifyData);

		for (const deviceId of deviceIds) {
			if (finalDeviceId == null && deviceId !== userId) {
				finalDeviceId = deviceId;
			}
			this.amplitudeInstance.setDeviceId(deviceId);
			this.amplitudeInstance.identify(identifyData);
		}

		// Continue reporting with the original device ID (if it's not equal to the user ID).
		if (finalDeviceId != null) {
			this.amplitudeInstance.setDeviceId(finalDeviceId);
		} else {
			this.regenerateDeviceId();
		}
	}

	track(eventType: string, props?: Properties): void {
		this.amplitudeInstance.track(eventType, props);
	}

	setUserId(userId: string): void {
		this.amplitudeInstance.setUserId(userId);
	}

	setUserProperties(props: UserProperties): void {
		const identify = new Identify();
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

	identify(identify: Identify): void {
		this.amplitudeInstance.identify(identify);
	}
}

/** NoopClient does nothing when  */
class NoopClient implements Client {
	constructor(private readonly logEvents: boolean) {}

	private log(...args: any[]) {
		if (this.logEvents) {
			console.log('Analytics client:', ...args);
		}
	}

	deviceId() {
		return '';
	}

	sessionId() {
		return -1;
	}

	linkDevices() {
		/* nothing */
	}
	regenerateDeviceId() {
		/* nothing */
	}
	setDeviceId(): void {
		/* nothing */
	}
	setSessionId(): void {
		/* nothing */
	}
	setUserId(): void {
		/* nothing */
	}
	setUserProperties() {
		/* nothing */
	}

	track(eventType: string, props?: Properties): void {
		this.log(`track [${eventType}]`, props);
	}

	identify(): void {
		/* nothing */
	}
}

export function createClient(config: Config): Client {
	return new DefaultClient(config);
}

export function createNoopClient(logEvents: boolean = false): Client {
	return new NoopClient(logEvents);
}
