const { MockServer } = require("@r35007/mock-server");

const mockServer = MockServer.Create({ root: __dirname });
const app = mockServer.app;

mockServer.setData({
  injectors: "./injectors.json",
  middlewares: "./middlewares.js",
  store: "./store.json",
});

const rewriter = mockServer.rewriter("./rewriters.json");
const defaultsMiddlewares = mockServer.defaults();
const resources = mockServer.resources("./db.json");
const homePage = mockServer.homePage();

app.use(rewriter);
app.use(defaultsMiddlewares);
app.use(resources.router);
app.use(homePage);
app.use(mockServer.pageNotFound);
app.use(mockServer.errorHandler);

mockServer.startServer();