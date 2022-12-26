/* eslint-disable @typescript-eslint/naming-convention */
// Install - npm install @r35007/mock-server
// Run in Terminal - mock-server

module.exports = {
  root: __dirname, // or process.cwd() // Root path of the server. All fetch paths in db data will be relative to this path
  db: "./db.json", // Path to database
  injectors: "./injectors.json", // Path to injectors
  middlewares: "./middlewares.js", // Path to middlewares
  rewriters: "./rewriters.json", // Path to rewriters
  store: "./store.json",// Path to store
  snapshots: "snapshots", // Path to snapshots
  static: "public", // Path to host a static files. Set to empty string to avoid hosting default public folder 

  port: 3000, // Set Port to 0 to pick a random available port.
  host: "localhost", // Set host to empty string to set your local ip address
  base: "", // Mount db on a base url
  id: "id", // Set db id attribute.
  dbMode: "mock", // Give one of 'multi', 'fetch', 'mock'
  reverse: false, // Generate routes in reverse order
  logger: true, // Enable api logger
  noCors: false, // Disable CORS
  noGzip: false, // Disable data compression
  readOnly: false, // Allow only GET calls
  bodyParser: true, // Enable body-parser
  cookieParser: true, // Enable cookie-parser
  quiet: false, // Prevent from console logs
  log: false, // Prevent from setter logs
  watch: true, // Watch for changes
  homePage: true, // Enable Home page

  // These below options are only used in vscode extension api and not in cli
  environment: "env", // Path to environment data files
  duplicates: false, // Enable duplicates
  watchFiles: [], // Paths to watch files
  ignoreFiles: [], // Paths to ignore file changes
  openInside: true, // Open Home page inside vscode
  showInfoMsg: true, // Show vscode notification on start and stop of server
  statusBar: { // Status bar settings
    position: "Right",
    priority: "0",
    show: "true"
  }
};
