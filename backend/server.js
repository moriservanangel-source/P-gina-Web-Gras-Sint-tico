/* Servidor local de FortalezaClub. */
"use strict";

const express = require("express");
const path = require("path");
const reservasApi = require("./routes/api");

const app = express();
const PORT = process.env.PORT || 3000;
const frontendPath = path.join(__dirname, "..", "frontend");

app.use(express.json({ limit: "100kb" }));
app.use(express.static(frontendPath, { index: false }));
app.use("/api/reservas", reservasApi);

// La ruta principal utiliza el nombre del proyecto en la URL local.
app.get("/", (req, res) => {
    res.redirect("/FortalezaClub");
});

app.get(["/FortalezaClub", "/FortalezaClub/"], (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(PORT, () => {
    console.log(`FortalezaClub disponible en http://localhost:${PORT}/FortalezaClub`);
});
