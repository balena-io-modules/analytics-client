declare module '@analytics/cookie-utils' {
	export function hasCookieSupport(): boolean;

	export function setCookie(name: string, value: string): void;

	export function getCookie(name: string): string;
}
