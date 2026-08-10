# Tinta Fundida — sitio web

Sitio de catálogo con contacto por WhatsApp y panel de administración.
Se edita desde el celular y lo que guardás sale publicado solo.

## 🌐 Las dos direcciones

**El sitio** · https://joedev10.github.io/tinta-fundida/
Ese es el link para mandar por WhatsApp o poner en la bio de Instagram.

**El panel** · https://joedev10.github.io/tinta-fundida/admin.html
Ahí entrás vos con tu mail y tu contraseña. Guardalo en favoritos.

Código: https://github.com/JoeDev10/tinta-fundida

---

## Cómo entro al panel

Abrís **joedev10.github.io/tinta-fundida/admin.html** y ponés tu mail y tu
contraseña. Listo. Desde la computadora, desde el celular, desde donde estés.

También llegás desde el sitio: bajá hasta el final y tocá el **candado 🔒** que
está al lado del año.

> **Sí, el panel está en internet, y está bien.** La contraseña la revisa el
> servidor y nunca baja al teléfono de quien entra: no hay ningún archivo donde
> ir a espiarla. Además de saber la contraseña hay que estar en la lista de
> personas autorizadas, así que si un desconocido se registra por su cuenta no
> puede tocar nada.

El panel te deja entrado para no pedirte la clave cada vez. Si entraste desde un
teléfono prestado, andá a **Copias y cuenta → Cerrar sesión** antes de devolverlo.

**Si te olvidás la contraseña**, escribile a quien te armó el sitio: se
restablece desde el panel de Supabase en dos minutos.

---

## Cómo cargo mis cosas

1. Entrá al panel.
2. **Marca y contacto** → poné el número de WhatsApp. Es lo más importante:
   sin eso, ningún botón del sitio funciona.
   - Va con código de país, sin `+`, sin espacios y **sin el 15**.
   - Ejemplo: si tu número es 11 2233-4455 → escribís `5491122334455`
   - Apretá *Probar el link* para confirmar que abre tu chat.
3. **Catálogo** → cargá tus piezas (mirá abajo, es lo más rápido).
4. Listo. **No hay botón de publicar**: lo que escribís se guarda solo y desde
   ese momento lo ven tus clientes.

Mirá el **punto verde** arriba a la derecha. Mientras diga *Guardado*, no te
falta ningún paso. Si se pone naranja está guardando; si aparece un cartel rojo,
algo no salió y te dice qué.

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

Las fotos se achican solas a 1100px antes de subirse, así que no importa si
vienen del celular: una de 3 MB queda en unos 150 KB. No hace falta que las
edites antes.

**El espacio ya no es un problema.** Antes había un tope de 5 MB para todo
—unas 25 fotos— porque las fotos vivían adentro del navegador. Ahora van al
servidor, donde hay 1 GB: son miles.

**Consejo:** las fotos venden más que el texto. Fondo liso, luz de día, la pieza
sola y centrada. Con el celular alcanza.

---

## ¿Y publicar?

**Ya no existe ese paso.** Guardar es publicar.

Antes tenías que bajar un archivo `datos.js` y subirlo a GitHub cada vez. Eso se
terminó: ahora el panel escribe directo en el servidor y el sitio lo lee de ahí.
Cargás una foto desde el celular y en treinta segundos está online.

---

## Copias de seguridad

En *Copias y cuenta → Descargar copia* bajás un archivo con **todo** tu
contenido. Guardalo en el Drive cada tanto.

Es tu marcha atrás, y ahora importa más que antes: como lo que guardás se
publica solo, si borrás algo sin querer ya salió al aire. Con *Restaurar copia*
vuelve todo como estaba.

---

## Cuando alguien comparte el link

Si pegás el link del sitio en un chat de WhatsApp, en la bio de Instagram o en
Facebook, no aparece la dirección pelada: aparece una **miniatura** con el cubo,
el nombre del negocio y la ciudad. Eso ya está armado y no tenés que hacer nada.

La imagen es `imagenes/compartir.png`. Si algún día cambia el nombre del negocio
hay que rehacerla —eso lo hace quien toca el código, con un comando— porque el
nombre está dibujado adentro de la imagen.

> WhatsApp se guarda la miniatura por un rato. Si la cambiás y seguís viendo la
> vieja, es eso: no está roto, hay que esperar.

**Google.** El sitio ya le dice a Google que es un negocio local de Tandil, con
el horario y el teléfono que cargaste en el panel. Si mañana cambiás el horario,
eso se actualiza solo.

Ahora, siendo honesto: para que te encuentren buscando *"impresión 3D Tandil"*,
lo que más sirve **no es el sitio** sino darte de alta en el **Perfil de Empresa
de Google** (buscá "Google Business Profile"). Es gratis, lo hacés vos en media
hora, y es lo que hace que aparezcas en el mapa. El sitio ayuda; el perfil es el
que mueve la aguja.

---

## Si querés tu propio dominio

En vez de `joedev10.github.io/tinta-fundida` podés tener
`tintafundida.com.ar`. Se compra en NIC Argentina o Namecheap (unos pocos
dólares al año) y se conecta desde
*Settings → Pages → Custom domain* en el repo. El hosting sigue siendo gratis.

El SEO **no depende de tener dominio propio** — el sitio de ahora rankea igual.
El dominio propio suma en confianza y queda mejor en una tarjeta.

> Para quien toque el código: la dirección está escrita entera en seis lugares
> (tres en `index.html`, una en `robots.txt`, una en `sitemap.xml` y el botón de
> `404.html`). Hay una prueba que falla si quedan diciendo cosas distintas.

