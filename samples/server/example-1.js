/* eslint-disable @typescript-eslint/naming-convention */
// Install - npm install @r35007/mock-server

const path = require("path");
const { MockServer } = require("@r35007/mock-server");
// const MockServer = require("@r35007/mock-server").default; // For default import

const config = {
  root: path.resolve(__dirname, "../"), // All fetch paths will be relative to this path
  port: 3000, // Set Port to 0 to pick a random available port. default: 3000
  host: "localhost", // Set empty string to set your Local Ip Address 
  quiet: false, // Set to true to suppress console logs
  log: false // Set to true to see setter logs. If quiet is false the we cant see the setter logs.
};
const mockServer = MockServer.Create(config);

const app = mockServer.app;

// Sets global injectors, middlewares, store and rewriters
mockServer.setData({
  injectors: "./injectors.json",
  middlewares: "./middlewares.js",
  store: "./store.json",
}); // pass mockServer instance to use it in middleware.js method

// Make sure to use this at first, before all the resources
const rewriter = mockServer.rewriter("./rewriters.json");
app.use(rewriter);

// Returns the default middlewares
const defaultsMiddlewares = mockServer.defaults();
app.use(defaultsMiddlewares);

// add your authorization logic here
const isAuthorized = (_req) => true;

// Custom Middleware
app.use((req, res, next) => {
  if (isAuthorized(req)) return next(); // continue to Mock Server router
  res.sendStatus(401);
});

// Custom Routes
// This route will not be listed in Home Page.
app.get("/echo", (req, res) => res.jsonp(req.query));

// Creates resources and returns the express router
const resources = mockServer.resources("./db.json");

resources.create("/todos", (req, res, next) => { next(); }) // /todos will be added to existing db
  .send({ userId: 1, id: 1, title: "Marvel", completed: false })
  .delay(1000) // in milliseconds
  .done(); // make sure to call done method at last to complete the route configuration

app.use(resources.router);

// Create the Mock Server Home Page
const homePage = mockServer.homePage();
app.use(homePage);

app.use(mockServer.pageNotFound); // Middleware to return `Page Not Found` as response if the route doesn't match
app.use(mockServer.errorHandler); // Default Error Handler

mockServer.startServer();
// mockServer.startServer(4000, "localhost"); // can also set port and host here

// or
// You can also run thru CLI command

// mock-server --watch --db=db.json --md=middleware.js --in=injectors.json --rw=rewrites.json --st=store.json
