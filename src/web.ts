import { Client } from './client';

/**
 * WebTracker exposes an events tracking interface suitable for web apps.
 */
export interface WebTracker {
	trackPageView(name?: string): void;
}

export function createWebTracker(client: Client): WebTracker {
	return {
		trackPageView(name?: string): void {
			client.track(name ? name : 'Page View', {
				metrics: getPageloadMetrics(),
			});
		},
	};
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
