const http = require("http");
const app = require("./app");
const config = require("./config");
const { initSocket } = require("./socket");

const server = http.createServer(app);

initSocket(server);

server.listen(config.port, () => {
  console.log(`Server berjalan di port ${config.port}`);
});