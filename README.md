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

const analytics = new AnalyticsUrlParams(mixpanel);

analytics.consumeUrlParameters(window.location.search);

const signupUrl = '/signup?' + analytics.deviceIdQuery();
```
