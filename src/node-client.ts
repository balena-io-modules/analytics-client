import { Client, ClientConfig, Properties } from './client';
import axios from 'axios';


interface NodeClientConfig extends ClientConfig {
	endpoint: string;
}

export class NodeClient implements Client {

	constructor(
		private readonly prefix: string,
		private readonly config: NodeClientConfig,
	) { }


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
		const eventName = `[${this.prefix}] ${eventType}`;
		const event = {
			event_type: eventName,
		};
		axios.post(`${this.config.endpoint}/amplitude`, { event, props }).catch(console.error);
	}
}
