declare module '@analytics/cookie-utils' {
	export function hasCookieSupport(): boolean;

	export function setCookie(
		name: string,
		value: string,
		ttlMs: number,
		path: string,
	): void;

	export function getCookie(name: string): string;

	export function removeCookie(name: string): void;
}