---

## Cosas que conviene saber

**El sitio no se cae aunque el servidor se caiga.** Si el servicio tiene un mal
día o se corta internet a mitad de camino, el catálogo se sigue viendo: hay una
copia de respaldo adentro del propio sitio. Lo peor que pasa es que se vea la
última versión guardada en esa copia, nunca una pantalla en blanco.

**No edites desde dos lados a la vez.** Si tocás lo mismo desde la computadora y
desde el celular al mismo tiempo, gana el último que guarda. Con una persona
editando esto no pasa nunca.

**Todo lo que cargás es público.** Lo que va al catálogo lo puede leer cualquiera.
No pongas ahí precios de costo, datos de proveedores ni teléfonos personales.

---

## Para quien toca el código

**Qué hay atrás.** Un proyecto de Supabase (plan gratuito) con:

- tabla `contenido` — una sola fila, `id = 1`, con todo el sitio adentro
- tabla `editores` — quién puede escribir; estar logueado no alcanza
- bucket `fotos` — público para leer, con sesión para escribir

Las credenciales están en `js/nube.js` y **se publican a propósito**: la clave de
ahí es la *publicable*, cuyo trabajo es viajar al navegador. Lo que protege el
sitio no es esconderla, son las políticas de la base. Nunca pongas ahí la
`service_role`.

**Dar de alta a alguien:** crear el usuario en *Authentication* y agregarlo a
`editores`. Sin lo segundo entra al panel y no puede guardar nada — el panel se
lo dice con todas las letras en vez de fingir que guardó.

**El proyecto gratuito se pausa** si nadie lo usa por una semana. Mientras el
sitio reciba visitas no pasa; si llegara a pausarse, el sitio se sigue viendo con
la red de seguridad y hay que despertarlo desde el dashboard de Supabase.

**La red de seguridad es `js/datos.js`**, y no se actualiza sola. Cada tanto
conviene bajarla desde *Copias y cuenta → Descargar datos.js* y reemplazar la
del repo, para que ese respaldo no quede viejo.

**`js/clave.js` quedó sin uso** desde que la contraseña la verifica el servidor.
Sigue en el `.gitignore` porque todavía tiene una clave escrita adentro. Se puede
borrar tranquilo.

**Falta:** `js/nube-panel.js` —el que habla con el servidor— no tiene pruebas
propias; las del panel le ponen adelante una nube de mentira. Y el panel no tiene
"olvidé mi contraseña": hoy se resuelve desde el dashboard.

---

## Las pruebas automáticas

El proyecto trae **86 pruebas** que abren el sitio y el panel de verdad y los
revisan solas: que los links de WhatsApp se armen bien, que las fotos se
achiquen, que ninguna contraseña quede escrita en el código, que el texto se vea
sin scrollear, que el nombre del negocio no rompa la barra en celular, que ningún
filtro del catálogo quede vacío, que el sitio no se scrollee para el costado en
ninguna pantalla, que no quede ningún botón que no lleve a ningún lado y que la
miniatura que sale al compartir el link siga diciendo el nombre correcto.

**Las 86 corren solas en GitHub**, cada vez que se sube algo al repo. Si algo se
rompe te llega un mail y el commit queda con una cruz roja. No tenés que hacer
nada para que pase.

> Antes 23 de estas se salteaban porque el panel no estaba en el repo. Desde que
> el panel se publica junto con el sitio, no queda nada afuera. (El número está
> escrito acá, en el workflow y en `tests/pruebas.js`: si agregás pruebas,
> actualizá los tres.)

Para correrlas en tu computadora necesitás un servidor local (con doble click no
funcionan: el navegador bloquea que una página lea a otra). En la carpeta del
proyecto:

```bash
python -m http.server 5173
```

Y entrás a **http://localhost:5173/tests/** → botón *Correr las pruebas*.

Corré esto **antes de subir** cada vez que se toque el código.

> `npm test` hace lo mismo desde la terminal, sin abrir ninguna ventana. La
> primera vez pide `npm install` y `npx playwright install chromium`.

---

## Qué hay en cada archivo

```
impresion 3D/
│
├── ── EL SITIO ────────────────────────────────
├── index.html          el sitio que ven tus clientes
├── css/estilo.css      diseño del sitio
├── js/sitio.js         arma el sitio
├── js/contenido.js     decide de dónde salen los datos (nube → local → datos.js)
├── js/datos.js         la red de seguridad, si el servidor no contesta
├── 404.html            si alguien entra a una dirección que no existe
├── imagenes/           la miniatura que sale al compartir el link
├── robots.txt          qué puede mirar Google
├── sitemap.xml         el mapa del sitio, para Google
│
├── ── EL PANEL (también se publica) ───────────
├── admin.html          el panel de administración
├── css/admin.css       diseño del panel
├── js/admin.js         hace funcionar el panel
├── js/nube.js          la dirección del servidor y la clave publicable
├── js/nube-panel.js    entrar, guardar y subir fotos
│
├── ── ANDAMIAJE (no toca el sitio) ────────────
├── tests/              las pruebas automáticas
├── scripts/            las corre sin abrir ventana, y dibuja la miniatura
├── .github/workflows/  hace que GitHub las corra en cada push
├── package.json        de qué dependen las pruebas
└── LEEME.md            esto que estás leyendo
```

Ya no hay ningún archivo que tengas que tocar a mano. El panel se encarga.
