## v3.0.3

- License Update

## v3.0.2

- ReadMe update

## v3.0.0

- implemented mock server `Home Page` inside vs code.
- added more settings
- updated `@r35007/mock-server@3.0.9`

## v2.1.4

- `mock-server.settings.store` is renamed to `mock-server.settings.paths.storePath`
- updated `@r35007/mock-server@2.4.2`

## v2.1.3

- Bug Fix
- updated `@r35007/mock-server@2.4.1`
- changes default mockPath from `https://jsonplaceholder.typicode.com/db` to `http://jsonplaceholder.typicode.com/db`

## v2.1.2

- updated `@r35007/mock-server@2.3.1`
- Now can directly access server Mock data.
  Try to give the following code in `settings.json`

```json
{
  "mock-server.settings.paths": {
    "mockPath": "https://jsonplaceholder.typicode.com/db"
  }
}
```

## v2.0.6

- updated `@r35007/mock-server@2.1.1`

## v2.0.5

- `mockServer.resetServer` command bug fix.

## v2.0.4

- updated `@r35007/mock-server@2.1.0`

## v2.0.1,v2.0.2,v2.0.3

- Bug Fix
- updated `@r35007/mock-server@2.0.10`

## v2.0.0

- Bug Fix
- Added File watcher. Automatically restarts the server for file changes.
- updated `@r35007/mock-server@2.0.7`

## v1.0.0

- Initial release
