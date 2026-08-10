/* ============================================================
   SITIO PÚBLICO · render del contenido
   ============================================================ */

(function () {
  'use strict';

  var CLAVE_LS = 'tinta-fundida:contenido';

  /* --- carga de contenido ---------------------------------- */
  /* Si hay un borrador guardado en esta computadora, se muestra
     ese (así el dueño ve sus cambios al instante). Si no, se usa
     lo que está publicado en js/datos.js                        */
  var datos, hayBorrador = false;
  try {
    var guardado = localStorage.getItem(CLAVE_LS);
    if (guardado) { datos = JSON.parse(guardado); hayBorrador = true; }
  } catch (e) { /* localStorage bloqueado o JSON roto: usamos el publicado */ }

  if (!datos) datos = window.DATOS_SITIO;
  if (!datos) return;

  /* red de seguridad: si el borrador viene de una versión vieja,
     que falte una clave no debe tumbar todo el sitio */
  datos.secciones  = datos.secciones  || {};
  datos.categorias = datos.categorias || [];
  ['stats', 'servicios', 'productos', 'proceso', 'faq'].forEach(function (k) {
    if (!Array.isArray(datos[k])) datos[k] = [];
  });

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var el = function (t, cls, html) {
    var n = document.createElement(t);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  var esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  /* ==========================================================
     REVELADO AL SCROLL
     Se define antes de pintar nada, porque las secciones lo usan
     a medida que se arman. La animación es decorativa: si algo
     falla, el contenido tiene que quedar visible igual.
     ========================================================== */
  var porRevelar = [];
  var pendiente = false;

  /* El chequeo real. Es síncrono a propósito: si esto dependiera de
     requestAnimationFrame o de IntersectionObserver, una pestaña que el
     navegador no está pintando nunca los ejecuta y el texto queda
     invisible para siempre. La animación puede perderse; el contenido no. */
  function revisarYa() {
    var limite = window.innerHeight - 60;
    porRevelar = porRevelar.filter(function (n) {
      if (n.getBoundingClientRect().top < limite) {
        n.classList.add('visible');
        return false;
      }
      return true;
    });
  }

  /* Para el scroll sí conviene amortiguar. rAF cuando el navegador pinta,
     y un temporizador de respaldo para cuando no. */
  function revisar() {
    if (pendiente) return;
    pendiente = true;
    var hecho = false;
    var correr = function () {
      if (hecho) return;
      hecho = true; pendiente = false;
      revisarYa();
    };
    requestAnimationFrame(correr);
    setTimeout(correr, 120);
  }

  function observar(nodos) {
    Array.prototype.forEach.call(nodos, function (n) {
      if (n.dataset.enCola === '1' || n.classList.contains('visible')) return;
      n.dataset.enCola = '1';
      porRevelar.push(n);
    });
    revisarYa();
  }

  window.addEventListener('scroll', revisar, { passive: true });
  window.addEventListener('resize', revisar, { passive: true });
  window.addEventListener('load', revisar);

  /* --- WhatsApp -------------------------------------------- */
  var hayWhatsapp = !!String(datos.contacto.whatsapp || '').replace(/\D/g, '');

  function linkWhatsapp(mensaje) {
    var num = String(datos.contacto.whatsapp || '').replace(/\D/g, '');
    var txt = mensaje || datos.contacto.mensaje || 'Hola!';
    if (!num) return '#';
    return 'https://wa.me/' + num + '?text=' + encodeURIComponent(txt);
  }

  /* --- teléfono legible ------------------------------------ */
  /* El dueño lo carga pegado y sin símbolos, que es lo más difícil de
     equivocar. Pero "+5492494250859" de corrido no se lee: esto lo separa
     solo para mostrarlo. El link se sigue armando con los números pelados.

     Los códigos de área argentinos son de 2 (Buenos Aires), 3 o 4 dígitos.
     Los de 3 son una lista cerrada, así que alcanza con tenerla: lo que no
     esté ahí y no empiece con 11 es de 4. */
  var AREAS_3 = ('220 221 223 230 236 237 249 260 261 263 264 266 280 291 297 299 ' +
                 '341 342 343 345 348 351 353 358 362 364 370 376 379 380 381 383 ' +
                 '385 387 388').split(' ');

  function telefonoLegible(valor) {
    var d = String(valor || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.indexOf('54') !== 0) return '+' + d;   /* otro país: se muestra tal cual */

    var resto = d.slice(2);
    var movil = resto.charAt(0) === '9';
    if (movil) resto = resto.slice(1);
    if (resto.length !== 10) return '+' + d;     /* no es un número argentino común */

    var largo = resto.indexOf('11') === 0 ? 2
              : AREAS_3.indexOf(resto.slice(0, 3)) !== -1 ? 3 : 4;
    var area = resto.slice(0, largo);
    var abonado = resto.slice(largo);
    var corte = abonado.length - 4;

    return '+54 ' + (movil ? '9 ' : '') + area + ' ' +
           abonado.slice(0, corte) + '-' + abonado.slice(corte);
  }

  /* --- iconos ---------------------------------------------- */
  var ICONOS = {
    caja: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2 21 7v10l-9 5-9-5V7z"/><path d="m3 7 9 5 9-5M12 12v10"/></svg>',
    engranaje: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M22 12h-3M5 12H2m15.07-7.07-2.12 2.12M9.05 14.95l-2.12 2.12m0-12.14 2.12 2.12m5.9 5.9 2.12 2.12"/></svg>',
    capas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m12 2 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/></svg>',
    rayo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
    regla: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 8h20v8H2z"/><path d="M6 8v3M10 8v5M14 8v3M18 8v5"/></svg>',
    pieza: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v4H3m18 0h-6V3M3 15h6v6m6 0v-6h6"/></svg>'
  };

  var MARCADORES = [
    '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M50 12 86 32v40L50 92 14 72V32z"/><path d="m14 32 36 20 36-20M50 52v40"/></svg>',
    '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="50" cy="50" r="34"/><ellipse cx="50" cy="50" rx="34" ry="13"/><ellipse cx="50" cy="50" rx="13" ry="34"/></svg>',
    '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M50 14 84 76H16z"/><path d="M50 14v62M16 76l34-24 34 24"/></svg>',
    '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="20" y="20" width="46" height="46"/><path d="M34 34h46v46H34zM20 20l14 14M66 20l14 14M20 66l14 14M66 66l14 14"/></svg>'
  ];

  /* ==========================================================
     MARCA
     ========================================================== */
  var htmlLogo = '<b>' + esc(datos.marca.logo) + '</b><i>' + esc(datos.marca.logoSufijo) + '</i>';
  $('#logo-nav').innerHTML = htmlLogo;
  $('#logo-pie').innerHTML = htmlLogo;
  document.title = datos.marca.nombre + ' · ' + datos.marca.slogan;

  /* ==========================================================
     HERO
     ========================================================== */
  $('#hero-kicker').textContent = datos.hero.kicker;
  $('#hero-bajada').textContent = datos.hero.bajada;
  $('#hero-cta1-txt').textContent = datos.hero.ctaPrimario;
  $('#hero-cta2-txt').textContent = datos.hero.ctaSecundario;

  /* el título se parte en líneas; la primera palabra lleva glitch */
  (function () {
    var palabras = String(datos.hero.titulo).trim().split(/\s+/);
    var lineas = [], porLinea = Math.ceil(palabras.length / 3) || 1;
    for (var i = 0; i < palabras.length; i += porLinea) {
      lineas.push(palabras.slice(i, i + porLinea).join(' '));
    }
    $('#hero-titulo').innerHTML = lineas.map(function (t, i) {
      if (i === 0) {
        var p = t.split(' '), primera = p.shift();
        return '<span class="linea"><span class="glitch" data-txt="' + esc(primera) + '">' +
               esc(primera) + '</span>' + (p.length ? ' ' + esc(p.join(' ')) : '') + '</span>';
      }
      return '<span class="linea">' + esc(t) + '</span>';
    }).join('');
  })();

  var metas = [];
  if (datos.contacto.ciudad)  metas.push(datos.contacto.ciudad);
  if (datos.contacto.horario) metas.push(datos.contacto.horario);
  if (datos.contacto.envios)  metas.push(datos.contacto.envios);
  $('#hero-meta').innerHTML = metas.map(function (m) { return '<span>' + esc(m) + '</span>'; }).join('');

  /* ==========================================================
     STATS
     ========================================================== */
  if (datos.secciones.stats && datos.stats.length) {
    $('#bloque-stats').hidden = false;
    $('#stats').innerHTML = datos.stats.map(function (s) {
      return '<div class="stat">' +
        '<div class="stat__valor">' + esc(s.valor) + '<small>' + esc(s.unidad || '') + '</small></div>' +
        '<div class="stat__etiqueta">' + esc(s.etiqueta) + '</div></div>';
    }).join('');
  }

  /* ==========================================================
     SERVICIOS
     ========================================================== */
  if (datos.secciones.servicios && datos.servicios.length) {
    $('#servicios').hidden = false;
    $('#lista-servicios').innerHTML = datos.servicios.map(function (s, i) {
      var bullets = (s.bullets || []).filter(Boolean)
        .map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('');
      return '<article class="tarjeta servicio" data-reveal style="--delay:' + (i * 110) + 'ms">' +
        '<div class="servicio__icono">' + (ICONOS[s.icono] || ICONOS.caja) + '</div>' +
        '<h3>' + esc(s.titulo) + '</h3>' +
        '<p>' + esc(s.desc) + '</p>' +
        (bullets ? '<ul>' + bullets + '</ul>' : '') +
        '</article>';
    }).join('');
  }

  /* ==========================================================
     CATÁLOGO
     ========================================================== */
  var visibles = (datos.productos || []).filter(function (p) { return p.visible !== false; });

  if (datos.secciones.catalogo && visibles.length) {
    $('#catalogo').hidden = false;

    var usadas = datos.categorias.filter(function (c) {
      return visibles.some(function (p) { return p.categoria === c; });
    });

    /* con una sola categoría en uso la barra queda con un "Todo" solitario
       que no filtra nada: mejor no mostrarla */
    $('#filtros').hidden = usadas.length < 2;
    $('#filtros').innerHTML = usadas.length < 2 ? '' :
      ['Todo'].concat(usadas).map(function (c, i) {
        return '<button class="filtro' + (i === 0 ? ' activo' : '') +
               '" data-cat="' + esc(c) + '" aria-pressed="' + (i === 0) + '">' + esc(c) + '</button>';
      }).join('');

    pintarProductos('Todo');

    $('#filtros').addEventListener('click', function (ev) {
      var b = ev.target.closest('.filtro');
      if (!b) return;
      Array.prototype.forEach.call(this.children, function (n) {
        var act = n === b;
        n.classList.toggle('activo', act);
        n.setAttribute('aria-pressed', act);
      });
      pintarProductos(b.dataset.cat);
    });
  }

  function pintarProductos(cat) {
    var lista = cat === 'Todo'
      ? visibles
      : visibles.filter(function (p) { return p.categoria === cat; });

    var cont = $('#grilla');

    if (!lista.length) {
      cont.innerHTML = '<p class="vacio">No hay piezas en esta categoría todavía</p>';
      return;
    }

    cont.innerHTML = lista.map(function (p, i) {
      var msg = 'Hola! Me interesa "' + p.nombre + '"' +
                (p.precio ? ' (' + p.precio + ')' : '') + '. ¿Está disponible?';

      var foto = p.imagen
        ? '<img src="' + esc(p.imagen) + '" alt="' + esc(p.nombre) + '" loading="lazy">'
        : '<div class="marcador">' + MARCADORES[i % MARCADORES.length] +
          '<span>Sin foto cargada</span></div>';

      return '<article class="tarjeta producto" data-reveal style="--delay:' + ((i % 3) * 90) + 'ms">' +
        '<div class="producto__foto">' +
          (p.categoria ? '<span class="producto__chip">' + esc(p.categoria) + '</span>' : '') +
          (p.destacado ? '<span class="producto__destacado">Destacado</span>' : '') +
          foto +
        '</div>' +
        '<div class="producto__cuerpo">' +
          '<h3>' + esc(p.nombre) + '</h3>' +
          '<p class="producto__desc">' + esc(p.desc) + '</p>' +
          '<div class="producto__pie">' +
            '<span class="producto__precio">' + esc(p.precio || 'Consultar') + '</span>' +
            (hayWhatsapp
              ? '<a class="producto__pedir" href="' + esc(linkWhatsapp(msg)) + '" target="_blank" rel="noopener">Pedir →</a>'
              : '') +
          '</div>' +
        '</div>' +
      '</article>';
    }).join('');

    observar(cont.querySelectorAll('[data-reveal]'));
  }

  /* ==========================================================
     PROCESO
     ========================================================== */
  if (datos.secciones.proceso && datos.proceso.length) {
    $('#proceso').hidden = false;
    $('#lista-proceso').innerHTML = datos.proceso.map(function (p, i) {
      return '<div class="paso" data-reveal style="--delay:' + (i * 100) + 'ms">' +
        '<div class="paso__num">' + String(i + 1).padStart(2, '0') + ' / ' +
          String(datos.proceso.length).padStart(2, '0') + '</div>' +
        '<h3>' + esc(p.titulo) + '</h3>' +
        '<p>' + esc(p.desc) + '</p></div>';
    }).join('');
  }

  /* ==========================================================
     FAQ
     ========================================================== */
  if (datos.secciones.faq && datos.faq.length) {
    $('#faq').hidden = false;
    $('#lista-faq').innerHTML = datos.faq.map(function (f, i) {
      return '<div class="faq__item">' +
        '<button class="faq__boton" aria-expanded="false" aria-controls="faq-p' + i + '">' +
          esc(f.p) + '</button>' +
        '<div class="faq__panel" id="faq-p' + i + '"><div><p>' + esc(f.r) + '</p></div></div>' +
      '</div>';
    }).join('');

    $('#lista-faq').addEventListener('click', function (ev) {
      var b = ev.target.closest('.faq__boton');
      if (!b) return;
      var item = b.parentElement, abierto = item.classList.toggle('abierto');
      b.setAttribute('aria-expanded', abierto);
    });
  }

  /* ==========================================================
     CONTACTO / FOOTER
     ========================================================== */
  $('#cta-texto').textContent = 'Contame qué necesitás y te paso presupuesto sin cargo.' +
    (datos.contacto.horario ? ' ' + datos.contacto.horario + '.' : '');

  /* Sin número cargado, estos botones apuntaban a "#" y el cliente que los
     tocaba volvía al principio de la página sin entender por qué. Un botón
     que no está es mejor que uno que miente: se sacan del DOM, así tampoco
     quedan como paradas del tabulador. El dueño se entera por el aviso de
     más abajo, que solo se ve en su computadora. */
  ['#cta-nav', '#hero-cta1', '#cta-final', '#flotante'].forEach(function (sel) {
    var n = $(sel);
    if (!n) return;
    if (hayWhatsapp) n.href = linkWhatsapp();
    else n.parentNode.removeChild(n);
  });

  $('#pie-slogan').textContent = datos.marca.slogan + '. ' +
    (datos.contacto.envios || '');

  /* redes · solo se dibuja el icono de la red que esté cargada.
     Si el dueño todavía no puso el usuario de Instagram, no queda
     un icono muerto que lleve a ninguna parte. */
  (function () {
    var usuario = function (v) { return String(v || '').trim().replace(/^@/, ''); };
    var redes = [];

    var ig = usuario(datos.contacto.instagram);
    if (ig) redes.push({
      url: 'https://instagram.com/' + encodeURIComponent(ig),
      nombre: 'Instagram @' + ig,
      icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
             '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.1"/>' +
             '<circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none"/></svg>'
    });

    var tk = usuario(datos.contacto.tiktok);
    if (tk) redes.push({
      url: 'https://tiktok.com/@' + encodeURIComponent(tk),
      nombre: 'TikTok @' + tk,
      icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
             '<path d="M14.2 3v11.6a3.4 3.4 0 1 1-2.9-3.4"/><path d="M14.2 3c.3 2.4 1.9 3.9 4.3 4.1"/></svg>'
    });

    if (String(datos.contacto.whatsapp || '').replace(/\D/g, '')) redes.push({
      url: linkWhatsapp(),
      nombre: 'WhatsApp',
      icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
             '<path d="M3.2 20.8 4.5 16.6A8.4 8.4 0 1 1 7.7 19.8z"/>' +
             '<path d="M8.9 8.3c.5 1.7 1.6 3.2 3.1 4.2l1.2-1.1 2.4 1.1c-.3 1.3-1.6 1.9-2.9 1.6a8.6 8.6 0 0 1-5.6-5.6c-.3-1.3.3-2.6 1.6-2.9z"/></svg>'
    });

    if (datos.contacto.email) redes.push({
      url: 'mailto:' + datos.contacto.email,
      nombre: datos.contacto.email,
      icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
             '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/></svg>'
    });

    $('#redes').innerHTML = redes.map(function (r) {
      return '<a class="red" href="' + esc(r.url) + '" target="_blank" rel="noopener" ' +
             'title="' + esc(r.nombre) + '" aria-label="' + esc(r.nombre) + '">' + r.icono + '</a>';
    }).join('');
  })();

  var itemsPie = [];
  var num = String(datos.contacto.whatsapp || '').replace(/\D/g, '');
  if (num) itemsPie.push('<li><a href="' + esc(linkWhatsapp()) + '" target="_blank" rel="noopener">WhatsApp ' + esc(telefonoLegible(num)) + '</a></li>');
  if (datos.contacto.email) itemsPie.push('<li><a href="mailto:' + esc(datos.contacto.email) + '">' + esc(datos.contacto.email) + '</a></li>');
  if (datos.contacto.instagram) itemsPie.push('<li><a href="https://instagram.com/' + esc(datos.contacto.instagram.replace('@', '')) + '" target="_blank" rel="noopener">Instagram @' + esc(datos.contacto.instagram.replace('@', '')) + '</a></li>');
  if (datos.contacto.tiktok) itemsPie.push('<li><a href="https://tiktok.com/@' + esc(datos.contacto.tiktok.replace('@', '')) + '" target="_blank" rel="noopener">TikTok @' + esc(datos.contacto.tiktok.replace('@', '')) + '</a></li>');
  if (datos.contacto.ciudad) itemsPie.push('<li>' + esc(datos.contacto.ciudad) + '</li>');
  if (datos.contacto.horario) itemsPie.push('<li>' + esc(datos.contacto.horario) + '</li>');
  $('#pie-contacto').innerHTML = itemsPie.join('');

  $('#pie-copy').textContent = '© ' + new Date().getFullYear() + ' ' + datos.marca.nombre;
  $('#pie-hecho').textContent = datos.contacto.ciudad || '';

  /* ==========================================================
     FICHA PARA GOOGLE (JSON-LD)
     Le dice a Google qué es esto: un negocio local, dónde queda,
     a qué hora atiende y cómo se lo contacta. Es lo que puede
     terminar mostrándose como ficha al costado de los resultados.

     Se arma acá y no a mano en el HTML porque los datos son del
     dueño: si mañana cambia el horario o el WhatsApp desde el
     panel, la ficha se actualiza sola. Google ejecuta JavaScript
     cuando indexa, así que la lee igual.

     Cada campo se agrega solo si hay con qué llenarlo. Una ficha
     a medias es normal; una ficha que miente es peor que nada.
     ========================================================== */
  (function () {
    var ficha = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: datos.marca.nombre,
      description: datos.marca.slogan,
      url: location.origin + location.pathname.replace(/index\.html$/, ''),
      image: new URL('imagenes/compartir.png', location.href).href
    };

    if (num) ficha.telephone = '+' + num;

    /* "Tandil, Buenos Aires" → ciudad y provincia por separado */
    if (datos.contacto.ciudad) {
      var partes = datos.contacto.ciudad.split(',');
      ficha.address = { '@type': 'PostalAddress', addressCountry: 'AR' };
      ficha.address.addressLocality = partes[0].trim();
      if (partes[1]) ficha.address.addressRegion = partes[1].trim();
    }

    /* El horario lo escribe el dueño libre ("Lun a Sáb · 9 a 19 hs"),
       porque obligarlo a un formato sería pedirle que piense como una
       computadora. Acá se intenta traducir al formato que espera
       Google, y si el texto no encaja se omite el campo: prefiero una
       ficha sin horario a una con el horario equivocado. */
    (function () {
      var DIAS = { lun: 'Mo', mar: 'Tu', mie: 'We', mié: 'We', jue: 'Th',
                   vie: 'Fr', sab: 'Sa', sáb: 'Sa', dom: 'Su' };
      var t = datos.contacto.horario || '';
      var dias = t.toLowerCase().match(/(lun|mar|mié|mie|jue|vie|sáb|sab|dom)\w*\s+a\s+(lun|mar|mié|mie|jue|vie|sáb|sab|dom)\w*/);
      var horas = t.match(/(\d{1,2})(?::(\d{2}))?\s*a\s*(\d{1,2})(?::(\d{2}))?\s*h/i);
      if (!dias || !horas) return;

      /* Un horario cortado al mediodía ("9 a 13 y 16 a 20 hs") tiene dos
         franjas y acá arriba solo entra una: publicaríamos la tarde y nos
         comeríamos la mañana. Si hay más de un tramo, no es que no se
         entienda: es que no entra en una línea. Mejor no decir nada. */
      if ((t.match(/\d{1,2}\s*(?::\d{2}\s*)?a\s*\d{1,2}/g) || []).length > 1) return;

      var dd = DIAS[dias[1]] + '-' + DIAS[dias[2]];
      var pad = function (h, m) {
        return ('0' + h).slice(-2) + ':' + (m || '00');
      };
      ficha.openingHours = dd + ' ' + pad(horas[1], horas[2]) + '-' + pad(horas[3], horas[4]);
    })();

    var perfiles = [];
    var ig = String(datos.contacto.instagram || '').trim().replace(/^@/, '');
    var tk = String(datos.contacto.tiktok || '').trim().replace(/^@/, '');
    if (ig) perfiles.push('https://instagram.com/' + encodeURIComponent(ig));
    if (tk) perfiles.push('https://tiktok.com/@' + encodeURIComponent(tk));
    if (perfiles.length) ficha.sameAs = perfiles;

    if (datos.contacto.email) ficha.email = datos.contacto.email;

    var s = document.createElement('script');
    s.type = 'application/ld+json';
    /* un "</script>" escondido en el nombre del negocio cerraría la
       etiqueta antes de tiempo: escapamos el < y deja de poder pasar */
    s.textContent = JSON.stringify(ficha, null, 2).replace(/</g, '\\u003c');
    document.head.appendChild(s);
  })();

  /* ==========================================================
     CANDADO DEL PANEL
     Atajo discreto al panel, abajo a la derecha.

     Se arma desde acá y no desde el HTML a propósito: así el
     index.html que se sube al hosting no menciona el panel en
     ningún lado. Solo aparece cuando la página corre en la
     computadora del dueño (archivo local o servidor local),
     que es donde el panel existe.
     ========================================================== */
  (function () {
    /* Antes esto se dibujaba solo en la computadora del dueño, y el
       index.html publicado no nombraba el panel en ningún lado. Tenía
       que ser así: la clave estaba escrita en un archivo y lo único
       que la protegía era que ese archivo no estuviera en el servidor.

       Ahora la contraseña la verifica Supabase, así que esconder el
       candado no aporta nada y sí molesta: el dueño necesita poder
       entrar desde el celular, y para eso el candado tiene que estar
       donde él pueda tocarlo. */

    /* El aviso de que falta el WhatsApp sigue siendo solo para el
       dueño: al cliente no le importa y no puede hacer nada. Se
       muestra si hay una sesión del panel abierta en este navegador. */
    var haySesionPanel = false;
    try { haySesionPanel = !!localStorage.getItem('tinta-fundida:sesion-nube'); } catch (e) {}

    if (!hayWhatsapp && haySesionPanel) {
      var falta = el('div', 'aviso-falta');
      falta.innerHTML = 'Falta cargar el WhatsApp: el sitio está sin ningún ' +
                        'botón para pedir · <a href="admin.html">Panel</a>';
      document.body.appendChild(falta);
    }

    var candado = el('a', 'candado');
    candado.href = 'admin.html';
    candado.title = 'Panel de administración';
    candado.setAttribute('aria-label', 'Panel de administración');
    candado.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
      '<rect x="4" y="10" width="16" height="11" rx="1.5"/>' +
      '<path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.3"/></svg>';

    var barra = $('.pie__barra');
    if (barra) barra.appendChild(candado);
  })();

  /* ==========================================================
     INTERACCIONES
     ========================================================== */

  /* nav compacta al scrollear */
  var nav = $('#nav');
  var alScroll = function () { nav.classList.toggle('compacta', window.scrollY > 40); };
  window.addEventListener('scroll', alScroll, { passive: true });
  alScroll();

  /* menú móvil */
  var burger = $('#burger'), menu = $('#menu');
  burger.addEventListener('click', function () {
    var abierto = menu.classList.toggle('abierta');
    burger.setAttribute('aria-expanded', abierto);
    burger.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
  });
  menu.addEventListener('click', function (ev) {
    if (ev.target.tagName === 'A') {
      menu.classList.remove('abierta');
      burger.setAttribute('aria-expanded', 'false');
    }
  });

  observar(document.querySelectorAll('[data-reveal]'));

  /* Acá iba el aviso de "cambios sin publicar". Dejó de existir el
     concepto: lo que el dueño guarda en el panel ya está publicado,
     no hay un segundo paso. Lo que queda en esta computadora es una
     copia de lo último que se vio, y avisar de eso sería asustar por
     algo que no es un problema.

     La variable hayBorrador se sigue leyendo más arriba porque de ahí
     sale el contenido cuando el servidor no contesta. */
})();
