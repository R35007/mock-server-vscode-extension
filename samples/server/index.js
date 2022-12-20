/* eslint-disable @typescript-eslint/naming-convention */
// Install - npm install @r35007/mock-server

const path = require("path");
const { MockServer, watcher } = require("@r35007/mock-server");

const mockServer = MockServer.Create({ root: path.resolve(__dirname, "../") });

const startServer = async () => {
  await mockServer.launchServer("./db.json", {
    injectors: "./injectors.json",
    middlewares: "./middleware.js",
    rewriters: "./rewriters.json",
    store: "./store.json",
  });
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
