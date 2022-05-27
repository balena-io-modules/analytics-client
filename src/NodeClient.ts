import { Client, ClientConfig, Properties } from './client';
import * as amplitude from '@amplitude/node';
import { Identify } from '@amplitude/identify';
import {
	USER_PROP_ANALYTICS_CLIENT_VERSION,
	USER_PROP_COMPONENT_NAME,
} from './config';
import { version } from '../package.json';

interface NodeClientConfig extends ClientConfig {
	apiKey: string;
}

const identifyObject = () =>
	new Identify().set(USER_PROP_ANALYTICS_CLIENT_VERSION, `node-${version}`);

export class NodeClient implements Client {
	private readonly amplitudeInstance: amplitude.NodeClient;

	private _deviceId: string | null;
	private _sessionId: number | null;
	private _userId: string | null;

	constructor(
		private readonly config: NodeClientConfig,
		private readonly prefix?: string,
	) {
		this.amplitudeInstance = new amplitude.NodeClient(this.config.apiKey);
		this.identify();

	}

	private identify(): void {
		this.amplitudeInstance
			.identify(
				this._userId,
				this._deviceId,
				identifyObject().set(USER_PROP_COMPONENT_NAME, this.config.componentName),
			)
			.catch(console.error);
	}

	deviceId(): string {
		return this._deviceId!!;
	}

	sessionId(): number {
		return this._sessionId!!;
	}

	linkDevices() {
		/* nothing */
	}
	regenerateDeviceId() {
		/* nothing */
	}

	setDeviceId(deviceId: string): void {
		this._deviceId = deviceId;
		this.identify();
	}

	setSessionId(sessionId: number): void {
		/* Is this usefull in any sense ? */
		this._sessionId = sessionId;
	}

	setUserId(userId: string): void {
		this._userId = userId;
		this.identify();
	}

	setUserProperties(): void {
		/* nothing */
	}

	track(eventType: string, props?: Properties): void {
		const eventName = `${this.prefix ? `[${this.prefix}] ` : ''}${eventType}`;
		const event = {
			event_type: eventName,
		};
		this.amplitudeInstance
			.logEvent(event, props)
			.catch((err) =>
				console.error('Failed to submit event to amplitude', err),
			);
	}
}
