# Mock Server[](#mock-server) [![](https://img.shields.io/npm/l/@r35007/mock-server?color=blue)](https://img.shields.io/npm/l/@r35007/mock-server?color=blue) [![](https://img.shields.io/npm/types/@r35007/mock-server)](https://img.shields.io/npm/types/@r35007/mock-server)

Get a full REST API with **zero coding** in **less than 30 seconds** (seriously)

Created with <3 for front-end developers who need a quick back-end for prototyping and mocking.

This Extension is built upon node package `@r35007/mock-server`.

## Table of contents

  - [Table of contents](#table-of-contents)
  - [Getting started](#getting-started)
  - [Commands](#commands)
    - [`Start Server`](#start-server)
    - [`Stop Server`](#stop-server)
    - [`Reset Server`](#reset-server)
    - [`Reset and Restart Server`](#reset-and-restart-server)
    - [`Set Port`](#set-port)
    - [`Set Root`](#set-root)
    - [`Switch Environment`](#switch-environment)
    - [`Get Db Snapshot`](#get-db-snapshot)
    - [`Transform to Mock Server Db`](#transform-to-mock-server-db)
    - [`Generate Mock Files`](#generate-mock-files)
    - [`Home Page`](#home-page)
  - [Settings](#settings)
    - [`Set Custom Port`](#set-custom-port)
    - [`Set Custom Host`](#set-custom-host)
    - [`Set Base Path`](#set-base-path)
    - [`Set Db Id`](#set-db-id)
    - [`Set Data Paths`](#set-data-paths)
    - [DB](#db)
    - [Middleware](#middleware)
    - [Injectors](#injectors)
    - [Route Rewriters](#route-rewriters)
    - [Static File Server](#static-file-server)
  - [Documentation](#documentation)
  - [Author](#author)
  - [License](#license)

## Getting started

- Install the Extension.
- Right click on the workspace folder and select `Generate Mock Files` from the context.
- From Command Palette (`(Ctrl/Cmd)+Shift+P`) type mock and select `MockServer: Start Server` (`Alt+Enter`)
- To view the List of resources go to Command `MockServer: Home Page`

![Home Page](https://github.com/R35007/Mock-Server/blob/main/src/img/VSCode_Extension.gif?raw=true)

## Commands

### `Start Server`

Mock Server can be started in three ways.

- From Command Palette (`(Ctrl/Cmd)+Shift+P`) type mock and select `MockServer: Start Server`
- Use `Alt+Enter` shortcut to start or restart the server.
- Click the `Mock It` icon at the right corner of the statusbar
- Server will automatically will restarted if any changes are made.
- You can also manually restart the server bu giving the same `MockServer: Start Server` Command

### `Stop Server`

- From Command Palette (`(Ctrl/Cmd)+Shift+P`) type mock and select `MockServer: Stop Server`.
- ShortCut using `Shift+Alt+Enter`

### `Reset Server`

- From Command Palette (`(Ctrl/Cmd)+Shift+P`) type mock and select `MockServer: Reset Server`.
- This command clears all server cache and reset all data

### `Reset and Restart Server`

- From Command Palette (`(Ctrl/Cmd)+Shift+P`) type mock and select `MockServer: Reset and Restart Server`.
- This command clears all server cache, reset all data and start the mock server in a new instance.

### `Set Port`

- From Command Palette (`(Ctrl/Cmd)+Shift+P`) type mock and select `MockServer: Set Port`.
- This command helps prompts and sets the custom port to start the server.

### `Set Root`

- From Command Palette (`(Ctrl/Cmd)+Shift+P`) type mock and select `MockServer: Set as Server Root Folder`.
- This command helps sets the current selected file or folder as a Server root folder.

### `Switch Environment`

Helps to work in multiple data environments.

- Create `env` folder in root.
- Keep you different db data of extension `.json` or `.har`
- From Command Palette (`(Ctrl/Cmd)+Shift+P`) type mock and select `MockServer: Switch Environment`
- Use`Alt+S` shortcut to switch environment.
- Now All the `.json` will be listed down. You can pick a data to launch the server.
- Note `.har` will automatically converted into `.json` with a valid db routes.
- This path can be modified using the settings `mock-server.settings.paths.envDir`.

### `Get Db Snapshot`

- `MockServer: Get Db Snapshot` Command helps to save the current db data snapshot.

### `Transform to Mock Server Db`

- `MockServer: Transform to Mock Server Db` Command helps to generate a valid routes.
- This also helps to convert the `.har` data to a valid `db.json` file.

### `Generate Mock Files`

- `MockServer: Generate Mock Files` Command helps to generate a sample mock files in the `mock-server.settings.paths.root` folder.
- Alternatively you can also generate mock files by right clicking on the folder and click `Generate Mock Files` command in the context menu.

### `Home Page`

- `MockServer: Home Page` Command opens a new window which shows you all the list of resources.
- This window also helps to update or add new resources in runtime.
- It can be opened in a separate browser window using [http://localhost:3000](http://localhost:3000)

## Settings

### `Set Custom Port`

- Set a custom port using `mock-server.settings.port` in vscode settings.json.
- Default: `3000`.

### `Set Custom Host`

- Set a custom host using `mock-server.settings.host` in vscode settings.json.
- Default: `localhost`.

### `Set Base Path`

- You can mount the Mock Server on another endpoint using the base url.
- Use `mock-server.settings.base` in vscode settings.json to set a custom base path.
- Alternatively you can also set the base path using the [Route Rewriter](#route-rewriter).

### `Set Db Id`

- `mock-server.settings.id` set database id property (e.g. \_id).
- Default: `id`

### `Set Data Paths`

- `mock-server.settings.paths` sets all the data paths to start the Mock Server.
- Defaults:

```jsonc
{
  "root": "./", // all paths will be relative this path.
  "db": "db.json", // If its a folder path, the server pick all the .json files and run the mock server.
  "middleware": "middleware.js", // path to middlewares. Must be .js type file
  "injectors": "injectors.json", // path to injectors file
  "rewriters": "rewriters.json", // path to rewriters file
  "store": "store.json", // path to store file
  "staticDir": "public", // path to static file server.
  "envDir": "env" // path to env. on `MockServer: Switch Environment` Command, picks all the .json files under this directory.
}
```

### DB

- Create `db.json`
- Set custom Db path using setting `mock-server.settings.paths.db`.
- This path can be either file path or folder path or also a server path.
- If provided as a folder path, then all the `.json` files will be joined together and starts the server.
- Example 1 : `db.json`.
- Example 2 : `./folder`.
- Example 2 : `https://jsonplaceholder.typicode.com/db`.

### Middleware

- Create `middleware.js`
- Set custom Middleware path using setting `mock-server.settings.paths.middleware`.
- Middlewares must be of a type `.js` file.
- Callback method to generate routes can also be given in this `middleware.js`.
- Example:

`middleware.js`

```js
/* 
  Global Middlewares
  These middlewares will be added to start of the the express app 
*/
exports._globals = [
  (req, res, next) => {
    console.log(req.path);
    next();
  },
];

/* 
  Used in VS Code Mock Server extension
  This method is called only on generating db suing MockServer: Generate Db Command
  It will be called for each entry in a HAR formatted data
  Here you can return your custom route and routeConfig
  `_harEntryCallback` is a reserved word for generating Db 
*/
exports._harEntryCallback = (entry, routePath, routeConfig) => {
  // your code goes here ...
  return { [routePath]: routeConfig };
};

/* 
  Used in VS Code Mock Server extension
  This method is called only on generating db suing MockServer: Generate Db Command
  It will be called at last of all entry looping.
  Here you can return your custom db
  Whatever you return here will be pasted in the file
  `_harDbCallback` is a reserved word for generating Db
*/
exports._harDbCallback = (data, db) => {
  // your code goes here ...
  return db;
};

/* 
  This is a Express middleware used to call on a specific routes.
  example in db.json
  {
    "/customMiddleware": {
    "_config": true,
    "fetch": "http://jsonplaceholder.typicode.com/users",
    "middlewares": [
      "DataWrapper"
    ]
  }
*/

// You can create n number of middlewares like this and can be used in any routes as mentioned in above example.
exports.DataWrapper = (req, res, next) => {
  res.locals.data = {
    status: "Success",
    message: "Retrieved Successfully",
    result: res.locals.data,
  };
  next();
};

exports.CustomLog = (req, res, next) => {
  console.log(new Date());
  next();
};

// Access store value
exports.GetStoreValue = (req, res, next) => {
  const store = res.locals.getStore();
  res.locals.data = "The store value is : " + store.data;
  next();
};
```

### Injectors

- Create `injectors.json`.
- Set custom Injectors path using `mock-server.settings.paths.injectors`.
- Injectors helps to inject a route config to the routes in the `db.json`.
- Example:

`injectors.json`

```jsonc
[
  {
    "routes": ["/injectors/:id"],
    "description": "This description is injected using the injectors by matching the pattern '/injectors/:id'."
  },
  {
    "routes": ["/injectors/1"],
    "override": true,
    "mock": "This data is injected using the injectors by matching the pattern '/injectors/1'."
  },
  {
    "routes": ["/injectors/2"],
    "override": true,
    "mock": "This data is injected using the injectors by matching the pattern '/injectors/2'."
  },
  {
    "routes": ["/injectors/:id"],
    "override": true,
    "exact": true,
    "statusCode": 200,
    "mock": "This data is injected using the injectors by exactly matching the route '/injectors/:id'."
  },
  {
    "routes": ["/(.*)"],
    "description": "This Description is injected using the injectors. Set 'Override' flag to true to override the existing config values."
  },
  {
    "routes": ["/(.*)"],
    "override": true,
    "middlewares": ["...", "CustomLog"]
  }
]
```

### Route Rewriters

- Create `rewriters.json`.
- Set custom Rewriters path using `mock-server.settings.paths.rewriter`.
- This helps to create a custom route.
- Example:

`rewriters.json`

```jsonc
{
  "/posts/:id/comments": "/fetch/comments/proxy?postId=:id",
  "/:resource/:id/show": "/:resource/:id",
  "/posts/:category": "/posts?category=:category",
  "/articlesS?id=:id": "/posts/:id"
}
```

To mount on another endpoint you can use `mock-server.settings.base`. Alternatively you can also rewrite the url as follows

```jsonc
{
  "/api/*": "/$1"
}
```

Now you can access resources using /api/

```txt
  /api/posts # → /posts
  /api/posts/1  # → /posts/1
```

### Static File Server

- Create a folder `public` in the project root folder.
- Now when you start the server, all files under this folder will be automatically hosted in the file server.
- Set Custom directory using `mock-server.settings.paths.staticDir`

## **Documentation**

- ReadMe - [https://r35007.github.io/Mock-Server/](https://r35007.github.io/Mock-Server/)

## Author

**Sivaraman** - [sendmsg2siva.siva@gmail.com](sendmsg2siva.siva@gmail.com)

- _GitHub_ - [https://github.com/R35007/Mock-Server](https://github.com/R35007/Mock-Server)

## License

MIT
