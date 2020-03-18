const client = analyticsClient.createClient({
    endpoint: 'localhost:3001/amplitude',
    projectName: 'balena-test',
    amplitude: {
        forceHttps: false
    }
});

const urlHandler = new analyticsClient.AnalyticsUrlParams();
const newUrl = urlHandler.consumeUrlParameters(location.search);
if (newUrl != null) {
    location.search = newUrl;
}

const identify = client.amplitude().Identify;
const id = new identify().setOnce('initial_time', new Date().toISOString());
client.amplitude().identify(id);
client.amplitude().logEvent('Test', {args: 'test event'});

client.linkDevices('test-user-1', urlHandler.allDeviceIds());

const exp = new analyticsClient.LocalExperiment('test-exp')
    .define('v1', 50)
    .define('v2', 50);
console.log('Variation:', exp.engage(client.deviceId()));
