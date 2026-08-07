/* ============================================================
   GENERADOR DE IMÁGENES  ·  node scripts/generar-imagenes.mjs
   ------------------------------------------------------------
   Dibuja las dos imágenes que el sitio no puede armar solo:

     imagenes/compartir.png   1200x630 · la miniatura que sale
                              cuando alguien pega el link en
                              WhatsApp, Instagram o Facebook.
     imagenes/icono-180.png   180x180 · el icono que usa iPhone
                              al "agregar a pantalla de inicio".

   Lee el nombre y la ciudad de js/datos.js, así que si la marca
   cambia alcanza con volver a correrlo. Se corre a mano nomás:
   no es parte del build ni de las pruebas.
   ============================================================ */

import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

/* datos.js hace `window.DATOS_SITIO = {...}`: le damos un window
   de mentira y lo dejamos correr, en vez de parsearlo con una
   expresión regular que se rompa al primer cambio de formato. */
function leerDatos() {
  const src = readFileSync(join(raiz, 'js', 'datos.js'), 'utf8');
  const ventana = {};
  new Function('window', src)(ventana);
  return ventana.DATOS_SITIO;
}

const datos = leerDatos();
const marca = datos.marca || {};
const contacto = datos.contacto || {};

const COLOR = {
  fondo: '#06070b',
  linea: '#242a3b',
  lima: '#b8ff29',
  texto: '#eaeefb',
  tenue: '#6f7793'
};

/* el cubo de alambre del hero, en SVG plano para que no dependa
   de animaciones ni de nada que un screenshot no vaya a captar */
const cubo = (trazo) => `
  <svg viewBox="0 0 100 100" fill="none" stroke="${COLOR.lima}"
       stroke-width="${trazo}" stroke-linejoin="round">
    <path d="M50 10 88 31v42L50 94 12 73V31z"/>
    <path d="m12 31 38 21 38-21M50 52v42"/>
  </svg>`;

const fuente = "'Chakra Petch','Segoe UI',system-ui,sans-serif";

const base = `
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:${COLOR.fondo};font-family:${fuente};overflow:hidden}
  .grilla{position:absolute;inset:0;
    background-image:linear-gradient(${COLOR.linea} 1px,transparent 1px),
                     linear-gradient(90deg,${COLOR.linea} 1px,transparent 1px);
    background-size:44px 44px;opacity:.35}
  .brillo{position:absolute;border-radius:50%;
    background:radial-gradient(circle,rgba(184,255,41,.22),transparent 68%)}
`;

/* ---------- 1200x630 · la miniatura de WhatsApp -------------- */
const compartir = `
<style>
  ${base}
  body{width:1200px;height:630px;position:relative}
  .brillo{width:900px;height:900px;right:-260px;top:-230px}
  .marco{position:absolute;inset:34px;border:1px solid ${COLOR.linea}}
  .cont{position:absolute;inset:0;display:flex;align-items:center;
        padding:0 92px;gap:56px}
  .txt{flex:1}
  .kicker{display:flex;align-items:center;gap:14px;
    font-size:21px;letter-spacing:.24em;color:${COLOR.lima};
    text-transform:uppercase;font-weight:600;margin-bottom:30px}
  .kicker i{display:block;width:52px;height:2px;background:${COLOR.lima};
    box-shadow:0 0 12px rgba(184,255,41,.45)}
  h1{font-size:96px;line-height:.95;color:${COLOR.texto};
     font-weight:700;letter-spacing:-.015em}
  h1 em{font-style:normal;color:${COLOR.lima};
     text-shadow:0 0 26px rgba(184,255,41,.4)}
  .bajada{margin-top:28px;font-size:31px;line-height:1.35;
     color:${COLOR.tenue};max-width:19ch}
  .pie{position:absolute;left:92px;bottom:74px;display:flex;gap:14px}
  .chip{border:1px solid ${COLOR.linea};color:${COLOR.tenue};
    font-size:19px;letter-spacing:.1em;padding:9px 20px;
    text-transform:uppercase}
  .arte{width:340px;height:340px;flex:none;position:relative}
  .arte svg{width:100%;height:100%;
    filter:drop-shadow(0 0 24px rgba(184,255,41,.32))}
</style>
<div class="grilla"></div><div class="brillo"></div>
<div class="marco"></div>
<div class="cont">
  <div class="txt">
    <div class="kicker"><i></i>${contacto.ciudad || 'Impresión 3D'}</div>
    <h1>${String(marca.logo || marca.nombre || '')
           .replace(/\s+(\S+)$/, '<br><em>$1</em>')}</h1>
    <div class="bajada">${marca.slogan || ''}</div>
  </div>
  <div class="arte">${cubo(2.4)}</div>
</div>
<div class="pie">
  <span class="chip">${datos.hero?.kicker || 'PLA · PETG'}</span>
  ${contacto.envios ? `<span class="chip">${contacto.envios.split('·')[0].trim()}</span>` : ''}
</div>`;

/* ---------- 180x180 · el icono de iPhone --------------------- */
const icono = `
<style>
  ${base}
  body{width:180px;height:180px;position:relative;
       display:flex;align-items:center;justify-content:center}
  .grilla{background-size:20px 20px;opacity:.3}
  .brillo{width:230px;height:230px;top:-58px;left:-38px}
  svg{width:118px;height:118px;position:relative;
      filter:drop-shadow(0 0 10px rgba(184,255,41,.45))}
</style>
<div class="grilla"></div><div class="brillo"></div>
${cubo(5)}`;

const salidas = [
  { html: compartir, ancho: 1200, alto: 630, archivo: 'compartir.png' },
  { html: icono,     ancho: 180,  alto: 180, archivo: 'icono-180.png' }
];

mkdirSync(join(raiz, 'imagenes'), { recursive: true });

const navegador = await chromium.launch();
for (const s of salidas) {
  const pagina = await navegador.newPage({
    viewport: { width: s.ancho, height: s.alto },
    deviceScaleFactor: 1
  });
  await pagina.setContent(s.html);
  await pagina.screenshot({ path: join(raiz, 'imagenes', s.archivo) });
  await pagina.close();
  console.log('✓ imagenes/' + s.archivo + '  ' + s.ancho + 'x' + s.alto);
}
await navegador.close();
