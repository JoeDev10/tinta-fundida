# Impresiones Parulo — sitio web

Sitio de catálogo con contacto por WhatsApp y panel de administración.
No necesita servidor, base de datos ni pagar nada por mes.

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

## Cómo lo pongo online

El sitio anda perfecto en tu computadora, pero para que lo vean tus clientes hay
que subirlo a internet. Es gratis:

1. Creá una cuenta en [Netlify](https://app.netlify.com/drop) (o Vercel, o GitHub Pages).
2. Arrastrá **toda esta carpeta** a la ventana de Netlify Drop.
3. Te da una dirección tipo `impresiones-parulo.netlify.app`. Listo, ya está online.
4. Si después querés tu propio dominio (`impresionesparulo.com.ar`), se conecta desde ahí.

---

## Cómo publico los cambios

Esto es lo único que tiene un paso extra, así que leelo con atención.

Cuando editás en el panel, los cambios se guardan **en tu computadora**. Los ves
vos al instante, pero **tus clientes todavía no**.

Para publicarlos:

1. Panel → pestaña **Publicar** → botón **Descargar datos.js**
2. Se descarga un archivo llamado `datos.js`
3. Subilo a tu hosting **dentro de la carpeta `js/`**, reemplazando el que ya está
   (en Netlify: volvés a arrastrar la carpeta entera con el archivo nuevo adentro)

Mientras tengas cambios sin publicar, el sitio te muestra un cartelito naranja
abajo a la izquierda. Ese cartel **solo lo ves vos**.

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

**La clave no es seguridad real.** Sirve para que no entre cualquiera de casualidad,
pero como el sitio no tiene servidor, alguien que sepa buscar la puede encontrar en
el código. No guardes nada sensible en el panel.

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
