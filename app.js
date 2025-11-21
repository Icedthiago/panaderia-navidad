import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Necesario porque __dirname no existe en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 3000;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function serveStatic(filePath, res) {
  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 - Not Found");
      return;
    }

    if (stats.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("500 - Internal Server Error");
        return;
      }

      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    });
  });
}

const server = http.createServer((req, res) => {
  const safePath = path
    .normalize(decodeURIComponent(req.url))
    .replace(/^\.+/, "");

  let requested = safePath.split("?")[0];
  if (requested === "/" || requested === "") requested = "/index.html";

  const filePath = path.join(__dirname, requested);
  serveStatic(filePath, res);
});

// ----------------------------
//   EXPRESS + POSTGRES
// ----------------------------

import express from "express";
import pkg from "pg";
import cors from "cors";

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

// CONEXIÓN A POSTGRESQL
const pool = new Pool({
  user: "root",
  host: "dpg-d4fve0efu37c739k38m0-a.oregon-postgres.render.com",
  database: "panaderia_navidena",
  password: "K4kspDfnESIP2gSkmCcWyqBgw8SpFRgG",
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

// RUTA DE PRUEBA
app.get("/api", (req, res) => {
  res.send("Servidor funcionando con PostgreSQL");
});

// INICIAR EXPRESS
app.listen(4000, () => {
  console.log("API corriendo en http://localhost:4000");
});

// INICIAR SERVIDOR DE ARCHIVOS
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});