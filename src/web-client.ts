import * as amplitude from 'amplitude-js';
import * as Cookies from 'js-cookie';
import * as mixpanel from 'mixpanel-browser';
import { Client, ClientConfig, Properties, UserProperties } from './client';
import {
	COOKIES_TTL_DAYS,
	USER_PROP_ANALYTICS_CLIENT_VERSION,
	USER_PROP_COMPONENT_NAME,
} from './config';
import { version } from '../package.json';
import { WebTracker } from './web';

interface AmplitudeOverride {
	apiEndpoint?: string;
	cookieExpiration?: number;
	includeReferrer?: boolean;
	includeUtm?: boolean;
	sameSiteCookie?: 'Lax' | 'Strict' | 'None';
}

interface WebClientConfig extends ClientConfig {
	/** Optional config for Amplitude client. */
	amplitude?: Omit<amplitude.Config, keyof AmplitudeOverride>;
}

const identifyObject = () =>
	new amplitude.Identify().set(
		USER_PROP_ANALYTICS_CLIENT_VERSION,
		`web-${version}`,
	);

export class WebClient implements Client, WebTracker {
	private readonly amplitudeInstance: amplitude.AmplitudeClient;

	constructor(
		private readonly prefix: string,
		private readonly config: WebClientConfig,
	) {
		this.amplitudeInstance = amplitude.getInstance(config.projectName);

		const amplConfig: amplitude.Config = Object.assign({}, config.amplitude);
		if (config.endpoint) {
			amplConfig.apiEndpoint = `${config.endpoint}/amplitude`;
		}

		amplConfig.cookieExpiration = COOKIES_TTL_DAYS;
		amplConfig.includeReferrer = true;
		amplConfig.includeUtm = true;
		amplConfig.sameSiteCookie = 'Lax';
		amplConfig.unsetParamsReferrerOnNewSession = true;

		if (config.deviceId) {
			amplConfig.deviceId = config.deviceId;
		}

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
			});
			this.setDeviceId(mixpanel.get_distinct_id());
		}
	}

	deviceId(): string {
		return this.amplitudeInstance.options.deviceId!!;
	}

	sessionId(): number {
		return this.amplitudeInstance.getSessionId();
	}

	setDeviceId(deviceId: string) {
		this.amplitudeInstance.setDeviceId(deviceId);
	}

	setSessionId(sessionId: number) {
		this.amplitudeInstance.setSessionId(sessionId);
	}

	regenerateDeviceId() {
		this.amplitudeInstance.regenerateDeviceId();
	}

	linkDevices(userId: string, deviceIds: string[]): void {
		let finalDeviceId: string | null = this.deviceId();
		if (finalDeviceId === userId) {
			finalDeviceId = null;
		}
		this.setUserId(userId);

		const identifyData = identifyObject();

		// Make sure thee current device ID is associated.
		this.amplitudeInstance.identify(identifyData);

		for (const deviceId of deviceIds) {
			if (finalDeviceId === null && deviceId !== userId) {
				finalDeviceId = deviceId;
			}
			this.amplitudeInstance.setDeviceId(deviceId);
			this.amplitudeInstance.identify(identifyData);
		}

		// Continue reporting with the original device ID (if it's not equal to the user ID).
		if (finalDeviceId !== null) {
			this.amplitudeInstance.setDeviceId(finalDeviceId);
		} else {
			this.amplitudeInstance.regenerateDeviceId();
		}
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

	track(eventType: string, props?: Properties): void {
		const eventName = `[${this.prefix}] ${eventType}`;
		this.amplitudeInstance.logEvent(eventName, props);
	}

	trackNavigationClick(href: string, props?: Properties) {
		this.track('Navigation Click', {
			...props,
			href,
			current_url: window.location.href,
			current_url_path: window.location.pathname,
		});
	}

	trackPageView() {
		this.track('Page View', {
			current_url: window.location.href,
			current_url_path: window.location.pathname,
			metrics: getPageloadMetrics(),
		});
	}
}

const getPageloadMetrics = () => {
	if (!window.performance || !window.performance.getEntriesByType) {
		return {};
	}
	const entry = window.performance.getEntriesByType('navigation');
	if (!entry || entry.length < 1) {
		return {};
	}
	const data = entry[0] as PerformanceNavigationTiming;

	return {
		domInteractive: data.domInteractive - data.startTime,
		domComplete: data.domComplete - data.startTime,
		loadEventEnd: data.loadEventEnd - data.startTime,
	};
};
