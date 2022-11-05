const { MockServer } = require("@r35007/mock-server");

const mockServer = MockServer.Create({ root: __dirname });

mockServer.launchServer("./db.js", {
  injectors: "./injectors.json",
  middlewares: "./middleware.js",
  rewriters: "./rewriters.json",
  store: "./store.json",
});