# Tinta Fundida — sitio web

Sitio de catálogo con contacto por WhatsApp y panel de administración.
No necesita servidor, base de datos ni pagar nada por mes.

## 🌐 El sitio está online

**https://joedev10.github.io/impresiones-parulo/**

Ese es el link para mandar por WhatsApp. Funciona en cualquier celular,
tiene candadito (HTTPS) y es gratis para siempre.

- Código: https://github.com/JoeDev10/impresiones-parulo
- El panel no tiene link de internet: se abre desde esta computadora (mirá acá abajo).

---

## Cómo entro al panel

**El panel no está en internet, y eso es a propósito.** Vive solo en esta
computadora, en el archivo `admin.html`. Si alguien prueba entrar a
`joedev10.github.io/impresiones-parulo/admin.html`, no encuentra nada.

Para entrar: abrí **`index.html`** (doble click) y bajá hasta el final de la
página. Abajo a la derecha, al lado del año, hay un **candado 🔒**. Clic ahí y
entrás al panel.

Ese candado **solo aparece en tu computadora**. En el sitio publicado no existe:
si abrís joedev10.github.io y bajás al pie, no hay ningún candado que encontrar.

También podés entrar directo con doble click en `admin.html`.

> **Clave: `Molde-Filamento47_A822`**
> Está guardada en `js/clave.js`. Para cambiarla, abrí ese archivo con el Bloc
> de notas, cambiá el texto entre comillas y guardá.

Conviene anotarla en el celular o en un papel. Si la perdés, se recupera
abriendo `js/clave.js`.

---

## Cómo cargo mis cosas

1. Abrí `admin.html` y entrá con la clave.
2. **Marca y contacto** → poné el número de WhatsApp. Es lo más importante:
   sin eso, ningún botón del sitio funciona.
   - Va con código de país, sin `+`, sin espacios y **sin el 15**.
   - Ejemplo: si tu número es 11 2233-4455 → escribís `5491122334455`
   - Apretá *Probar el link* para confirmar que abre tu chat.
3. **Catálogo** → cargá tus piezas (mirá abajo, es lo más rápido).
4. Lo que editás se guarda solo. Mirá el punto verde arriba a la derecha.

Cada producto tiene su propio botón que abre WhatsApp con el nombre de la pieza
ya escrito, así el cliente no tiene que explicar qué quiere.

---

## Las fotos, en dos clicks

En la pestaña **Catálogo** tenés tres formas, de la más rápida a la más precisa:

**1. Varias de una (lo más rápido)**
Agarrá varias fotos de tu carpeta y soltalas en el recuadro que dice
*"Soltá tus fotos acá"*. Te crea **un producto por cada foto**, usando el nombre
del archivo como nombre del producto. Después les ponés precio y descripción.

> Truco: si nombrás los archivos `maceta-chica.jpg`, `porta-lapices.jpg`,
> los productos salen ya con el nombre puesto.

**2. Una foto a un producto que ya existe**
Pasá el mouse por encima de la tarjeta y apretá **Agregar foto** (o *Cambiar
foto* si ya tenía). Elegís el archivo y listo. También podés arrastrar la foto
directamente encima de la tarjeta.

**3. Borrar una foto**
Pasá el mouse por la tarjeta y apretá **Quitar**. Un click, sin preguntas.
La foto se va y el producto queda igual.

Todo esto se guarda solo. No hay que apretar ningún "guardar".

---

## Cómo publico los cambios

Esto es lo único que tiene un paso extra, así que leelo con atención.

Cuando editás en el panel, los cambios se guardan **en tu computadora**. Los ves
vos al instante, pero **tus clientes todavía no**.

### Los 3 pasos

1. Panel → pestaña **Publicar** → botón **Descargar datos.js**
   Se baja un archivo llamado `datos.js` a tu carpeta de Descargas.

