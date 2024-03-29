/* eslint-disable @typescript-eslint/naming-convention */
// Install - npm install @r35007/mock-server

const { MockServer, watcher, chalk } = require("@r35007/mock-server");
const config = require("../.mockserverrc.js");

const mockServer = MockServer.Create(config);

const startServer = async () => {
  await mockServer.launchServer(config.db, {
    injectors: config.injectors,
    middlewares: config.middlewares,
    rewriters: config.rewriters,
    store: config.store,
  });
};

startServer().then(() => {
  const watch = watcher.watch(mockServer.config.root);

  // Restart server on change
  watch.on("change", async (changedPath) => {
    process.stdout.write(chalk.yellowBright(changedPath) + chalk.gray(" has changed, reloading...\n"));
    if (!mockServer.server) return; // return if no server to stop
    await MockServer.Destroy(mockServer);
    await startServer();
  });
});
