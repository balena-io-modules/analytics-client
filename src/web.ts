import { Client } from './client';

/**
 * WebTracker exposes an events tracking interface suitable for web apps.
 */
export interface WebTracker {
	trackPageView(prefix?: string, name?: string): void;
}

export function createWebTracker(client: Client): WebTracker {
	return {
		trackPageView(prefix?: string, name?: string): void {
			client.track(
				`${prefix ? `[${prefix}] ` : ''}${name ? name : 'Page View'}`,
				{
					current_url: window.location.href,
					current_url_path: window.location.pathname,
					metrics: getPageloadMetrics(),
				},
			);
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
