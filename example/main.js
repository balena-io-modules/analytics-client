const client = analyticsClient.createClient({
    endpoint: 'localhost:3001',
    projectName: 'balena-test',
    componentName: 'example',
    amplitude: {
        forceHttps: false
    }
});
console.log(`Original device ID: ${client.deviceId()}`);

const urlHandler = new analyticsClient.AnalyticsUrlParams(client);
const newUrl = urlHandler.consumeUrlParameters(location.search);
if (newUrl != null) {
    location.search = newUrl;
}
console.log(`Final device ID: ${client.deviceId()}`);
console.log(`All device IDs: ${urlHandler.allDeviceIds()}`);

const identify = client.amplitude().Identify;
const id = new identify().setOnce('initial_time', new Date().toISOString());
client.amplitude().identify(id);
client.amplitude().logEvent('Test', {args: 'test event'});

client.linkDevices('test-user-1', urlHandler.allDeviceIds());

const exp = new analyticsClient.LocalExperiment('test-exp')
    .define('v1', 50)
    .define('v2', 50);
console.log('Variation:', exp.engage(client.deviceId()));

const webTracker = analyticsClient.createWebTracker(client);
webTracker.trackPageView();
console.log('Reported page view');
