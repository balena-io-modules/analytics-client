import { Identify, Types, createInstance } from '@amplitude/analytics-browser';
import type * as analyticsBrowser from '@amplitude/analytics-browser';
import { userAgentEnrichmentPlugin } from '@amplitude/plugin-user-agent-enrichment-browser';

import { version } from '../package.json';
import { Client, Config, Properties, UserProperties } from './client';
import { getAmplitudeEndpoint } from './common';
import {
	COOKIES_TTL_DAYS,
	USER_PROP_ANALYTICS_CLIENT_VERSION,
	USER_PROP_COMPONENT_NAME,
} from './config';

const getIdentifyObject = () => {
	const identifyObject = new Identify();
	identifyObject.set(USER_PROP_ANALYTICS_CLIENT_VERSION, version);
	return identifyObject;
};

class MarketingClient implements Client {
	private readonly amplitudeInstance: Types.BrowserClient;

	constructor(config: Config) {
		this.amplitudeInstance = createInstance();
		this.amplitudeInstance.add(userAgentEnrichmentPlugin());

		const amplConfig = {
			...config.amplitude,
		} as Types.BrowserOptions;

		if (config.endpoint) {
			amplConfig.serverUrl = getAmplitudeEndpoint(config.endpoint);
		}
		if (config.deviceId) {
			amplConfig.deviceId = config.deviceId;
		}
		if (config.componentVersion) {
			amplConfig.appVersion = config.componentVersion;
		}

		amplConfig.cookieOptions ??= {};
		// TODO: Move this to the web tracker.
		amplConfig.cookieOptions.expiration = COOKIES_TTL_DAYS;

		amplConfig.autocapture ??= false;
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

	track(eventType: string, props?: Properties): void {
		this.amplitudeInstance.track(eventType, props);
	}

	setUserId(userId: string): void {
		this.amplitudeInstance.setUserId(userId);
	}

	linkDevices(userId: string, deviceIds: string[]): void {
		throw new Error(
			`Marketing client can not link devices ${userId} ${deviceIds}`,
		);
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

	identify(identify: analyticsBrowser.Identify): void {
		this.amplitudeInstance.identify(identify);
	}
}

export function createMarketingClient(config: Config): Client {
	return new MarketingClient(config);
}
