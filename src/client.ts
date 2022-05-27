export interface Properties {
	[key: string]: any;
}

export interface UserProperties {
	set?: Properties;
	setOnce?: Properties;
}

export interface Client {
	/** Return the ID used to identify the current device. */
	deviceId(): string;

	/** Return the ID used to identify the current session. */
	sessionId(): number;

	/** Generate a new device identifier used for reporting. */
	regenerateDeviceId(): void;

	/** Associate all input device IDs with a user ID. */
	linkDevices(userId: string, deviceIds: string[]): void;

	/** Set current device ID. */
	setDeviceId(deviceId: string): void;

	/** Set current session ID. */
	setSessionId(sessionId: number): void;

	/** Set current user ID. */
	setUserId(userId: string): void;

	setUserProperties(props: UserProperties): void;

	/** Track event of the defined type with specified event properties. */
	track(eventType: string, props?: Properties): void;
}

export interface ClientConfig {
	/** Analytics backend base endpoint. */
	endpoint?: string;

	/** Project name for the analytics client. */
	projectName: string;

	/** Name of the component that does the reporting. */
	componentName: string;

	/** Component version name. */
	componentVersion?: string;

	/** Optional device_id for Amplitude client. */
	deviceId?: string;
}
