# Mock Server[](#mock-server)

- Get a full REST API with zero coding in less than 30 seconds (seriously)
- This extension is a wraper over for the node package `mock-server@2.4.1`.

![Home Page](https://r35007.github.io/Mock-Server/homePage.png)

Please visit [https://r35007.github.io/Mock-Server/](https://r35007.github.io/Mock-Server/) for further information.

## Table of contents

- [Setup](#setup)
- [Commands](#commands)
  - [Start/Stop Server](#start/stop-server)
  - [Refresh/Restart Server](#Refresh/ReStart-server)
  - [Switch Environment](#switch-environment)
  - [Generate Mock](#generate-mock)

## Setup

- First provide a valid paths in `mock-server.paths.mockPath`
- Thie given path must contain a valid `.json` file to generate a local mock server
- Now run the command `Start Server` to launch the server.

## Commands

### `Start/Stop Server`

This command generates a local mock server from the given `mock-server.settings.paths.mockPath` in the vs code settings.

### `Refresh/Restart Server`

This command restarts a local mock server. If any changes done to the settings or mock data please restart the server.

### `Switch Environment`

This command switches the mock data point environment files that are provided in the `mock-server.settings.paths.envPath` folder. You can also switch environment via `mock-server.settings.environment`

### `Generate Mock`

This command helps to generate a mock data from HAR file. NOTE: The HAR file size must be less than 5MB.

#### `entryCallback`

While generating mock to call a method for each entry you must provide a callback method for entry.
This can be provided inside the middleware.js and this file path must be proided to the "`mock-server.paths.middlewarePath`".

For further information please visit [https://r35007.github.io/Mock-Server/#generatemockfromhar](https://r35007.github.io/Mock-Server/#generatemockfromhar)

`middleware.js`

```js
exports.entryCallback = (entry, routePath, routeConfig, pathToRegexp) => {
  // your code goes here ...
};
```

#### `finalCallback`

While generating mock to call a method at the end of the generatedMock you must provide a final callback method.
This can be provided inside the middleware.js and this file path must be proided to the "`mock-server.paths.middlewarePath`".

For further information please visit [https://r35007.github.io/Mock-Server/#generatemockfromhar](https://r35007.github.io/Mock-Server/#generatemockfromhar)

`middleware.js`

```js
exports.entryCallback = (entry, routePath, routeConfig, pathToRegexp)  => {
  // your code goes here ...
};

exports.finalCallback = (harData, generatedMock, pathToRegexp) => {
  // your code goes here ...
};
```
