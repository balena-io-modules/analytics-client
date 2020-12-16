Analytics client
================

Client part of analytics services used at balena.
The analytics client is a component that integrates into the [analytics-backend](https://github.com/balena-io/analytics-backend). Together they're responsible for processing the analytics tracking events before forwarding them to the relevant parties, referred to here as *the final destinations*.
Currently the only final destination is Amplitude. We have plans to support more final destinations going forward, like Sentry.

## Installation

```
npm install --save analytics-client
```

## Usage

Tracking a page view. The following reports an event named `[EFP] Page View` with default properties.

```typescript
import { createClient, createWebTracker } from 'analytics-client';

const client = createClient({
    endpoint: 'data.balena-cloud.com', // use 'data.balena-staging.com' for testing
    projectName: 'balena-project', // unique identifier that analytics-backend expects
    componentName: 'etcher-featured-project', // short unique name of component
    componentVersion: require('./package.json').version, // (optional) automated version reporting
});

createWebTracker(client, 'EFP') // 2nd parameter defines the prefix of event names
    .trackPageView();
```

Here is an example how a product like CLI would identify a user and report a login event (`[CLI] Login`) with certain event properties related to the login action.

```typescript
import { createClient } from 'analytics-client';

const client = createClient({
    endpoint: 'data.balena-cloud.com', // use 'data.balena-staging.com' for testing
    projectName: 'balena-project', // unique identifier that analytics-backend expects
    componentName: 'balena-cli', // short unique name of component
    componentVersion: require('./package.json').version, // (optional) automated version reporting
});

// user authenticates as part of the product flow

client.setUserId('balenaCloudUsername');

client.track('Login', {
    balenaUrl: 'balena-cloud.com',
    loginType: 'web-auth',
    node: 'v10.21.0',
})
```

URL query parameters tool.

```typescript
import { AnalyticsUrlParams } from 'analytics-client';

const urlParamsHandler = new AnalyticsUrlParams(mixpanel);

urlParamsHandler.consumeUrlParameters(window.location.search);

const signupUrl = '/signup?' + urlParamsHandler.getDeviceIdsQueryString();
```

UI experiments definition.
```typescript
import { createClient, LocalExperiment } from 'analytics-client';

const client = createClient({projectName: 'my-project'});

type Variation = 'modal' | 'sidebar-left' | 'sidebar-right';
const experiment = new LocalExperiment<Variation>('WelcomeUI', client)
    .define('modal', 50)
    .define('sidebar-left', 25)
    .define('sidebar-right', 25);

switch (experiment.engage(client.deviceId())) {
    case 'modal':
        showModal();
        break;
    // ...
}
```

## Using without npm packages

Load the script from unpkg CDN (replacing `{version}` with an actual version you need to use):
```html
<script src="https://unpkg.com/analytics-client@{version}/dist/bundle.js"></script>
```
Then use the `analyticsClient` variable:
```js
const urlParamsHandler = new analyticsClient.AnalyticsUrlParams();
```

## Configuration

We use environment configuration on the [analytics-backend](https://github.com/balena-io/analytics-backend) to mask the actual API tokens of the final destination services of these events.
We expose easy to remember names to map the destination specific tokens to `projectName` variable used as part of client initialization. analytics-backend uses the value of `projectName` to reason where to pipe the event flow.
The masking helps with preventing abuse and the mapping makes the configuration more flexible to support multiple final destinations.
Reach out to the data team when in doubt which project to use or if you need to define a new project.

In the final destinations, we separate staging and production environments. We use the same `projectName` value but different tokens to differentiate the production and staging environments. So you only need to update `endpoint` to pick the right destination.

Use the staging environment for testing purposes by setting `endpoint` in the `createClient` initialization to `data.balena-staging.com`. Once you are happy with your tests and ready to go live, update the `endpoint` to `data.balena-cloud.com` for production environment.

Additionally, identify your component using the parameter `componentName`. It's best to keep the value short yet descriptive.

Please ask Operation folks for `#access` to the relevant project in your final destination so you can validate that the tracked events show as expected.

Finally, there is the optional configuration parameter `componentVersion` to track the version of a component sending each event. This is useful to track changes across new component versions so we strongly recommend tracking it.

## Web tracker

[`WebTracker`](src/web.ts) exposes an events tracking interface suitable for web apps. It provides a simple `Page View` event tracking with page loading metrics via `trackPageView`.

When initializing `createWebTracker`, set `prefix` as a short string that describes your project. All events tracked by `WebTracker` will have this `prefix` in their name.
We use this prefixing method to identify and group events in the final destination for organization purposes and helping the analysts traverse the events with ease.
This is especially useful when there are multiple components sending events to the same project in the final destination. To give an example, our marketing website, docs pages and blog all send `Page View` event but these are prefixed respectively `Marketing`, `Docs` and `Blog`. So the final event name is `[Marketing] Page View`, `[Docs] Page View`, etc. Furthermore, this method makes it easier to identify all the `Marketing` events.

## Identifying users

By default the client tracks `deviceId` to identify the current device of the end user. `deviceId` is a UUID generated automatically by the client. Use `setUserId` method to identify authenticated user. At least one of these identifiers is required to successfully track an event.

In most cases the device refers to the browser of the user (or Electron application for the case of Etcher). By persisting the `deviceId` in the local storage, we are able to identify the events coming from the same user in order to create a timeline of component usage.

It is possible to generate a new device identifier and also override an existing device identifier. Additionally, when we record multiple device identifiers along with the same user identifier, we are able to link multiple event timelines coming from various devices belonging to the same user.
For instance, a balenaCloud user might login to the dashboard from multiple browsers and also use balenaCLI. We would like to create a coherent timeline that captures all their activity and display it under the same user in order to make a sound analysis of their balena platform usage. As long as all the components `setUserId` as soon as the authentication happens, we are able to link all the events with separate `deviceId` values that came *even before* the authentication on the backend side.

[`AnalyticsUrlParams`](src/url-params.ts) helps with linking anonymous `deviceId` values that each component sends individually.
For instance we use this method to link Etcher users clicking on EFP link to land on our blog website and eventually signup to balenaCloud.
When the user clicks on the blog link in EFP, we append the `deviceId` generated by EFP component to the URL.
Then the blog parses the URL to match EFP `deviceId` with blog `deviceId` (essentially the `deviceId` associated with the browser that opened the blog website).
In a similar fashion, the signup links on the blog website also includes EFP `deviceId` as well as blog `deviceId`.
When the user lands on balenaCloud dashboard and authenticates, we link all the user activity and list it under the same timeline.
We need to make these jumps as there are 3 components tracking events and there are multiple domains involved.
The benefit is we are able to look into a user's EFP and blog activity before signing up to balenaCloud.


## Questions?

Reach out to the data team in `r/analytics` flow for guidance and troubleshooting.
