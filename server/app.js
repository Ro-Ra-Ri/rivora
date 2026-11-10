const express = require("express");
const cors = require("cors");
const config = require("./config");
const routes = require("./routes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(cors({ origin: config.clientUrls }));
app.use(express.json());

app.use("/api", routes);

// Kalau alamat tidak cocok dengan route mana pun
app.use((req, res) => {
  res.status(404).json({
    message: "Endpoint tidak ditemukan",
    code: "NOT_FOUND",
  });
});

app.use(errorHandler);

module.exports = app;