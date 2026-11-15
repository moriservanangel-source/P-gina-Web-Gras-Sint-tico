/* FortalezaClub - lógica principal del frontend */
"use strict";

const API_URL = "/api/reservas";
const ADMIN_KEY = "FORTALEZA2026"; // Llave visible en el código: solo demostración académica.
const RATES = {
    voley: { day: 30, night: 40 },
    fulbito: { day: 45, night: 60 }
};
const OPEN_HOUR = 8;
const DAY_END_HOUR = 18; // El tramo diurno termina a las 18:00.
const CLOSE_HOUR = 23;   // Última hora reservable: 22:00 a 23:00.

const form = document.querySelector("#form-reserva");
const sportSelect = document.querySelector("#disciplina");
const dateInput = document.querySelector("#fecha");
const startSelect = document.querySelector("#hora-inicio");
const endSelect = document.querySelector("#hora-fin");
const proofInput = document.querySelector("#comprobante");
const previewBox = document.querySelector("#preview-comprobante");
const previewImage = document.querySelector("#imagen-comprobante");
const message = document.querySelector("#mensaje-formulario");
const privacyDialog = document.querySelector("#modal-privacidad");
const consentCheckbox = document.querySelector("#aceptar-datos");
const submitButton = document.querySelector("#enviar-reserva");
const privacyStatus = document.querySelector("#estado-privacidad");
const globalToast = document.querySelector("#notificacion-global");
let privacyAccepted = false;
let toastTimer;
let proofDataUrl = "";
let reservations = [];

function money(value) {
    return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);
}

function todayInPeru() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
}

function createTimeOptions(select, firstHour, lastHour, placeholder) {
    select.innerHTML = "";
    const first = document.createElement("option");
    first.value = "";
    first.textContent = placeholder;
    select.appendChild(first);
    for (let hour = firstHour; hour <= lastHour; hour++) {
        const option = document.createElement("option");
        option.value = `${String(hour).padStart(2, "0")}:00`;
        option.textContent = option.value;
        select.appendChild(option);
    }
}

function loadStartTimes() {
    createTimeOptions(startSelect, OPEN_HOUR, CLOSE_HOUR - 1, "Selecciona hora de inicio");
    endSelect.innerHTML = '<option value="">Selecciona hora de inicio</option>';
    updateSummary();
}

function loadEndTimes() {
    if (!startSelect.value) {
        endSelect.innerHTML = '<option value="">Selecciona hora de inicio</option>';
        updateSummary();
        return;
    }
    const start = Number(startSelect.value.slice(0, 2));
    createTimeOptions(endSelect, start + 1, CLOSE_HOUR, "Selecciona hora de finalización");
    updateSummary();
}

function calculateHours() {
    if (!startSelect.value || !endSelect.value) return 0;
    return Number(endSelect.value.slice(0, 2)) - Number(startSelect.value.slice(0, 2));
}

// Cada bloque de 60 minutos se cobra según la hora en que comienza.
function calculateAmount(sport, startTime, endTime) {
    if (!sport || !startTime || !endTime) return { hours: 0, total: 0, rates: [] };
    const start = Number(startTime.slice(0, 2));
    const end = Number(endTime.slice(0, 2));
    let total = 0;
    const rates = [];
    for (let hour = start; hour < end; hour++) {
        const period = hour < DAY_END_HOUR ? "day" : "night";
        const rate = RATES[sport][period];
        total += rate;
        rates.push({ period, rate });
    }
    return { hours: end - start, total, rates };
}

function updateSummary() {
    const amount = calculateAmount(sportSelect.value, startSelect.value, endSelect.value);
    document.querySelector("#duracion").textContent = `${amount.hours} ${amount.hours === 1 ? "hora" : "horas"}`;
    if (!sportSelect.value) {
        document.querySelector("#precio-hora").textContent = "Según horario";
    } else if (amount.rates.length === 0) {
        document.querySelector("#precio-hora").textContent = `Día ${money(RATES[sportSelect.value].day)} · Noche ${money(RATES[sportSelect.value].night)}`;
    } else {
        const hasDay = amount.rates.some(item => item.period === "day");
        const hasNight = amount.rates.some(item => item.period === "night");
        const labels = [];
        if (hasDay) labels.push(`Día ${money(RATES[sportSelect.value].day)}`);
        if (hasNight) labels.push(`Noche ${money(RATES[sportSelect.value].night)}`);
        document.querySelector("#precio-hora").textContent = labels.join(" + ");
    }
    document.querySelector("#total").textContent = money(amount.total);
}

function overlaps(reservation, sport, date, start, end) {
    if (reservation.disciplina !== sport || reservation.fecha !== date) return false;
    const oldStart = Number(reservation.horaInicio.slice(0, 2));
    const oldEnd = Number(reservation.horaFin.slice(0, 2));
    return start < oldEnd && end > oldStart;
}

async function loadReservations() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("No se pudieron leer las reservas.");
        reservations = await response.json();
        renderAdmin();
    } catch (error) {
        console.error(error);
        reservations = [];
        renderAdmin();
    }
}

