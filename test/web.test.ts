import { createClient } from '../src/client';
import { createWebTracker } from '../src/web';

test('trackPageView', () => {
	const client = createClient({
		projectName: 'balena-test',
		componentName: 'test',
	});
	const tracker = createWebTracker(client);

	let passedEventType: string = '';
	let passedData: any = null;
	client.amplitude().logEvent = (event: string, data?: any) => {
		passedEventType = event;
		passedData = data;
		return 0;
	};

	tracker.trackPageView();
	expect(passedEventType).toStrictEqual('Page View');
	expect(passedData).toHaveProperty('metrics');

	tracker.trackPageView('test event');
	expect(passedEventType).toStrictEqual('test event');
});
