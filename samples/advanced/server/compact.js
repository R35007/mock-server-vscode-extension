/* eslint-disable @typescript-eslint/naming-convention */
// Install - npm install @r35007/mock-server

const { MockServer, watcher, chalk } = require("@r35007/mock-server");
const config = require("../.mockserverrc.js");

const mockServer = MockServer.Create(config);

const startServer = async () => {
  const app = mockServer.app;

  mockServer.setData({
    injectors: config.injectors,
    middlewares: config.middlewares,
    store: config.store,
  });

  const rewriter = mockServer.rewriter(config.rewriters);
  const defaultsMiddlewares = mockServer.defaults();
  const resources = mockServer.resources(config.db);
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
  watch.on("change", async () => {
    process.stdout.write(chalk.yellowBright(changedPath) + chalk.gray(" has changed, reloading...\n"));
    if (!mockServer.server) return; // return if no server to stop
    await MockServer.Destroy(mockServer);
    await startServer();
  });
});
