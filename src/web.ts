import { Client, Properties } from './client';

/**
 * WebTracker exposes an events tracking interface suitable for web apps.
 */
export interface WebTracker {
	track(name: string, props?: Properties): void;
	trackNavigationClick(href: string, props?: Properties): void;
	trackPageView(name?: string): void;
}

export function createWebTracker(client: Client, prefix?: string): WebTracker {
	return {
		track(name: string, props?: Properties) {
			client.track(`${prefix ? `[${prefix}] ` : ''}${name}`, props);
		},

		trackNavigationClick(href: string, props?: Properties) {
			this.track('Navigation Click', {
				...props,
				href,
				current_url: window.location.href,
				current_url_path: window.location.pathname,
			});
		},

		trackPageView(name?: string, props?: Properties) {
			this.track(name ? name : 'Page View', {
				...props,
				current_url: window.location.href,
				current_url_path: window.location.pathname,
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
