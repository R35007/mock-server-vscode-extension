const { MockServer } = require("@r35007/mock-server");
const path = require("path");

const startServer = async () => {
  const mockServer = MockServer.Create({ root: __dirname, quiet: true });
  await mockServer.launchServer("../db.json", {
    injectors: "../injectors.json",
    middlewares: "../middleware.js",
    rewriters: "../rewriters.json",
    store: "../store.json",
  });
}

startServer().then(() => {
  const watch = MockServer.watcher.watch([
    path.resolve(__dirname, "../db.json"),
    path.resolve(__dirname, "../injectors.json"),
    path.resolve(__dirname, "../middleware.js"),
    path.resolve(__dirname, "../rewriters.json"),
    path.resolve(__dirname, "../store.json")
  ]);

  watch.on('change', async () => {
    await MockServer.Destroy();
    await startServer();
  });
});
