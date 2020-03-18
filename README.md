Analytics client
================

Client part of analytics services used at balena.

## Installation

```
npm install --save analytics-client
```

## Usage

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
