## v5.0.1

- Updated `@r35007/mock-server@5.0.1`
## v5.0.0

- Updated `@r35007/mock-server@5.0.0`
## v4.5.2

- Updated `@r35007/mock-server@4.5.1`
- 
## v4.5.1

- Updated `@r35007/mock-server@4.5.0`
- Now can give .js file to the db, injectors, rewriters, store path
## v4.5.0

- Added `Set Port` Command which is also available in editor context.

## v4.4.1

- On clicking of Stop Server in editor context before starting the server makes the statusbar to show wrong info and become unable to start server - `Fixed`
- Now Stop Sever in editor context will show only on `.json` and `.har` file

## v4.4.0

- removed adding injectors config on transforming to Mock Server Db.
- Synced with `@r35007/mock-server` package.

## v4.3.1

- `mock-server.settings.paths.snapshotsDir` - Add a snapshot dir to get your d snapshots
- Dynamically run any json file to start the server by right clicking and select `Start Server` in editor context.
- Synced with `@r35007/mock-server` package.

## v4.2.0

- Stopping Server takes too long Bug fixed.
- `Generate Mock Files` Command added.
- Added commands in editor context
- Restart Server bug fixed.

## v3.0.3

- License Update

## v3.0.2

- ReadMe update

## v3.0.0

- Implemented mock server `Home Page` inside vs code.
- Added more settings
- Updated `@r35007/mock-server@3.0.9`

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
