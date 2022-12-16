// Go to terminal and run
// mock-server --config=./mock-server-config.js

module.exports = {
  port: 3000, // Set Port to 0 to pick a random available port.
  host: "localhost", // Set host to empty string to set your local ip address
  root: __dirname, // or process.cwd() // Root path of the server. All paths refereed in db data will be relative to this path
  base: "", // Mount db on a base url
  id: "id", // Set db id attribute.
  dbMode: 'mock', // Give one of 'multi', 'fetch', 'mock'
  static: "public", // Path to host a static files. Set to empty string to avoid hosting default public folder 
  reverse: false, // Generate routes in reverse order
  logger: true, // Enable api logger
  noCors: false, // Disable CORS
  noGzip: false, // Disable data compression
  readOnly: false, // Allow only GET calls
  bodyParser: true, // Enable body-parser
  cookieParser: true, // Enable cookie-parser
  quiet: false, // Prevent from console logs
  log: false, // Prevent from setter logs


  // Config specific to CLI commands
  db: "./db.json",
  injectors: "./injectors.json",
  middlewares: "./middlewares.js",
  rewriters: "./rewriters.json",
  store: "./store.json",
  watch: false
};
