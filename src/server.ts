import { Routes } from "@r35007/mock-server/dist/server/model";
import { GENERATE_ROUTES } from './enum';
import { Prompt } from "./prompt";
import { Settings } from "./Settings";
import { StatusbarUi } from "./StatusBarUI";
import { Utils } from "./utils";
const kill = require('kill-port');

export default class MockServer extends Utils {
  constructor() {
    super();
    this.output.appendLine("\nMock Server Server Initiated");
    StatusbarUi.init();
  }

  generateRoutes = async () => {
    this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Routes Generation initiated`);
    const writable = await this.getWritable([".json"], GENERATE_ROUTES);
    if (writable) {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] Routes Generation running...`);
      const { fileName, editor, document, textRange } = writable;
      try {
        const routes = this.mockServer.getValidRoutes(
          document.uri.fsPath,
          Settings.entryCallback,
          Settings.finalCallback,
          { reverse: Settings.reverse }
        );
        this.cleanRoutes(routes);
        this.writeFile(JSON.stringify(routes, null, "\t"), fileName, "Routes generated Successfully", editor, document, textRange);
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Routes generated Successfully`);
      } catch (err) {
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Failed to generate routes`);
        this.output.appendLine(err);
        Prompt.showPopupMessage(`Failed to generate routes. \n${err.message}`, "error");
      }
    }
  };

  startServer = async (txt: string) => {
    this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Server ${txt} initiated`);
    try {
      const paths = Settings.paths;
      const db = paths.db;
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] Server ${txt}ing...`);
      StatusbarUi.working(`${txt}ing...`);

      const routes = await this.getValidRoutes(db) as Routes;
      this.mockServer.setData(
        routes,
        Settings.config,
        paths.middleware,
        paths.injectors,
        paths.store,
        paths.rewriter
      );
      await this.mockServer.launchServer();
      this.restartOnChange(this.restartServer);

      const statusMsg = `Server is ${txt}ed at port : ${Settings.port}`;
      StatusbarUi.stopServer(150, Settings.port, () => Prompt.showPopupMessage(statusMsg, "info"));
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Server is ${txt}ed at port : ${Settings.port}`);
    } catch (err) {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Server Failed to ${txt}`);
      this.output.appendLine(err);
      const statusMsg = `Server Failed to ${txt}. \n ${err.message}`;
      StatusbarUi.startServer(0, () => Prompt.showPopupMessage(statusMsg, "error"));
    }
  };

  stopServer = async () => {
    this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Server Stop initiated`);
    try {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] Server Stopping`);
      if (this.mockServer.server) {
        StatusbarUi.working("Stopping...");
        await this.mockServer.stopServer();
        this.stopWatchingChanges();
        StatusbarUi.startServer(150, () => Prompt.showPopupMessage("Server is Stopped", "info"));
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Server is Stopped`);
      } else {
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] No Server to Stop`);
        Prompt.showPopupMessage("No Server to Stop", "error");
        StatusbarUi.stopServer(0, Settings.port, () => Prompt.showPopupMessage("No Server to Stop", "error"));
      }
    } catch (err) {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Server Failed to Stop`);
      this.output.appendLine(err);
      const statsMsg = `Server Failed to Stop. \n${err.message}`;
      StatusbarUi.stopServer(0, Settings.port, () => Prompt.showPopupMessage(statsMsg, "error"));
    }
  };

  restartServer = async () => {
    if (this.mockServer.server) {
      try {
        this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Server Stop initiated`);
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] Server Stopping`);
        StatusbarUi.working("Stopping...");
        await this.mockServer.stopServer();
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Server Stopped`);
        this.startServer("Restart");
      } catch (err) {
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Server Failed to Stop`);
        StatusbarUi.stopServer(0, Settings.port);
        this.output.appendLine(err);
      }
    } else {
      this.startServer("Start");
    }
  };

  resetServer = async () => {
    try {
      if (this.mockServer.server) await this.mockServer.stopServer();
      this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Reset initiated`);
      this.mockServer.resetServer();
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Resetting`);
      Prompt.showPopupMessage("Server Reset Done.", "info");
      StatusbarUi.startServer(150);
    } catch (err) {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] failed to reset`);
      Prompt.showPopupMessage("Server Reset Failed.", "error");
      this.mockServer.server
        ? StatusbarUi.stopServer(0, Settings.port)
        : StatusbarUi.startServer(150);
      this.output.appendLine(err);
    }
    await kill(Settings.port, 'tcp');
  }

  switchEnvironment = async () => {
    this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Switch Environment initiated`);
    try {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] Switching Environment...`);
      const envDir = Settings.paths.envDir;
      if (envDir?.length) {
        const envList = this.getEnvironmentList(envDir);
        if (envList && envList.length) {
          const environmentList = [...new Set(["none", ...envList.map((e) => e.fileName)])];

          // making the selected environment to appear in first of the list
          const selectedEnvIndex = environmentList.findIndex((e) => e === Settings.environment.toLowerCase());
          if (selectedEnvIndex >= 0) {
            environmentList.splice(selectedEnvIndex, 1);
            environmentList.unshift(Settings.environment.toLowerCase());
          } else {
            Settings.environment = "none";
          }

          const env = await Prompt.getEnvironment(environmentList);
          if (env) {
            this.environment = env.toLowerCase();
            this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Environment Switched to ${this.environment}`);
            this.restartServer();
          }
        } else {
          this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] No Environment Found`);
          Prompt.showPopupMessage("No Environment Found", "error");
        }
      } else {
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] 'mock-server.settings.paths.envPath' - Please provide a valid path here`);
        Prompt.showPopupMessage(`'mock-server.settings.paths.envPath' - Please provide a valid path here`, "error");
      }
    } catch (err) {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Something went wrong`);
      this.output.appendLine(err);
      Prompt.showPopupMessage(`Something went wrong`, "error");
    }
  };

  getDbSnapshot = async () => {
    this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Db Snapshot initiated`);
    const writable = await this.getWritable([".json"], GENERATE_ROUTES);
    if (writable) {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] Getting Db Snapshot..`);
      const { fileName, editor, document, textRange } = writable;
      try {
        const snapShot = JSON.parse(JSON.stringify(this.mockServer.routes));
        this.cleanRoutes(snapShot);
        this.writeFile(JSON.stringify(snapShot, null, "\t"), fileName, "Db Snapshot retrieved Successfully", editor, document, textRange);
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Db Snapshot retrieved Successfully`);
      } catch (err) {
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Failed to get Db Snapshot`);
        this.output.appendLine(err);
        Prompt.showPopupMessage(`Failed to get Db Snapshot. \n${err.message}`, "error");
      }
    }
  };
}
