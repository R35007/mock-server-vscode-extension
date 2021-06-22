import { UserRoutes } from "@r35007/mock-server/dist/model";
import { generateMockID } from "./enum";
import { Prompt } from "./prompt";
import { Settings } from "./Settings";
import { StatusbarUi } from "./StatusBarUI";
import { Utils } from "./utils";

export default class VSMockServer extends Utils {
  constructor() {
    super();
    this.output.appendLine("\nMock Server Server Initiated");
    StatusbarUi.init();
  }

  generateMockFromHAR = async () => {
    this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Mock Generation initiated`);
    const writable = await this.getWritable([".json"], generateMockID);
    if (writable) {

      this.output.appendLine(`[${new Date().toLocaleTimeString()}] Mock Generation running...`);
      const { editorText, fileName, editor, document, textRange } = writable;
      try {
        const config = {
          routesToLoop: Settings.routesToLoop,
          routesToGroup: Settings.routesToGroup
        }
        const mock = this.mockServer.transformHar(document.uri.fsPath, config, Settings.entryCallback, Settings.finalCallback);
        this.writeFile(JSON.stringify(mock, null, "\t"), fileName, "Mock generated Successfully", editor, document, textRange);
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Mock generated Successfully`);
      } catch (err) {
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Failed to generate mock`);
        this.output.appendLine(err);
        Prompt.showPopupMessage(`Failed to generate mock. \n${err.message}`, "error");
      }
    }
  };

  startServer = async (txt: string) => {
    Settings.showPathLog();
    this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Server ${txt} initiated`);
    try {
      if (Settings.mockPath.length && !this.mockServer.isServerStarted) {
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] Server ${txt}ing...`);
        StatusbarUi.working(`${txt}ing...`);

        const mock = this.getJSON(Settings.mockPath) as UserRoutes;
        this.mockServer.setData(mock, Settings.config, Settings.middlewarePath, Settings.injectorsPath, Settings.store);
        await this.mockServer.launchServer();
        this.restartOnChange(this.restartServer);


        const statusMsg = `Server is ${txt}ed at port : ${Settings.port}`;
        StatusbarUi.stopServer(150, Settings.port, () => Prompt.showPopupMessage(statusMsg, "info"));
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Server is ${txt}ed at port : ${Settings.port}`);
      } else {
        const statusMsg = `'mock-server.settings.paths.mockPath' - Please provide a valid path here`;
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] ${statusMsg}`);
        Prompt.showPopupMessage(statusMsg, "error");
        StatusbarUi.startServer(0, () => Prompt.showPopupMessage(statusMsg, "error"));
      }
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
      if (this.mockServer.isServerStarted) {
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
    if (this.mockServer.isServerStarted) {
      try {
        this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Server Stop initiated`);
        await this.mockServer.stopServer();
        this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Server Stopped`);
        StatusbarUi.startServer(150);
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
      if (this.mockServer.isServerStarted) this.mockServer.stopServer();
      this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Reset initiated`);
      this.mockServer.resetServer();
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] Resetting`);
      Prompt.showPopupMessage("Server Reset Done.", "info");
      StatusbarUi.startServer(150);
    } catch (err) {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] [Done] failed to reset`);
      Prompt.showPopupMessage("Server Reset Failed.", "error");
      this.mockServer.isServerStarted
      ? StatusbarUi.stopServer(0, Settings.port)
      : StatusbarUi.startServer(150);
      this.output.appendLine(err);
    }
  }

  switchEnvironment = async () => {
    this.output.appendLine(`\n[${new Date().toLocaleTimeString()}] [Running] Switch Environment initiated`);
    try {
      this.output.appendLine(`[${new Date().toLocaleTimeString()}] Switching Environment...`);
      if (Settings.envPath.length) {
        const envList = this.getEnvironmentList();
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
}
