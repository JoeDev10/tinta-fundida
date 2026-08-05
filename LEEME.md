# Impresiones Parulo — sitio web

Sitio de catálogo con contacto por WhatsApp y panel de administración.
No necesita servidor, base de datos ni pagar nada por mes.

## 🌐 El sitio está online

**https://joedev10.github.io/impresiones-parulo/**

Ese es el link para mandar por WhatsApp. Funciona en cualquier celular,
tiene candadito (HTTPS) y es gratis para siempre.

- Panel: https://joedev10.github.io/impresiones-parulo/admin.html
- Código: https://github.com/JoeDev10/impresiones-parulo

---

## Cómo lo abro

Doble click en **`index.html`** y se abre en el navegador. Eso es todo.

Para entrar al panel: **`admin.html`** — o el link "Panel de administración" abajo de todo en el sitio.

> **Clave inicial: `parulo3d`**
> Cambiala apenas entres, desde *Publicar → Seguridad*.

---

## Cómo cargo mis cosas

1. Abrí `admin.html` y entrá con la clave.
2. **Marca y contacto** → poné el número de WhatsApp. Es lo más importante:
   sin eso, ningún botón del sitio funciona.
   - Va con código de país, sin `+`, sin espacios y **sin el 15**.
   - Ejemplo: si tu número es 11 2233-4455 → escribís `5491122334455`
   - Apretá *Probar el link* para confirmar que abre tu chat.
3. **Catálogo** → *Nuevo producto*. Cargá foto, nombre, precio y descripción.
4. Lo que editás se guarda solo. Mirá el punto verde arriba a la derecha.

Cada producto tiene su propio botón que abre WhatsApp con el nombre de la pieza
ya escrito, así el cliente no tiene que explicar qué quiere.

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

**La clave no es seguridad real.** Ahora que el sitio es público, la clave
`parulo3d` se puede leer en el código. Un desconocido podría entrar al panel.

Pero **no puede hacerte daño**, y vale la pena entender por qué: el panel solo
escribe en la computadora de quien lo usa. Para cambiar lo que ven tus clientes
hay que subir el `datos.js` a GitHub, y eso requiere tu cuenta. O sea: alguien
puede *mirar* el panel, pero no puede tocar tu sitio.

Igual, **no guardes nada sensible ahí** (precios de costo, datos de proveedores,
teléfonos personales). Todo lo que cargues en el panel y publiques es público.

**Si querés que los cambios se publiquen solos** (sin bajar y subir `datos.js`), eso
necesita un backend. Se puede agregar después sin rehacer el sitio.

---

## Qué hay en cada archivo

```
impresion 3D/
├── index.html          el sitio que ven tus clientes
├── admin.html          el panel de administración
├── css/
│   ├── estilo.css      diseño del sitio
│   └── admin.css       diseño del panel
├── js/
│   ├── datos.js        ← TU CONTENIDO (este es el que se reemplaza al publicar)
│   ├── sitio.js        arma el sitio
│   └── admin.js        hace funcionar el panel
└── LEEME.md            esto que estás leyendo
```

El único archivo que vas a tocar es **`js/datos.js`**, y ni siquiera a mano:
lo genera el panel por vos.
