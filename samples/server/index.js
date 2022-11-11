const { MockServer, watcher } = require("@r35007/mock-server");

const mockServer = MockServer.Create({ root: __dirname });

const startServer = async () => {
  await mockServer.launchServer("../db.json", {
    injectors: "../injectors.json",
    middlewares: "../middleware.js",
    rewriters: "../rewriters.json",
    store: "../store.json",
  });
};

startServer().then(() => {
  // watch paths will be relative to the process.cwd()
  const watch = watcher.watch("./");

  // Restart server on change
  watch.on('change', async () => {
    await MockServer.Destroy(mockServer);
    await startServer();
  });
});
