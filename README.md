# FortalezaClub

Prototipo académico de reservas de canchas de vóley y fulbito.

## Estructura principal
- `frontend/index.html`: estructura y vistas cliente/administrador.
- `frontend/css/styles.css`: diseño adaptable y estilos.
- `frontend/js/app.js`: formulario, cálculo de tarifas, validaciones y manipulación del DOM.
- `frontend/assets/images/`: imágenes del hero y de las dos canchas.
- `backend/server.js`: servidor local Express.
- `backend/routes/api.js`: lectura y registro de reservas.
- `backend/reservas.json`: almacenamiento de las reservas en formato JSON.

## Instalación y ejecución
1. Abre una terminal en la carpeta raíz `FortalezaClub`.
2. Ejecuta `npm install`.
3. Ejecuta `npm start`.
4. Abre `http://localhost:3000/FortalezaClub`. Si ingresas a `http://localhost:3000`, el servidor te redirigirá a esa dirección con el nombre del proyecto.

No abras `frontend/index.html` directamente con `file://`: la aplicación utiliza `fetch()` para comunicarse con la API local.

## Tarifas y horario
| Disciplina | Día (08:00 a 18:00) | Noche (18:00 a 23:00) |
|---|---:|---:|
| Fulbito | S/ 45 por hora | S/ 60 por hora |
| Vóley | S/ 30 por hora | S/ 40 por hora |

Cada bloque de 60 minutos se cobra según la hora en que comienza. Por ejemplo, una reserva de 17:00 a 19:00 suma una hora diurna y una hora nocturna. El sistema permite reservar desde las 08:00 y la última hora termina a las 23:00.

## Acceso administrativo de demostración
- Atajo: `Ctrl + Shift + A`.
- Llave: `FORTALEZA2026`.

La llave está escrita en JavaScript y no es seguridad real; solo se utiliza para la demostración académica.

## Imágenes
Las tres imágenes proporcionadas se guardan en `frontend/assets/images/`. Para el QR de Yape todavía se muestra un espacio provisional, hasta que se incorpore una imagen oficial autorizada.

## Alcance y limitaciones
- Una sola página HTML con dos vistas que se alternan mediante el DOM.
- Los datos de reserva se guardan en un archivo JSON mediante una API local Express.
- El aviso de privacidad presenta la referencia a la Ley N.º 29733. Al aceptar, se marca automáticamente la casilla y se habilita el envío; al rechazar, el botón de envío permanece deshabilitado.
- Los campos obligatorios muestran borde rojo y una notificación superior cuando falta información o el formato no es válido.
- Tras registrar una reserva aparece una notificación superior con el nombre del cliente y el código generado.
- La captura de pago se valida y previsualiza en el navegador, pero no se almacena en el JSON.
- No se procesa ni verifica un pago real.
- La llave administrativa no protege el sistema frente a usuarios malintencionados.
- Es un prototipo local académico, no un sistema listo para recibir reservas reales en producción.
