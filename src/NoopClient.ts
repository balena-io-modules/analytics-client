import { Client, Properties } from './client';

export class NoopClient implements Client {
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
}