2. Entrá a **[la carpeta js/ del repo](https://github.com/JoeDev10/impresiones-parulo/upload/main/js)**
   (te va a pedir tu usuario de GitHub).

3. **Arrastrá el `datos.js`** que bajaste a esa ventana y abajo apretá el botón
   verde **Commit changes**.

Esperá un minuto y recargá el sitio. Los cambios ya están online.

> GitHub te va a avisar que el archivo ya existe y lo va a reemplazar. Está bien,
> es exactamente lo que querés.

Mientras tengas cambios sin publicar, el sitio te muestra un cartelito naranja
abajo a la izquierda. Ese cartel **solo lo ves vos**.

---

## Si querés tu propio dominio

En vez de `joedev10.github.io/impresiones-parulo` podés tener
`impresionesparulo.com.ar`. Se compra en NIC Argentina o Namecheap (unos pocos
dólares al año) y se conecta desde
*Settings → Pages → Custom domain* en el repo. El hosting sigue siendo gratis.

---

## Las fotos

- Se achican solas al subirlas (a 1100px), así que no importa si vienen del celular.
- Una foto de 3 MB queda en unos 150 KB. No hace falta que las edites antes.
- El espacio total es de unos **5 MB**, que alcanza para 25–30 fotos.
- En *Publicar → Espacio usado* ves cuánto llevás.

**Consejo:** las fotos venden más que el texto. Fondo liso, luz de día, la pieza
sola y centrada. Con el celular alcanza.

---

## Copias de seguridad

En *Publicar → Copia de seguridad* podés bajar un archivo con **todo** tu contenido
y tus fotos. Guardalo cada tanto en el Drive o donde quieras.

Si cambiás de computadora, formateás, o borrás algo sin querer: *Restaurar copia*
y vuelve todo como estaba.

> Si limpiás los datos del navegador se borra lo que no publicaste.
> Tené siempre una copia bajada.

---

## Cosas que conviene saber

**El panel no se publica nunca.** Los archivos `admin.html`, `js/admin.js`,
`css/admin.css` y `js/clave.js` están en el `.gitignore`: no viajan a internet.
Por eso tu clave es una clave de verdad y no un adorno — no hay forma de que un
desconocido la lea, porque el archivo no existe en el servidor.

**Todo lo que publicás es público.** Lo que cargues en el catálogo y subas con
`datos.js` lo puede leer cualquiera. No pongas ahí precios de costo, datos de
proveedores ni teléfonos personales.

**Si querés editar desde otra computadora o desde el celular,** hoy no se puede:
el panel está atado a esta máquina. Se resuelve con un backend (fase 2), o
copiando la carpeta entera a la otra computadora y restaurando una copia de
seguridad.

**Si querés que los cambios se publiquen solos** (sin bajar y subir `datos.js`), eso
necesita un backend. Se puede agregar después sin rehacer el sitio.

---

## Las pruebas automáticas

El proyecto trae 56 pruebas que abren el sitio y el panel de verdad y los revisan
solas: que los links de WhatsApp se armen bien, que las fotos se achiquen, que la
clave no se filtre, que el texto se vea sin scrollear, que el nombre del negocio
no rompa la barra en celular y que ningún filtro del catálogo quede vacío.

**35 corren solas en GitHub**, cada vez que se sube algo al repo. Si algo se
rompe te llega un mail y el commit queda con una cruz roja. No tenés que hacer
nada para que pase.

**Las otras 21 hay que correrlas acá.** Son las que abren el panel, y el panel
no está en el repo (por eso nadie puede entrar desde internet). En GitHub esas
aparecen como *salteadas*, no como falladas.

Para correr las 56 necesitás un servidor local (con doble click no funcionan:
el navegador bloquea que una página lea a otra). En la carpeta del proyecto:

```bash
python -m http.server 5173
```

Y entrás a **http://localhost:5173/tests/** → botón *Correr las pruebas*.

Corré esto **antes de publicar** cada vez que se toque el código. Si algo se
rompió, te lo dice en rojo y con el motivo.

> Para quien toque el código: `npm test` hace lo mismo desde la terminal, sin
> abrir ninguna ventana. La primera vez pide `npm install` y
> `npx playwright install chromium`.

---

## Qué hay en cada archivo

```
impresion 3D/
│
├── ── SE PUBLICA ──────────────────────────────
├── index.html          el sitio que ven tus clientes
├── css/estilo.css      diseño del sitio
├── js/sitio.js         arma el sitio
├── js/datos.js         ← TU CONTENIDO (el que se reemplaza al publicar)
│
├── ── NO SE PUBLICA (solo en esta compu) ──────
├── admin.html          el panel de administración
├── css/admin.css       diseño del panel
├── js/admin.js         hace funcionar el panel
├── js/clave.js         ← TU CLAVE
│
├── ── ANDAMIAJE (está en el repo, no toca el sitio) ──
├── tests/              las pruebas automáticas
├── scripts/            las corre sin abrir ventana
├── .github/workflows/  hace que GitHub las corra en cada push
├── package.json        de qué dependen las pruebas
└── LEEME.md            esto que estás leyendo
```

El único archivo que vas a tocar es **`js/datos.js`**, y ni siquiera a mano:
lo genera el panel por vos.
