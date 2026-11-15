/* API local: consulta y registro de reservas en un archivo JSON. */
"use strict";

const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const DATA_FILE = path.join(__dirname, "..", "reservas.json");

const TARIFAS = {
    voley: { dia: 30, noche: 40 },
    fulbito: { dia: 45, noche: 60 }
};
const HORA_APERTURA = 8;
const HORA_NOCHE = 18;
const HORA_CIERRE = 23;

function readReservations() {
    try {
        if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf8");
        return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    } catch (error) {
        console.error("Error leyendo reservas.json:", error);
        throw new Error("No se pudo leer el archivo de reservas.");
    }
}

function writeReservations(reservations) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(reservations, null, 4), "utf8");
}

function calculateServerTotal(disciplina, horaInicio, horaFin) {
    const inicio = Number(horaInicio.slice(0, 2));
    const fin = Number(horaFin.slice(0, 2));
    let total = 0;
    for (let hora = inicio; hora < fin; hora++) {
        total += hora < HORA_NOCHE ? TARIFAS[disciplina].dia : TARIFAS[disciplina].noche;
    }
    return { horas: fin - inicio, total };
}

function validTime(value) {
    return typeof value === "string" && /^([01]\d|2[0-3]):00$/.test(value);
}

router.get("/", (req, res) => {
    try {
        res.json(readReservations());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/", (req, res) => {
    const data = req.body || {};
    const required = ["nombre", "telefono", "disciplina", "fecha", "horaInicio", "horaFin"];
    if (required.some(field => !String(data[field] || "").trim())) {
        return res.status(400).json({ error: "Completa todos los campos obligatorios." });
    }
    if (!Object.prototype.hasOwnProperty.call(TARIFAS, data.disciplina)) {
        return res.status(400).json({ error: "La disciplina seleccionada no es válida." });
    }
    if (data.consentimiento !== true) {
        return res.status(400).json({ error: "Debes aceptar el tratamiento de datos para registrar la reserva." });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.fecha)) {
        return res.status(400).json({ error: "La fecha de reserva no es válida." });
    }
    if (!validTime(data.horaInicio) || !validTime(data.horaFin)) {
        return res.status(400).json({ error: "El horario seleccionado no es válido." });
    }

    const inicio = Number(data.horaInicio.slice(0, 2));
    const fin = Number(data.horaFin.slice(0, 2));
    if (inicio < HORA_APERTURA || fin > HORA_CIERRE || fin <= inicio) {
        return res.status(400).json({ error: "El horario debe estar entre las 08:00 y las 23:00." });
    }

    try {
        const reservations = readReservations();
        const conflict = reservations.some(item => {
            if (item.disciplina !== data.disciplina || item.fecha !== data.fecha) return false;
            const oldStart = Number(item.horaInicio.slice(0, 2));
            const oldEnd = Number(item.horaFin.slice(0, 2));
            return inicio < oldEnd && fin > oldStart;
        });
        if (conflict) return res.status(409).json({ error: "Ese horario ya fue reservado. Selecciona otro." });

        // El servidor calcula el precio para no confiar en un total enviado desde el navegador.
        const amount = calculateServerTotal(data.disciplina, data.horaInicio, data.horaFin);
        const reservation = {
            codigo: `FC-${Date.now()}`,
            nombre: String(data.nombre).trim().slice(0, 80),
            telefono: String(data.telefono).trim().slice(0, 15),
            correo: String(data.correo || "").trim().slice(0, 100),
            disciplina: data.disciplina,
            fecha: data.fecha,
            horaInicio: data.horaInicio,
            horaFin: data.horaFin,
            horas: amount.horas,
            total: amount.total,
            consentimiento: true,
            comprobanteAdjunto: Boolean(data.comprobanteAdjunto),
            estado: "Pendiente",
            creadoEn: new Date().toISOString()
        };
        reservations.push(reservation);
        writeReservations(reservations);
        return res.status(201).json(reservation);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "No se pudo guardar la reserva." });
    }
});

module.exports = router;
