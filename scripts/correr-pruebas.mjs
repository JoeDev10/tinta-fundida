/* ============================================================
   CORRE LAS PRUEBAS SIN ABRIR NINGUNA VENTANA
   ------------------------------------------------------------
   Es el mismo tests/index.html que abrís en el navegador. Acá se
   levanta un servidor, se abre esa página en un Chrome sin ventana
   y se aprieta el botón por vos.

   Hace falta un servidor de verdad —no alcanza con abrir el archivo—
   porque las pruebas miran adentro de otras páginas y el navegador
   solo lo permite entre páginas del mismo origen.

   Se usa desde la terminal:   node scripts/correr-pruebas.mjs
   y es lo que corre GitHub en cada push.
   ============================================================ */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const LIMITE_MS = 240000;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon'
};

/* servidor mínimo, solo para la corrida */
function levantarServidor() {
  const server = createServer(async (req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (ruta.endsWith('/')) ruta += 'index.html';

      /* que un pedido con ../ no pueda salirse de la carpeta del proyecto */
      const destino = normalize(join(RAIZ, ruta));
      if (!destino.startsWith(RAIZ.endsWith(sep) ? RAIZ : RAIZ + sep)) {
        res.writeHead(403).end('fuera del proyecto');
        return;
      }

      const cuerpo = await readFile(destino);
      res.writeHead(200, {
        'content-type': TIPOS[extname(destino).toLowerCase()] || 'application/octet-stream',
        'cache-control': 'no-store'
      }).end(cuerpo);
    } catch {
      /* Un 404 acá ya no es lo normal: el panel se publica junto con el
         sitio y tiene que estar. Si falta, las pruebas del panel se
         saltean en vez de fallar, que sigue siendo lo correcto. */
      res.writeHead(404).end('no está');
    }
  });

  return new Promise((listo) => {
    server.listen(0, '127.0.0.1', () => listo({ server, puerto: server.address().port }));
  });
}

const { server, puerto } = await levantarServidor();
const base = `http://127.0.0.1:${puerto}`;

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1280, height: 900 } });

const problemas = [];
pagina.on('pageerror', (e) => problemas.push('error en la página: ' + e.message));
pagina.on('console', (m) => { if (m.type() === 'error') problemas.push('consola: ' + m.text()); });

let salida = 1;

try {
  const r = await pagina.goto(`${base}/tests/`, { waitUntil: 'load', timeout: 30000 });
  if (!r || !r.ok()) throw new Error(`tests/index.html respondió ${r ? r.status() : 'nada'}`);

  const hayPanel = await pagina.evaluate(() => window.PRUEBAS.hayPanel());
  const total = await pagina.evaluate(() => window.PRUEBAS.total());
  console.log(`\n${total} pruebas · el panel ${hayPanel ? 'está' : 'no está'} en esta copia\n`);

  await pagina.click('#correr');
  await pagina.waitForFunction(() => window.__RESULTADO, null,
    { timeout: LIMITE_MS, polling: 500 });

  const res = await pagina.evaluate(() => window.__RESULTADO);

  console.log(`  pasaron    ${res.bien}`);
  console.log(`  fallaron   ${res.mal}`);
  console.log(`  salteadas  ${res.salteadas}${res.salteadas ? '   (falta admin.html en esta copia)' : ''}`);
  console.log(`  duración   ${res.segundos}s\n`);

  if (res.mal) {
    console.log('Fallaron:\n');
    for (const f of res.fallas) console.log('  ✕ ' + f + '\n');
  }

  /* que no quede ninguna corrida vacía pasando por buena */
  if (!res.corridas) throw new Error('no corrió ni una prueba');

  salida = res.mal ? 1 : 0;
  if (!res.mal) console.log('✓ Todo en verde\n');
} catch (e) {
  console.error('\nLa corrida se cayó: ' + e.message + '\n');
  for (const p of problemas.slice(0, 10)) console.error('  ' + p);
} finally {
  await navegador.close();
  server.close();
}

process.exit(salida);
