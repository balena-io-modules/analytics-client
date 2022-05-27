import { Properties } from './client';

/**
 * WebTracker exposes an events tracking interface suitable for web apps.
 */
export interface WebTracker {
	track(name: string, props?: Properties): void;
	trackNavigationClick(href: string, props?: Properties): void;
	trackPageView(): void;
}
