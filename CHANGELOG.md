# Change Log

All notable changes to this project will be documented in this file
automatically by Versionist. DO NOT EDIT THIS FILE MANUALLY!
This project adheres to [Semantic Versioning](http://semver.org/).

# v3.1.0
## (2025-05-13)

* Add Amplitude Engagement SDK back [Jonathan Berger]

# v3.0.0
## (2025-04-29)

* Remove `@amplitude/engagement-browser` [myarmolinsky]
* Add `userAgentEnrichmentPlugin` to Amplitude instance [myarmolinsky]
* Remove dependency `@amplitude/marketing-analytics-browser` [myarmolinsky]
* Add dependency `@amplitude/plugin-user-agent-enrichment-browser` [myarmolinsky]
* Update `@amplitude/analytics-browser` to v2 [myarmolinsky]
* Add `skipLibCheck` to tsconfig.json [myarmolinsky]

# v2.1.0
## (2025-04-17)

* Add engagement plugin to Amplitude instance [myarmolinsky]
* Add dependency `@amplitude/engagement-browser` [myarmolinsky]
* Update jest and related code [myarmolinsky]
* Update @balena/lint [myarmolinsky]

# v2.0.2
## (2023-07-14)

* Fix typing errors [Thodoris Greasidis]
* Update TypeScript to 4.9.5 [Thodoris Greasidis]
* patch: Update flowzone.yml [Kyle Harding]

# v2.0.1
## (2022-11-10)

* Add src and index.ts to final bundle [Otávio Jacobi]

# v2.0.0
## (2022-11-02)

* Update amplitude-js client dependency [Otávio Jacobi]

# v1.8.3
## (2022-09-27)

* removes tests and other files from delivery bundle [Otávio Jacobi]

# v1.8.2
## (2022-09-27)

* removes not needed repo.yml file [Otávio Jacobi]
* Replace balenaCI with flowzone [Otávio Jacobi]

# v1.8.1
## (2022-09-07)

* rolls back analytics client version [Otávio Jacobi]

# v1.8.0
## (2022-09-06)

* adds optional props to track page view [Otávio Jacobi]
* fixes access config for ci [Otávio Jacobi]
* fixes old vulnerable dependencies [Otávio Jacobi]

# v1.7.0
## (2021-08-13)

* Get getQueryString to expect relative URLs too [Ezequiel Boehler]

# v1.6.0
## (2021-04-22)

* Added unsetParamsReferrerOnNewSession to client [Ezequiel Boehler]

# v1.5.0
## (2021-03-29)

* Update setClient() to work with new init method [Ezequiel Boehler]

# v1.4.0
## (2021-03-02)

* Changed getQueryString to validate domains [Ezequiel Boehler]

# v1.3.0
## (2021-02-24)

* Don't store session ID in a cookie [Pranas Ziaukas]
* Implement session ID parsing and logic [Pranas Ziaukas]

# v1.2.1
## (2021-02-24)

* Fix `optOutRequested` typo [Pranas Ziaukas]

# v1.2.0
## (2021-02-22)

* Changed type of passedDeviceId on url-params Changed it from null to undefined on url-params.ts [Ezequiel Boehler]

# v1.1.0
## (2021-02-17)

* Add trackNavigationClick [gelbal]

# v1.0.0
## (2021-02-17)

* Changes on how device_id is treated on init [Ezequiel Boehler]

# v0.12.1
## (2020-12-16)

* Address PR feedback [gelbal]

# v0.12.0
## (2020-11-23)

* Add documentation [gelbal]

# v0.11.2
## (2020-07-29)

* Fix broken cookies [Roman Mazur]

# v0.11.1
## (2020-07-28)

* Handle the case when user ID and device ID are equal [Roman Mazur]

# v0.11.0
## (2020-07-22)

* Allow setting cliient after URL params consumption [Roman Mazur]
* Add opt-out URL parameter parsing [Roman Mazur]

# v0.10.0
## (2020-07-21)

* Add noop client implementation [Roman Mazur]

# v0.9.1
## (2020-06-17)

* Fix duplicate experiment values [Roman Mazur]

# v0.9.0
## (2020-06-12)

* Call identify on re-engagement [Amit Solanki]

# v0.8.0
## (2020-05-27)

* Remove mixpanel from the interface [Roman Mazur]
* Extend test coverage [Roman Mazur]

# v0.7.0
## (2020-05-27)

* Expose device ID regeneration [Roman Mazur]
* Add user ID and properties interface [Roman Mazur]

# v0.6.2
## (2020-05-26)

* Fix mixpanel dependency [Roman Mazur]

# v0.6.1
## (2020-05-18)

* fix: pin mixpanel-browser version [JSReds]

# v0.6.0
## (2020-05-07)

* Add generic track to webtracker [Roman Mazur]

# v0.5.3
## (2020-04-16)

* Make web tracker more flexible [Roman Mazur]

# v0.5.2
## (2020-04-13)

* Ensure library version is set [Roman Mazur]

# v0.5.1
## (2020-04-13)

* Remove mixpanel dependency from url params code [Roman Mazur]

# v0.5.0
## (2020-04-13)

* Add WebTracker interface [Roman Mazur]

# v0.4.4
## (2020-04-01)

* Adjust compiler settings [Roman Mazur]

# v0.4.3
## (2020-03-31)

* Bump typescript version [Roman Mazur]

# v0.4.2
## (2020-03-27)

* Fix devices linking [Roman Mazur]

# v0.4.1
## (2020-03-26)

* Adapt config to analytics-backend API [Roman Mazur]

## 0.4.0 - 2020-03-18

* Add experiments implementation [Roman Mazur]

## 0.3.1 - 2020-03-18

* Bump balena linter [Roman Mazur]

## 0.3.0 - 2020-03-17

* Add ampiltude integration [Roman Mazur]

## 0.2.0 - 2020-03-13

* Replace cookies implementation [Roman Mazur]
* Update readme [Roman Mazur]
* Move typescript to dev dependencies [Roman Mazur]
* Fix device ID cookie path [Roman Mazur]

## 0.1.2 - 2019-10-20

* Update readme [Roman Mazur]
* Move typescript to dev dependencies [Roman Mazur]

## 0.1.1 - 2019-10-18

* Move typescript to dev dependencies [Roman Mazur]
* Fix device ID cookie path [Roman Mazur]

## 0.1.0 - 2019-10-18

* Fix device ID cookie path [Roman Mazur]
* Avoid calling mixpanel in constructor [Roman Mazur]
* Add URL query string tools [Roman Mazur]
