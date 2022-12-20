/* eslint-disable @typescript-eslint/naming-convention */
// Install - npm install @r35007/mock-server

const path = require("path");
const { MockServer, watcher } = require("@r35007/mock-server");

const mockServer = MockServer.Create({ root: path.resolve(__dirname, "../") });

const startServer = async () => {
  const app = mockServer.app;
  
  mockServer.setData({
    injectors: "./injectors.json",
    middlewares: "./middlewares.js",
    store: "./store.json",
  });
  
  const rewriter = mockServer.rewriter("./rewriters.json");
  const defaultsMiddlewares = mockServer.defaults();
  const resources = mockServer.resources("./db.json");
  const homePage = mockServer.homePage();
  
  app.use(rewriter);
  app.use(defaultsMiddlewares);
  app.use(resources.router);
  app.use(homePage);
  app.use(mockServer.pageNotFound);
  app.use(mockServer.errorHandler);
  
  await mockServer.startServer();
};

startServer().then(() => {
  const watch = watcher.watch(mockServer.config.root);

  // Restart server on change
  watch.on('change', async () => {
    if (!mockServer.server) return; // return if no server to stop
    await MockServer.Destroy(mockServer);
    await startServer();
  });
});

