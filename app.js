const http = require('http');
const fs = require('fs');
const path = require('path');
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
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      res.end('404 - Not Found');
      return;
    }

    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end('500 - Internal Server Error');
        return;
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      res.end(data);
    });
  });
}
const server = http.createServer((req, res) => {
  // Prevent path traversal
  const safePath = path.normalize(decodeURIComponent(req.url)).replace(/^\.+/, '');
  let requested = safePath.split('?')[0];
  if (requested === '/' || requested === '') requested = '/index.html';
  const filePath = path.join(__dirname, requested);
  serveStatic(filePath, res);
});
//conexion al servidor post

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
  port: 5432
});

// RUTA DE PRUEBA
app.get("/", (req, res) => {
  res.send("Servidor funcionando ");
});


server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});