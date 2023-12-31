/* eslint-disable @typescript-eslint/naming-convention */
// Install - npm install @r35007/mock-server

const { MockServer, watcher, chalk } = require("@r35007/mock-server");

const mockServer = MockServer.Create();

const startServer = () => mockServer.launchServer("./db.json", {});

startServer().then(() => {
  const watch = watcher.watch([
    mockServer.config.root,
    // ... provide your custom file or folder path to watch for changes
  ]);

  // Restart server on change
  watch.on("change", async (changedPath) => {
    process.stdout.write(chalk.yellowBright(changedPath) + chalk.gray(" has changed, reloading...\n"));
    if (!mockServer.server) return; // return if no server to stop
    await MockServer.Destroy(mockServer);
    await startServer();
  });
});