function renderAdmin() {
    const tbody = document.querySelector("#tabla-reservas");
    tbody.replaceChildren();
    document.querySelector("#stat-total").textContent = reservations.length;
    document.querySelector("#stat-voley").textContent = reservations.filter(item => item.disciplina === "voley").length;
    document.querySelector("#stat-fulbito").textContent = reservations.filter(item => item.disciplina === "fulbito").length;
    const sum = reservations.reduce((total, item) => total + Number(item.total || 0), 0);
    document.querySelector("#stat-ingresos").textContent = money(sum);

    if (reservations.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 8;
        cell.className = "empty-row";
        cell.textContent = "Todavía no hay reservas registradas.";
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    reservations.forEach(item => {
        const row = document.createElement("tr");
        [item.codigo, item.nombre, item.disciplina.toUpperCase(), item.fecha,
            `${item.horaInicio} - ${item.horaFin}`, item.horas, money(item.total), item.telefono]
            .forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = String(value);
                row.appendChild(cell);
            });
        tbody.appendChild(row);
    });
}

function showMessage(text, type = "") {
    message.textContent = text;
    message.className = `form-message ${type}`;
}

function showToast(text, type = "success") {
    globalToast.textContent = text;
    globalToast.className = `toast-notification ${type}`;
    globalToast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { globalToast.hidden = true; }, 5500);
}

function clearFieldError(field) {
    field.classList.remove("is-invalid");
    field.removeAttribute("aria-invalid");
    const error = field.closest(".field")?.querySelector(".field-error");
    if (error) error.remove();
}

function markFieldError(field, text) {
    field.classList.add("is-invalid");
    field.setAttribute("aria-invalid", "true");
    const wrapper = field.closest(".field");
    if (!wrapper) return;
    let error = wrapper.querySelector(".field-error");
    if (!error) {
        error = document.createElement("small");
        error.className = "field-error";
        wrapper.appendChild(error);
    }
    error.textContent = text;
}

function validateReservationForm() {
    const fields = [
        { element: form.elements.nombre, label: "nombre completo" },
        { element: form.elements.telefono, label: "teléfono" },
        { element: sportSelect, label: "disciplina" },
        { element: dateInput, label: "fecha de reserva" },
        { element: startSelect, label: "hora de inicio" },
        { element: endSelect, label: "hora de finalización" }
    ];
    const missing = [];
    let firstInvalid = null;

    fields.forEach(({ element, label }) => {
        clearFieldError(element);
        if (!String(element.value || "").trim()) {
            markFieldError(element, `Completa ${label}.`);
            missing.push(label);
            firstInvalid ||= element;
        } else if (!element.checkValidity()) {
            markFieldError(element, `Revisa el formato de ${label}.`);
            missing.push(`${label} (formato no válido)`);
            firstInvalid ||= element;
        }
    });

    const email = form.elements.correo;
    clearFieldError(email);
    if (email.value.trim() && !email.checkValidity()) {
        markFieldError(email, "Ingresa un correo electrónico válido.");
        missing.push("correo electrónico válido");
        firstInvalid ||= email;
    }

    if (missing.length) {
        showToast(`Falta completar o corregir: ${missing.join(", ")}.`, "error");
        firstInvalid?.focus();
        firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
        return false;
    }
    return true;
}

async function submitReservation(event) {
    event.preventDefault();
    showMessage("");

    if (!privacyAccepted || !consentCheckbox.checked) {
        showToast("Debes leer y aceptar el aviso de uso de datos personales para enviar tu reserva.", "error");
        document.querySelector("#abrir-privacidad").focus();
        return;
    }
    if (!validateReservationForm()) return;

    const date = dateInput.value;
    const sport = sportSelect.value;
    const hours = calculateHours();
    if (date < todayInPeru()) {
        markFieldError(dateInput, "Selecciona hoy o una fecha futura.");
        showToast("La fecha de reserva no puede ser anterior a hoy.", "error");
        dateInput.focus();
        return;
    }
    if (hours < 1) {
        markFieldError(endSelect, "La hora de finalización debe ser posterior al inicio.");
        showToast("Selecciona un horario válido de al menos una hora.", "error");
        endSelect.focus();
        return;
    }

    const start = Number(startSelect.value.slice(0, 2));
    const end = Number(endSelect.value.slice(0, 2));
    if (reservations.some(item => overlaps(item, sport, date, start, end))) {
        markFieldError(startSelect, "Este horario ya está ocupado.");
        markFieldError(endSelect, "Selecciona otro horario disponible.");
        showToast("Ese horario ya está reservado para esta cancha. Elige otro.", "error");
        return;
    }

    const amount = calculateAmount(sport, startSelect.value, endSelect.value);
    const customerName = form.elements.nombre.value.trim();
    const reservation = {
        nombre: customerName,
        telefono: form.elements.telefono.value.trim(),
        correo: form.elements.correo.value.trim(),
        disciplina: sport,
        fecha: date,
        horaInicio: startSelect.value,
        horaFin: endSelect.value,
        horas: amount.hours,
        total: amount.total,
        consentimiento: true,
        comprobanteAdjunto: Boolean(proofDataUrl)
    };

    try {
        submitButton.disabled = true;
        submitButton.textContent = "Enviando reserva...";
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reservation)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "No se pudo guardar la reserva.");
        reservations.push(result);
        renderAdmin();
        form.reset();
        proofDataUrl = "";
        previewBox.hidden = true;
        dateInput.min = todayInPeru();
        loadStartTimes();
        privacyAccepted = false;
        consentCheckbox.checked = false;
        submitButton.disabled = true;
        privacyStatus.textContent = "Aún no has aceptado el tratamiento de tus datos personales.";
        updateSummary();
        showMessage(`Reserva registrada correctamente. Código: ${result.codigo}.`, "success");
        showToast(`¡Reserva exitosa, ${customerName}! Tu solicitud quedó registrada con el código ${result.codigo}.`, "success");
    } catch (error) {
        showToast(error.message, "error");
        showMessage(error.message, "error");
    } finally {
        submitButton.textContent = "Enviar mi reserva";
        submitButton.disabled = !privacyAccepted;
    }
}

