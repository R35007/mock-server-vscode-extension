# Mock Server[](#mock-server) [![](https://img.shields.io/npm/l/@r35007/mock-server?color=blue)](https://img.shields.io/npm/l/@r35007/mock-server?color=blue) [![](https://img.shields.io/npm/types/@r35007/mock-server)](https://img.shields.io/npm/types/@r35007/mock-server)

Get a full REST API with **zero coding** in **less than 30 seconds** (seriously)

Created with <3 for front-end developers who need a quick back-end for prototyping and mocking.

This Extension is built upon node package [@r35007/mock-server](https://www.npmjs.com/package/@r35007/mock-server).

## Getting started

- Install the Extension.
- Right click on the workspace folder and select `MockServer` -> `Create db.json` from the context.
- From Command Palette (`(Ctrl/Cmd)+Shift+P`) type mock and select `MockServer: Start Server` (`Alt+Enter`)
- To view the List of resources go to Command `MockServer: Home Page` or open any browser and hit the localhost url

![Preview](https://github.com/R35007/mock-server-vscode-extension/assets/23217228/b8096556-4be3-4bc9-b867-3eafc3a3399f)

## Make Request

- Once the Server is started we can check the request using `MockServer: Make Request` command in command pallet.

![Preview](https://github.com/R35007/mock-server-vscode-extension/assets/23217228/be28a8cc-dd03-4e97-b455-6ed6f82c03b8)

## Serve Static Files

- Right click on any file or folder and select `Serve Static Files` from the Mock server context menu.
- This will serve the active folder as a server static files.
- We can also set a custom static folder path in `mock-server.settings.paths.static`.

![Preview](https://github.com/R35007/mock-server-vscode-extension/assets/23217228/701b2a8d-529e-4d1b-b718-859145d298bf)

## Start Mock Server in Terminal

- We need to install `npm install -g @r35007/mock-server` to make this command work.
- From Command Palette (`(Ctrl/Cmd)+Shift+P`) type mock and select `MockServer: Start Server in Terminal`
- This starts the mock server in terminal.

![Preview](https://github.com/R35007/mock-server-vscode-extension/assets/23217228/64077916-7ac8-4356-8074-62107be8a969)

## Custom Server script

- Install Mock Server `npm install -g @r35007/mock-server`.
- Right click on the vscode explorer and select `Mock Server` -> `Create Server.js`.
- This create a sample `server.js` file
- Now go to terminal and give `node server.js` to start the mock server.
- Please refer [@r35007/mock-server](https://r35007.github.io/Mock-Server/) for more api documentation.

![Preview](https://github.com/R35007/mock-server-vscode-extension/assets/23217228/5963902a-2b44-4402-9266-051e34286a68)

## Commands

### `Start or Restart Server`

This command Starts the Mock Server or Restart if its already running.

- From Command Palette (`(Ctrl/Cmd)+Shift+P`) type mock and select `MockServer: Start Server`
- Use `Alt+Enter` shortcut to start or restart the server.
- Click the `Mock It` icon at the right corner of the statusbar
- Server will automatically will restarted if any changes are made.
- You can also manually restart the server bu giving the same `MockServer: Start Server` Command

### `Stop or Reset Server`

This command Stops the current running Mock Server or Reset Mock Server instance if any error occur.

- From Command Palette (`(Ctrl/Cmd)+Shift+P`) type mock and select `MockServer: Stop or Reset Server`.
- ShortCut using `Shift+Alt+Enter`

### `Set Port`

This command helps to set the port of the server in setting `mock-server.settings.port`.

- From Command Palette (`(Ctrl/Cmd)+Shift+P`) type mock and select `MockServer: Set Port`.
- This command helps prompts and sets the custom port to start the server.

### `Set as Server Root Folder`

This command sets current folder as the server root folder in setting `mock-server.settings.paths.root`.

- From Command Palette (`(Ctrl/Cmd)+Shift+P`) type mock and select `MockServer: Set as Server Root Folder`.
- This command helps sets the current selected file or folder as a Server root folder.

### `Switch Environment`

Helps to work in multiple data environments.

- Create `env` folder in root.
- Keep you different db data of extension `.json`, `.jsonc` or `.har`
- From Command Palette (`(Ctrl/Cmd)+Shift+P`) type mock and select `MockServer: Switch Environment`
- Use`Alt+S` shortcut to switch environment.
- This path can be modified using the settings `mock-server.settings.paths.environment`.
- Now all the `.json`, `.jsonc`, `.har`, `.js` files will be listed down. You can pick a data to launch the server.
- You can create a `env-config.json` file to create a custom database environment.
  For Example: `env/env-config.json`
  ```json
  // These names will be listed in the environment pick list
  {
    "Your Environment Name": {
      "db": "./testDb.json",
      "injectors": "./testInjectors.json",
      "middlewares": "./testMiddlewares.js",
      "description": "Your description here" // This description will be shown in the switch environment pick list
    },
    "Your New  Environment Name": {
      "db": ["./testDb2.json", "./testDb2.json"], // Can also provide multiple paths
      "injectors": [],
      "middlewares": []
    }
  }
  ```
  > Note: All the paths given in the `env-config.json` will be relative to the path given in `mock-server.settings.paths.environment`. File or Folder name with `injectors` and `middlewares` will not list in the pick list.

### `Get Db Snapshot`

- `MockServer: Get Db Snapshot` Command helps to save the current db data snapshot.

### `Transform to Mock Server Db`

- `MockServer: Transform to Mock Server Db` Command helps to generate a valid routes.
- This also helps to convert the `.har` or `kibana` json to a valid `db.json` file.

### `Open Home Page`

- `MockServer: Open Home Page` Command opens a new window which shows you all the list of resources.
- This window also helps to update or add new resources in runtime.
- It can also be opened in a separate browser window.
  ![HomePage](https://user-images.githubusercontent.com/23217228/206558356-83616823-d43a-4196-94d7-72332eb964a6.png)

## DB

- Create `db.json`
- Set custom Db path using setting `mock-server.settings.paths.db`.
- This path can be either file path or folder path or also a server path.
- If provided as a folder path, then all the `.json` files will be joined together and starts the server.
- Example 1 : `db.json`.

  ```json
  {
    "posts": [{ "id": 1, "title": "mock-server", "author": "r35007" }],
    "comments": [{ "id": 1, "body": "some comment", "postId": 1 }],
    "profile": { "name": "r35007" }
  }
  ```

- Example 2 : `./folder`.
- Example 3 : `https://jsonplaceholder.typicode.com/db`.
- Example 4 : `db.js`.

  ```js
  module.exports = async (mockServer, env) => {
    return {
      posts: [{ id: 1, title: "mock-server", author: "r35007" }],
      comments: [{ id: 1, body: "some comment", postId: 1 }],
      profile: { name: "r35007" },
    };
  };
  ```

## Middleware

- Create `middlewares.js`
- Set custom Middleware path using setting `mock-server.settings.paths.middlewares`.
- Middlewares must be of a type `.js` file.
- Callback method to generate routes can also be given in this `middlewares.js`.
- Example:

`middlewares.js`

```js
const harEntryCallback = (entry, routePath, routeConfig) => {
  return { [routePath]: routeConfig };
};
const kibanaHitsCallback = (hit, routePath, routeConfig) => {
  return { [routePath]: routeConfig };
};
const harDbCallback = (data, db) => {
  return db;
};
const kibanaDbCallback = (data, db) => {
  return db;
};

const logPath = (req, res, next) => {
  console.log(req.path);
  next();
};

// You can create n number of middlewares like this and can be used in any routes as a middleware.
const DataWrapper = (req, res, next) => {
  res.locals.data = {
    status: "Success",
    message: "Retrieved Successfully",
    result: res.locals.data,
  };
  next();
};

const CustomLog = (req, res, next) => {
  console.log(new Date());
  next();
};

// Access store value
const GetStoreValue = (req, res, next) => {
  const store = res.locals.getStore();
  res.locals.data = "The store value is : " + store.data;
  next();
};

module.exports = async (mockServer, env) => {
  const { app, routes, data, getDb, getStore } = mockServer || {};
  const { config, db, injectors, middlewares, rewriters, store } = data || {};
  // Your Global middleware logic here before setting default middlewares by the MockServer

  return {
    globals: [logPath],
    harEntryCallback,
    harDbCallback,
    kibanaDbCallback,
    DataWrapper,
    CustomLog,
    GetStoreValue,
  };
};
```

## Injectors

- Create `injectors.json`.
- Set custom Injectors path using `mock-server.settings.paths.injectors`.
- Injectors helps to inject a route config to the routes in the `db.json`.
- Example: `injectors.json`

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

## Route Rewriters

- Create `rewriters.json`.
- Set custom Rewriters path using `mock-server.settings.paths.rewriter`.
- This helps to create a custom route.
- Example: `rewriters.json`

  ```jsonc
  {
    "/posts/:id/comments": "/fetch/comments/proxy?postId=:id",
    "/:resource/:id/show": "/:resource/:id",
    "/posts/:category": "/posts?category=:category",
    "/articlesS?id=:id": "/posts/:id"
  }
  ```

- To mount on another endpoint you can use `mock-server.settings.base`. Alternatively you can also rewrite the url as follows

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

## Static File Server

- Create a folder `public` in the project root folder.
- Now when you start the server, all files under this folder will be automatically hosted in the file server.
- Set Custom directory using `mock-server.settings.paths.static`

## Documentation

- ReadMe - [https://r35007.github.io/Mock-Server/](https://r35007.github.io/Mock-Server/)

## Author

Sivaraman - [sendmsg2siva.siva@gmail.com](sendmsg2siva.siva@gmail.com)

- _GitHub_ - [https://github.com/R35007/Mock-Server](https://github.com/R35007/Mock-Server)

## License

MIT