function handleProofChange() {
    const file = proofInput.files[0];
    proofDataUrl = "";
    previewBox.hidden = true;
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        showMessage("Selecciona una imagen JPG, PNG o WEBP.", "error");
        proofInput.value = "";
        return;
    }
    if (file.size > 2 * 1024 * 1024) {
        showMessage("La imagen no debe superar los 2 MB.", "error");
        proofInput.value = "";
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        proofDataUrl = reader.result;
        previewImage.src = proofDataUrl;
        previewBox.hidden = false;
    };
    reader.readAsDataURL(file);
}

function openAdminDialog() {
    if (!document.querySelector("#vista-admin").hidden) return;
    document.querySelector("#error-admin").textContent = "";
    document.querySelector("#llave-admin").value = "";
    document.querySelector("#modal-admin").showModal();
}

document.addEventListener("keydown", event => {
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "a") {
        event.preventDefault();
        openAdminDialog();
    }
});

document.querySelector("#abrir-privacidad").addEventListener("click", () => privacyDialog.showModal());

document.querySelector("#aceptar-privacidad").addEventListener("click", () => {
    privacyAccepted = true;
    consentCheckbox.checked = true;
    submitButton.disabled = false;
    privacyStatus.textContent = "Aceptaste el uso de tus datos personales para gestionar esta reserva.";
    privacyDialog.close();
    showToast("Aceptación registrada. Ya puedes completar y enviar tu reserva.", "success");
});

document.querySelector("#rechazar-privacidad").addEventListener("click", () => {
    privacyAccepted = false;
    consentCheckbox.checked = false;
    submitButton.disabled = true;
    privacyStatus.textContent = "No aceptaste el tratamiento de datos. El envío de la reserva está deshabilitado.";
    privacyDialog.close();
    showToast("Has rechazado el uso de datos. No podrás enviar la reserva.", "error");
});

document.querySelector("#form-admin").addEventListener("submit", event => {
    event.preventDefault();
    if (document.querySelector("#llave-admin").value !== ADMIN_KEY) {
        document.querySelector("#error-admin").textContent = "La llave ingresada no es correcta.";
        return;
    }
    document.querySelector("#modal-admin").close();
    document.querySelector("#vista-cliente").hidden = true;
    document.querySelector("#vista-admin").hidden = false;
    document.querySelector(".site-footer").hidden = true;
    loadReservations();
});

document.querySelector("#cancelar-admin").addEventListener("click", () => document.querySelector("#modal-admin").close());
document.querySelector("#cerrar-admin").addEventListener("click", () => {
    document.querySelector("#vista-admin").hidden = true;
    document.querySelector("#vista-cliente").hidden = false;
    document.querySelector(".site-footer").hidden = false;
});

document.querySelectorAll(".reserve-choice").forEach(button => {
    button.addEventListener("click", () => {
        sportSelect.value = button.dataset.sport;
        updateSummary();
        document.querySelector("#reserva").scrollIntoView({ behavior: "smooth" });
    });
});

sportSelect.addEventListener("change", updateSummary);
dateInput.addEventListener("change", loadStartTimes);
startSelect.addEventListener("change", loadEndTimes);
endSelect.addEventListener("change", updateSummary);
proofInput.addEventListener("change", handleProofChange);
document.querySelector("#quitar-comprobante").addEventListener("click", () => {
    proofInput.value = "";
    proofDataUrl = "";
    previewBox.hidden = true;
});
form.addEventListener("submit", submitReservation);
form.querySelectorAll("input, select").forEach(field => {
    field.addEventListener("input", () => clearFieldError(field));
    field.addEventListener("change", () => clearFieldError(field));
});

dateInput.min = todayInPeru();
loadStartTimes();
updateSummary();
loadReservations();
