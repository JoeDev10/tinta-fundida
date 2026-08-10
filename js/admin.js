/* ============================================================
   PANEL DE ADMINISTRACIÓN
   ------------------------------------------------------------
   Guardar es publicar: lo que se escribe acá va al servidor y
   desde ese momento lo ve cualquiera que entre al sitio. Ya no
   hay un segundo paso, ni un archivo que bajar y subir.

   En esta computadora igual queda una copia de lo último que se
   vio (localStorage). No es un borrador sin publicar: es lo que
   se pinta si el servidor no contesta.
   ============================================================ */

(function () {
  'use strict';

  var CLAVE_LS = 'tinta-fundida:contenido';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ==========================================================
     ESTADO
     ========================================================== */
  var base = window.DATOS_SITIO;
  var datos;

  function clonar(o) { return JSON.parse(JSON.stringify(o)); }

  /* completa las claves que falten (por si el borrador es de una versión vieja) */
  function fusionar(destino, plantilla) {
    Object.keys(plantilla).forEach(function (k) {
      if (destino[k] === undefined) {
        destino[k] = clonar(plantilla[k]);
      } else if (
        plantilla[k] && typeof plantilla[k] === 'object' && !Array.isArray(plantilla[k]) &&
        destino[k]  && typeof destino[k]  === 'object' && !Array.isArray(destino[k])
      ) {
        fusionar(destino[k], plantilla[k]);
      }
    });
    return destino;
  }

  try {
    var guardado = localStorage.getItem(CLAVE_LS);
    datos = guardado ? fusionar(JSON.parse(guardado), base) : clonar(base);
  } catch (e) {
    datos = clonar(base);
  }

  /* Borradores viejos guardaban la clave acá adentro. Se saca para que
     no termine viajando al hosting dentro de datos.js.

     Va como función porque hay dos puertas de entrada: lo que había en
     esta computadora y lo que viene del servidor. Cuando el contenido
     pasó a venir de la nube esto se limpiaba solo en la primera, y una
     clave vieja volvía a colarse por la segunda. */
  function limpiarHeredado(d) {
    if (d && d.admin) delete d.admin;
    return d;
  }

  limpiarHeredado(datos);

  /* --- lectura / escritura por ruta ("marca.nombre") -------- */
  function leer(ruta) {
    return ruta.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, datos);
  }
  function escribir(ruta, valor) {
    var partes = ruta.split('.'), ultima = partes.pop();
    var obj = partes.reduce(function (o, k) { return (o[k] = o[k] || {}); }, datos);
    obj[ultima] = valor;
  }

  /* --- guardado ---------------------------------------------
     Dos destinos con papeles distintos:

       · Esta computadora · instantáneo, no puede fallar por la red.
         Es la red de seguridad si el servidor no contesta justo
         cuando el dueño estaba escribiendo.
       · El servidor      · es el que ven los clientes. Va con una
         demora corta para no mandar una escritura por cada tecla.

     El punto de color de arriba a la derecha sigue al servidor, no
     a la copia local: lo que el dueño necesita saber es si su
     cambio salió al aire, no si quedó en su disco.
     ---------------------------------------------------------- */
  var temporizador = null;
  var temporizadorNube = null;
  var resumenFn = null;   /* lo define iniciar(); guardar() puede correr antes */

  function marcarPendiente() {
    var e = $('#estado');
    e.className = 'estado pendiente';
    $('#estado-txt').textContent = 'Guardando…';
    clearTimeout(temporizador);
    temporizador = setTimeout(guardar, 420);
  }

  function marcarEstado(clase, texto) {
    $('#estado').className = 'estado' + (clase ? ' ' + clase : '');
    $('#estado-txt').textContent = texto;
  }

  function guardarLocal() {
    try {
      localStorage.setItem(CLAVE_LS, JSON.stringify(datos));
      return true;
    } catch (err) {
      return false;
    }
  }

  function subirALaNube() {
    if (!window.NUBE_PANEL || !NUBE_PANEL.sesion()) return;
    clearTimeout(temporizadorNube);
    marcarEstado('pendiente', 'Guardando…');
    temporizadorNube = setTimeout(function () {
      NUBE_PANEL.guardarContenido(datos)
        .then(function () {
          marcarEstado('guardado', 'Guardado');
          if (resumenFn) resumenFn();
        })
        .catch(function (err) {
          marcarEstado('', 'Sin guardar');
          avisar(err.message, true);
        });
    }, 600);
  }

  function guardar(silencioso) {
    var enDisco = guardarLocal();
    subirALaNube();

    /* Que no entre en esta computadora ya no es grave: las fotos ahora
       son direcciones cortas y el contenido de verdad vive en el
       servidor. Se avisa, pero no se da por perdido el cambio. */
    if (!enDisco && !silencioso) {
      avisar('No entró la copia local, pero se guarda igual en el servidor.', true);
    }
    return enDisco || !!(window.NUBE_PANEL && NUBE_PANEL.sesion());
  }

  /* --- toast ------------------------------------------------ */
  var tToast = null;
  function avisar(texto, esError) {
    var t = $('#toast');
    t.textContent = texto;
    t.className = 'toast visible' + (esError ? ' error' : '');
    clearTimeout(tToast);
    tToast = setTimeout(function () { t.className = 'toast' + (esError ? ' error' : ''); }, esError ? 5000 : 2600);
  }

  /* --- utilidades ------------------------------------------ */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function bajarArchivo(nombre, contenido, tipo) {
    var blob = new Blob([contenido], { type: tipo || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  var ICO = {
    arriba: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6"/></svg>',
    abajo:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>',
    editar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>',
    copiar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="1"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    borrar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
    foto:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>',
    subir:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>'
  };

  /* ==========================================================
     ACCESO
     ========================================================== */
  function pintarLogo() {
    var html = '<b>' + esc(datos.marca.logo) + '</b><i>' + esc(datos.marca.logoSufijo) + '</i>';
    $('#logo-acceso').innerHTML = html;
    $('#logo-barra').innerHTML  = html;
  }
  pintarLogo();

  function entrar() {
    $('#acceso').style.display = 'none';
    $('#panel').classList.add('activo');
    var s = window.NUBE_PANEL && NUBE_PANEL.sesion();
    $('#barra-mail').textContent = (s && s.mail) || '';
    iniciar();
  }

  /* Cerrar sesión existe porque el panel ahora está en internet y se
     abre desde el celular. Sin esto, prestar el teléfono un minuto deja
     el panel abierto para siempre: la sesión se guarda y no vence
     sola. Se borra también la copia local, que es contenido del negocio
     y no tiene por qué quedar en una máquina ajena. */
  function cerrarSesion() {
    if (!confirm('¿Cerrar la sesión?\n\nPara volver a entrar te va a pedir el mail y la contraseña.')) return;
    try { localStorage.removeItem(CLAVE_LS); } catch (e) {}
    var irse = function () { location.reload(); };
    if (window.NUBE_PANEL) NUBE_PANEL.salir().then(irse, irse);
    else irse();
  }

  /* ==========================================================
     ACCESO
     ------------------------------------------------------------
     Antes la clave estaba escrita en js/clave.js y el panel la
     comparaba acá, en el navegador. Servía solamente porque ese
     archivo nunca se publicaba: apenas el panel salía a internet,
     cualquiera podía abrir la URL del archivo y leerla.

     Ahora la contraseña la verifica el servidor y nunca baja al
     navegador. Por eso el panel puede estar publicado y por eso
     el dueño puede entrar desde el celular.

     Estar logueado tampoco alcanza: la base exige además estar en
     la lista de editores. Registrarse por afuera no habilita nada.
     ========================================================== */
  function mostrarErrorAcceso(texto) {
    $('#error-acceso').textContent = '✕ ' + texto;
    $('#clave').value = '';
    $('#clave').focus();
  }

  $('#form-acceso').addEventListener('submit', function (ev) {
    ev.preventDefault();

    if (!window.NUBE_PANEL || !NUBE_PANEL.hayNube()) {
      mostrarErrorAcceso('Falta la configuración del servidor (js/nube.js).');
      return;
    }

    var boton = $('#txt-entrar');
    boton.textContent = 'Entrando…';
    $('#error-acceso').textContent = '';

    NUBE_PANEL.entrar($('#mail').value.trim(), $('#clave').value)
      .then(cargarYEntrar)
      .catch(function (err) {
        boton.textContent = 'Entrar';
        mostrarErrorAcceso(err.message);
      });
  });

  /* Trae el contenido del servidor y recién ahí abre el panel. Si el
     servidor no contesta, se entra igual con lo último que haya en
     esta computadora: mejor poder mirar y corregir sin conexión que
     una pantalla trabada. Lo que no se puede es guardar, y de eso
     avisa guardar() cuando se intente. */
  function cargarYEntrar() {
    return NUBE_PANEL.traerContenido()
      .then(function (remoto) {
        if (remoto && remoto.marca) datos = limpiarHeredado(fusionar(remoto, base));
      })
      .catch(function (err) {
        avisar('Se abrió con lo guardado en esta computadora: ' + err.message, true);
      })
      .then(entrar);
  }

  /* Sesión abierta de antes: no se vuelve a pedir la contraseña. */
  if (window.NUBE_PANEL && NUBE_PANEL.sesion()) cargarYEntrar();

  /* ==========================================================
     ARRANQUE DEL PANEL
     ========================================================== */
  function iniciar() {

    /* --- pestañas ------------------------------------------ */
    $$('.pestana').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.pestana').forEach(function (x) { x.classList.remove('activa'); });
        $$('.vista').forEach(function (x) { x.classList.remove('activa'); });
        b.classList.add('activa');
        $('#v-' + b.dataset.vista).classList.add('activa');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    $('#salir').addEventListener('click', cerrarSesion);
    $('#salir-cuenta').addEventListener('click', cerrarSesion);

    /* --- campos con data-bind ------------------------------ */
    $$('[data-bind]').forEach(function (campo) {
      var ruta = campo.dataset.bind;
      var esCheck = campo.dataset.tipo === 'check';

      if (esCheck) campo.checked = !!leer(ruta);
      else campo.value = leer(ruta) == null ? '' : leer(ruta);

      campo.addEventListener(esCheck ? 'change' : 'input', function () {
        escribir(ruta, esCheck ? campo.checked : campo.value);
        if (ruta.indexOf('marca.logo') === 0) pintarLogo();
        if (ruta.indexOf('contacto.') === 0) refrescarLinkWa();
        marcarPendiente();
      });
    });

    /* --- link de prueba de WhatsApp ------------------------ */
    function refrescarLinkWa() {
      var num = String(datos.contacto.whatsapp || '').replace(/\D/g, '');
      var a = $('#probar-wa');
      if (!num) { a.href = '#'; a.textContent = 'Cargá el número primero'; return; }
      a.href = 'https://wa.me/' + num + '?text=' + encodeURIComponent(datos.contacto.mensaje || 'Hola!');
      a.textContent = 'Probar el link ↗';
    }
    refrescarLinkWa();

    /* --- categorías ---------------------------------------- */
    var inputCats = $('#cats');
    inputCats.value = datos.categorias.join(', ');
    inputCats.addEventListener('input', function () {
      datos.categorias = inputCats.value.split(',')
        .map(function (s) { return s.trim(); })
        .filter(Boolean);
      marcarPendiente();
    });

    /* --- listas dinámicas ---------------------------------- */
    var LISTAS = {
      stats: {
        cont: '#lista-stats',
        nuevo: function () { return { valor: '10', unidad: '+', etiqueta: 'Nuevo dato' }; },
        campos: [
          { k: 'valor',    l: 'Número',   tipo: 'text' },
          { k: 'unidad',   l: 'Unidad',   tipo: 'text' },
          { k: 'etiqueta', l: 'Qué mide', tipo: 'text' }
        ],
        clase: 'campos--3',
        titulo: function (it) { return it.etiqueta || 'Número'; }
      },
      servicios: {
        cont: '#lista-servicios',
        nuevo: function () { return { icono: 'capas', titulo: 'Nuevo servicio', desc: '', bullets: [] }; },
        campos: [
          { k: 'titulo', l: 'Título', tipo: 'text' },
          { k: 'icono',  l: 'Ícono',  tipo: 'select', ops: ['caja', 'engranaje', 'capas', 'rayo', 'regla', 'pieza'] },
          { k: 'desc',   l: 'Descripción', tipo: 'area', ancho: true },
          { k: 'bullets', l: 'Puntos (uno por línea)', tipo: 'lista', ancho: true }
        ],
        clase: 'campos--2',
        titulo: function (it) { return it.titulo || 'Servicio'; }
      },
      proceso: {
        cont: '#lista-proceso',
        nuevo: function () { return { titulo: 'Nuevo paso', desc: '' }; },
        campos: [
          { k: 'titulo', l: 'Título del paso', tipo: 'text' },
          { k: 'desc',   l: 'Explicación', tipo: 'area', ancho: true }
        ],
        clase: '',
        titulo: function (it) { return it.titulo || 'Paso'; }
      },
      faq: {
        cont: '#lista-faq',
        nuevo: function () { return { p: '¿Nueva pregunta?', r: '' }; },
        campos: [
          { k: 'p', l: 'Pregunta',  tipo: 'text' },
          { k: 'r', l: 'Respuesta', tipo: 'area' }
        ],
        clase: '',
        titulo: function (it) { return it.p || 'Pregunta'; }
      }
    };

    function pintarLista(nombre) {
      var cfg = LISTAS[nombre], items = datos[nombre], cont = $(cfg.cont);

      if (!items.length) {
        cont.innerHTML = '<p style="color:var(--txt-dim);font-size:.87rem;margin:0 0 1rem">' +
                         'Todavía no hay nada acá.</p>';
        return;
      }

      cont.innerHTML = items.map(function (it, i) {
        var campos = cfg.campos.map(function (c) {
          var val = it[c.k];
          if (c.tipo === 'lista') val = (val || []).join('\n');
          var id = 'f-' + nombre + '-' + i + '-' + c.k;
          var control;

          if (c.tipo === 'area' || c.tipo === 'lista') {
            control = '<textarea id="' + id + '" data-lista="' + nombre + '" data-i="' + i +
                      '" data-k="' + c.k + '" data-t="' + c.tipo + '">' + esc(val) + '</textarea>';
          } else if (c.tipo === 'select') {
            control = '<select id="' + id + '" data-lista="' + nombre + '" data-i="' + i +
                      '" data-k="' + c.k + '" data-t="text">' +
                      c.ops.map(function (o) {
                        return '<option value="' + o + '"' + (o === val ? ' selected' : '') + '>' + o + '</option>';
                      }).join('') + '</select>';
          } else {
            control = '<input type="text" id="' + id + '" data-lista="' + nombre + '" data-i="' + i +
                      '" data-k="' + c.k + '" data-t="text" value="' + esc(val) + '">';
          }

          return '<div class="campo"' + (c.ancho ? ' style="grid-column:1/-1"' : '') + '>' +
                 '<label for="' + id + '">' + c.l + '</label>' + control + '</div>';
        }).join('');

        return '<div class="fila">' +
          '<div class="fila__cabecera">' +
            '<span class="fila__indice">' + String(i + 1).padStart(2, '0') + ' · ' + esc(cfg.titulo(it)) + '</span>' +
            '<div class="fila__acciones">' +
              '<button class="icono-btn" data-mover="' + nombre + '" data-i="' + i + '" data-dir="-1" title="Subir"' + (i === 0 ? ' disabled' : '') + '>' + ICO.arriba + '</button>' +
              '<button class="icono-btn" data-mover="' + nombre + '" data-i="' + i + '" data-dir="1" title="Bajar"' + (i === items.length - 1 ? ' disabled' : '') + '>' + ICO.abajo + '</button>' +
              '<button class="icono-btn icono-btn--rojo" data-quitar="' + nombre + '" data-i="' + i + '" title="Eliminar">' + ICO.borrar + '</button>' +
            '</div>' +
          '</div>' +
          '<div class="campos ' + cfg.clase + '">' + campos + '</div>' +
        '</div>';
      }).join('');
    }

    Object.keys(LISTAS).forEach(pintarLista);

    /* edición dentro de las listas (delegado) */
    document.addEventListener('input', function (ev) {
      var c = ev.target;
      if (!c.dataset || !c.dataset.lista) return;
      var item = datos[c.dataset.lista][+c.dataset.i];
      if (!item) return;
      item[c.dataset.k] = c.dataset.t === 'lista'
        ? c.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean)
        : c.value;
      var etiqueta = c.closest('.fila').querySelector('.fila__indice');
      if (etiqueta) {
        etiqueta.textContent = String(+c.dataset.i + 1).padStart(2, '0') + ' · ' +
                               LISTAS[c.dataset.lista].titulo(item);
      }
      marcarPendiente();
    });

    document.addEventListener('change', function (ev) {
      var c = ev.target;
      if (c.tagName === 'SELECT' && c.dataset && c.dataset.lista) {
        datos[c.dataset.lista][+c.dataset.i][c.dataset.k] = c.value;
        marcarPendiente();
      }
    });

    /* mover / quitar / agregar */
    document.addEventListener('click', function (ev) {
      var b;

      if ((b = ev.target.closest('[data-mover]'))) {
        var lm = b.dataset.mover, im = +b.dataset.i, dir = +b.dataset.dir;
        var arr = datos[lm], destino = im + dir;
        if (destino < 0 || destino >= arr.length) return;
        var tmp = arr[im]; arr[im] = arr[destino]; arr[destino] = tmp;
        pintarLista(lm); guardar();
        return;
      }

      if ((b = ev.target.closest('[data-quitar]'))) {
        var lq = b.dataset.quitar, iq = +b.dataset.i;
        if (!confirm('¿Eliminar «' + LISTAS[lq].titulo(datos[lq][iq]) + '»?')) return;
        datos[lq].splice(iq, 1);
        pintarLista(lq); guardar();
        avisar('Eliminado');
        return;
      }

      if ((b = ev.target.closest('[data-agregar]'))) {
        var la = b.dataset.agregar;
        datos[la].push(LISTAS[la].nuevo());
        pintarLista(la); guardar();
        var filas = $$('.fila', $(LISTAS[la].cont));
        if (filas.length) {
          filas[filas.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
          var primer = filas[filas.length - 1].querySelector('input,textarea');
          if (primer) { primer.focus(); primer.select(); }
        }
      }
    });

    /* ========================================================
       CATÁLOGO
       ======================================================== */
    var editando = -1;      /* índice del producto que se está editando, -1 = nuevo */
    var fotoTemp = '';      /* dataURL de la foto en el modal */

    function pintarCatalogo() {
      var cont = $('#grilla-admin');
      $('#conteo-productos').textContent = datos.productos.length;

      if (!datos.productos.length) {
        cont.innerHTML = '<p style="grid-column:1/-1;color:var(--txt-dim);font-size:.87rem;margin:0">' +
                         'Todavía no cargaste ningún producto.</p>';
        return;
      }

      cont.innerHTML = datos.productos.map(function (p, i) {
        var foto = p.imagen
          ? '<img src="' + esc(p.imagen) + '" alt="">'
          : '<div class="prod-card__vacia">' + ICO.foto + '<span>Sin foto</span></div>';

        return '<div class="prod-card' + (p.visible === false ? ' oculto' : '') + '">' +
          '<div class="prod-card__foto" data-suelta="' + i + '">' +
            (p.destacado ? '<span class="prod-card__tag">Destacado</span>' : '') +
            (p.visible === false ? '<span class="prod-card__tag prod-card__tag--gris">Oculto</span>' : '') +
            foto +
            '<div class="foto-acciones">' +
              '<button class="foto-btn" data-pfoto="' + i + '">' + ICO.foto +
                (p.imagen ? 'Cambiar foto' : 'Agregar foto') + '</button>' +
              (p.imagen ? '<button class="foto-btn foto-btn--rojo" data-pquitarfoto="' + i + '">' +
                ICO.borrar + 'Quitar</button>' : '') +
            '</div>' +
          '</div>' +
          '<div class="prod-card__cuerpo">' +
            '<div class="prod-card__nombre">' + esc(p.nombre) + '</div>' +
            '<div class="prod-card__meta">' + esc(p.categoria || 'Sin categoría') + '</div>' +
            '<div class="prod-card__precio">' + esc(p.precio || 'Consultar') + '</div>' +
          '</div>' +
          '<div class="prod-card__barra">' +
            '<button class="icono-btn" data-pmover="' + i + '" data-dir="-1" title="Mover antes"' + (i === 0 ? ' disabled' : '') + '>' + ICO.arriba + '</button>' +
            '<button class="icono-btn" data-pmover="' + i + '" data-dir="1" title="Mover después"' + (i === datos.productos.length - 1 ? ' disabled' : '') + '>' + ICO.abajo + '</button>' +
            '<span style="flex:1"></span>' +
            '<button class="icono-btn" data-pdup="' + i + '" title="Duplicar">' + ICO.copiar + '</button>' +
            '<button class="icono-btn" data-peditar="' + i + '" title="Editar">' + ICO.editar + '</button>' +
            '<button class="icono-btn icono-btn--rojo" data-pborrar="' + i + '" title="Eliminar">' + ICO.borrar + '</button>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    pintarCatalogo();

    $('#grilla-admin').addEventListener('click', function (ev) {
      var b;

      if ((b = ev.target.closest('[data-peditar]'))) { abrirModal(+b.dataset.peditar); return; }

      if ((b = ev.target.closest('[data-pborrar]'))) {
        var ib = +b.dataset.pborrar;
        if (!confirm('¿Eliminar «' + datos.productos[ib].nombre + '»?\n\nSe borra también su foto.')) return;
        datos.productos.splice(ib, 1);
        pintarCatalogo(); guardar();
        avisar('Producto eliminado');
        return;
      }

      if ((b = ev.target.closest('[data-pdup]'))) {
        var id = +b.dataset.pdup;
        var copia = clonar(datos.productos[id]);
        copia.id = 'p' + Date.now();
        copia.nombre = copia.nombre + ' (copia)';
        datos.productos.splice(id + 1, 0, copia);
        pintarCatalogo();
        if (guardar()) avisar('Producto duplicado');
        return;
      }

      if ((b = ev.target.closest('[data-pmover]'))) {
        var im = +b.dataset.pmover, destino = im + (+b.dataset.dir);
        if (destino < 0 || destino >= datos.productos.length) return;
        var tmp = datos.productos[im];
        datos.productos[im] = datos.productos[destino];
        datos.productos[destino] = tmp;
        pintarCatalogo(); guardar();
      }
    });

    $('#nuevo-producto').addEventListener('click', function () { abrirModal(-1); });

    /* ========================================================
       FOTOS RÁPIDAS
       Cambiar o quitar la foto de un producto sin abrir el modal:
       un click, o directamente arrastrando el archivo encima.
       ======================================================== */
    var objetivoFoto = -1;

    $('#grilla-admin').addEventListener('click', function (ev) {
      var b;

      if ((b = ev.target.closest('[data-pfoto]'))) {
        objetivoFoto = +b.dataset.pfoto;
        $('#archivo-rapido').click();
        return;
      }

      if ((b = ev.target.closest('[data-pquitarfoto]'))) {
        var iq = +b.dataset.pquitarfoto;
        var salia = datos.productos[iq].imagen;
        datos.productos[iq].imagen = '';
        pintarCatalogo(); guardar();
        /* se borra el archivo del servidor recién después de sacarlo del
           producto: si el borrado falla, queda un archivo suelto ocupando
           lugar, que es mucho menos grave que una tarjeta apuntando a una
           foto que ya no existe */
        if (salia) NUBE_PANEL.borrarFoto(salia);
        avisar('Foto quitada');
      }
    });

    $('#archivo-rapido').addEventListener('change', function () {
      var f = this.files && this.files[0];
      this.value = '';
      if (!f || objetivoFoto < 0) return;

      var destino = objetivoFoto;
      objetivoFoto = -1;
      avisar('Procesando la foto…');

      subirImagen(f).then(function (url) {
        var previa = datos.productos[destino].imagen;
        datos.productos[destino].imagen = url;
        if (!guardar()) { datos.productos[destino].imagen = previa; return; }
        if (previa) NUBE_PANEL.borrarFoto(previa);   /* la vieja ya no la mira nadie */
        pintarCatalogo();
        avisar('Foto actualizada');
      }).catch(function (err) {
        avisar(err.message || 'No se pudo subir la imagen', true);
      });
    });

    /* arrastrar una foto directamente sobre la tarjeta */
    (function () {
      var grilla = $('#grilla-admin');

      grilla.addEventListener('dragover', function (ev) {
        var z = ev.target.closest('[data-suelta]');
        if (!z) return;
        ev.preventDefault();
        z.classList.add('soltando');
      });

      grilla.addEventListener('dragleave', function (ev) {
        var z = ev.target.closest('[data-suelta]');
        if (z && !z.contains(ev.relatedTarget)) z.classList.remove('soltando');
      });

      grilla.addEventListener('drop', function (ev) {
        var z = ev.target.closest('[data-suelta]');
        if (!z) return;
        ev.preventDefault();
        z.classList.remove('soltando');
        var f = ev.dataTransfer.files && ev.dataTransfer.files[0];
        if (!f) return;
        objetivoFoto = +z.dataset.suelta;
        var dt = new DataTransfer();
        dt.items.add(f);
        $('#archivo-rapido').files = dt.files;
        $('#archivo-rapido').dispatchEvent(new Event('change'));
      });
    })();

    /* ========================================================
       CARGA MASIVA · un producto por foto
       ======================================================== */
    var zonaVarias = $('#soltar-varias');

    zonaVarias.addEventListener('click', function () { $('#archivo-varias').click(); });
    zonaVarias.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); $('#archivo-varias').click(); }
    });
    ['dragenter', 'dragover'].forEach(function (e) {
      zonaVarias.addEventListener(e, function (ev) { ev.preventDefault(); zonaVarias.classList.add('encima'); });
    });
    ['dragleave', 'drop'].forEach(function (e) {
      zonaVarias.addEventListener(e, function (ev) { ev.preventDefault(); zonaVarias.classList.remove('encima'); });
    });
    zonaVarias.addEventListener('drop', function (ev) {
      if (ev.dataTransfer.files) importarVarias(ev.dataTransfer.files);
    });
    $('#archivo-varias').addEventListener('change', function () {
      importarVarias(this.files);
      this.value = '';
    });

    /* el nombre del archivo sirve de borrador para el nombre del producto */
    function nombreDesdeArchivo(nombre) {
      var limpio = nombre.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
      if (!limpio) return 'Producto sin nombre';
      return limpio.charAt(0).toUpperCase() + limpio.slice(1);
    }

    function importarVarias(archivos) {
      var fotos = Array.prototype.filter.call(archivos, function (f) {
        return f.type && f.type.indexOf('image/') === 0;
      });
      if (!fotos.length) { avisar('No encontré ninguna imagen ahí', true); return; }

      avisar('Procesando ' + fotos.length + (fotos.length === 1 ? ' foto…' : ' fotos…'));
      zonaVarias.classList.add('trabajando');

      var agregados = 0;

      /* de a una: procesar 20 fotos a la vez le come la memoria al navegador */
      fotos.reduce(function (cadena, archivo) {
        return cadena.then(function () {
          return subirImagen(archivo).then(function (url) {
            datos.productos.push({
              id: 'p' + Date.now() + Math.floor(Math.random() * 1000),
              nombre: nombreDesdeArchivo(archivo.name),
              categoria: datos.categorias[0] || '',
              precio: '',
              desc: '',
              imagen: url,
              visible: true,
              destacado: false
            });
            if (!guardar(true)) {
              datos.productos.pop();
              throw new Error('lleno');
            }
            agregados++;
          });
        }).catch(function (err) {
          if (err && err.message === 'lleno') throw err;
          /* una foto rota no debe cortar el resto */
        });
      }, Promise.resolve())
        .catch(function () {
          avisar('Entraron ' + agregados + ' y se llenó el espacio. Borrá alguna foto vieja.', true);
        })
        .then(function () {
          zonaVarias.classList.remove('trabajando');
          pintarCatalogo();
          guardar(true);
          if (agregados) {
            avisar(agregados === 1 ? 'Listo, 1 producto nuevo' : 'Listo, ' + agregados + ' productos nuevos');
            var tarjetas = $$('.prod-card', $('#grilla-admin'));
            if (tarjetas.length) tarjetas[tarjetas.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
    }

    /* --- modal --------------------------------------------- */
    var modal = $('#modal-producto');

    function abrirModal(i) {
      editando = i;
      var p = i >= 0 ? datos.productos[i] : {
        nombre: '', categoria: datos.categorias[0] || '', precio: '', desc: '',
        imagen: '', visible: true, destacado: false
      };

      $('#modal-titulo').textContent = i >= 0 ? 'Editar producto' : 'Nuevo producto';
      $('#p-nombre').value    = p.nombre;
      $('#p-precio').value    = p.precio;
      $('#p-desc').value      = p.desc;
      $('#p-visible').checked = p.visible !== false;
      $('#p-destacado').checked = !!p.destacado;

      $('#p-cat').innerHTML = datos.categorias.map(function (c) {
        return '<option value="' + esc(c) + '"' + (c === p.categoria ? ' selected' : '') + '>' + esc(c) + '</option>';
      }).join('') || '<option value="">— sin categorías —</option>';

      fotoTemp = p.imagen || '';
      pintarZonaFoto();

      modal.classList.add('abierto');
      document.body.style.overflow = 'hidden';
      setTimeout(function () { $('#p-nombre').focus(); }, 60);
    }

    function cerrarModal() {
      modal.classList.remove('abierto');
      document.body.style.overflow = '';
      fotoTemp = '';
    }

    $('#modal-cerrar').addEventListener('click', cerrarModal);
    $('#modal-cancelar').addEventListener('click', cerrarModal);
    modal.addEventListener('click', function (ev) { if (ev.target === modal) cerrarModal(); });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && modal.classList.contains('abierto')) cerrarModal();
    });

    $('#modal-guardar').addEventListener('click', function () {
      var nombre = $('#p-nombre').value.trim();
      if (!nombre) { avisar('Poné un nombre al producto', true); $('#p-nombre').focus(); return; }

      var p = {
        id:        editando >= 0 ? datos.productos[editando].id : 'p' + Date.now(),
        nombre:    nombre,
        categoria: $('#p-cat').value,
        precio:    $('#p-precio').value.trim(),
        desc:      $('#p-desc').value.trim(),
        imagen:    fotoTemp,
        visible:   $('#p-visible').checked,
        destacado: $('#p-destacado').checked
      };

      var previos = editando >= 0 ? datos.productos[editando] : null;
      if (editando >= 0) datos.productos[editando] = p;
      else datos.productos.push(p);

      if (!guardar()) {
        /* no entró en memoria: deshacemos para no dejar el panel inconsistente */
        if (editando >= 0) datos.productos[editando] = previos;
        else datos.productos.pop();
        return;
      }

      pintarCatalogo();
      cerrarModal();
      avisar('Producto guardado');
    });

    /* --- foto del producto --------------------------------- */
    function pintarZonaFoto() {
      var z = $('#zona-foto');

      if (fotoTemp) {
        /* Antes acá se calculaba el peso a partir del largo del texto,
           porque la foto venía metida adentro en base64. Ahora fotoTemp
           es una dirección: medirla diría "90 bytes" y sería mentira.
           El peso dejó de importarle al dueño —hay 1 GB— así que en vez
           de un número inventado no se muestra ninguno. */
        z.innerHTML = '<div class="previa">' +
          '<img src="' + esc(fotoTemp) + '" alt="Vista previa">' +
          '<button type="button" class="previa__quitar" id="quitar-foto">Quitar foto</button>' +
        '</div>';
        $('#quitar-foto').addEventListener('click', function () {
          fotoTemp = '';
          pintarZonaFoto();
        });
      } else {
        z.innerHTML = '<div class="dropzona" id="dropzona" tabindex="0" role="button">' +
          ICO.subir +
          '<p>Arrastrá una foto o hacé click</p>' +
          '<small>JPG o PNG · se achica sola para que pese poco</small>' +
        '</div>';

        var dz = $('#dropzona');
        dz.addEventListener('click', function () { $('#archivo-foto').click(); });
        dz.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); $('#archivo-foto').click(); }
        });
        ['dragenter', 'dragover'].forEach(function (e) {
          dz.addEventListener(e, function (ev) { ev.preventDefault(); dz.classList.add('encima'); });
        });
        ['dragleave', 'drop'].forEach(function (e) {
          dz.addEventListener(e, function (ev) { ev.preventDefault(); dz.classList.remove('encima'); });
        });
        dz.addEventListener('drop', function (ev) {
          if (ev.dataTransfer.files && ev.dataTransfer.files[0]) cargarFoto(ev.dataTransfer.files[0]);
        });
      }
    }

    $('#archivo-foto').addEventListener('change', function () {
      if (this.files && this.files[0]) cargarFoto(this.files[0]);
      this.value = '';
    });

    function cargarFoto(archivo) {
      if (!archivo.type || archivo.type.indexOf('image/') !== 0) {
        avisar('Eso no es una imagen', true);
        return;
      }
      avisar('Subiendo la foto…');
      subirImagen(archivo).then(function (url) {
        fotoTemp = url;
        pintarZonaFoto();
        avisar('Foto lista');
      }).catch(function (err) {
        avisar(err.message || 'No se pudo subir la imagen', true);
      });
    }

    /* Achica primero y sube después. Lo que queda guardado en el
       producto ya no es la foto entera metida adentro del texto, sino
       la dirección del archivo en el servidor: unos 90 caracteres en
       vez de 150 KB. Por eso se terminó el tope de 5 MB. */
    function subirImagen(archivo) {
      return procesarImagen(archivo)
        .then(function (dataURL) { return fetch(dataURL).then(function (r) { return r.blob(); }); })
        .then(function (blob) { return NUBE_PANEL.subirFoto(blob, archivo.name); });
    }

    /* achica la imagen antes de guardarla: sin esto, tres fotos
       de celular llenan todo el espacio disponible */
    function procesarImagen(archivo, maxLado, calidad) {
      maxLado = maxLado || 1100;
      calidad = calidad || 0.78;

      return new Promise(function (res, rej) {
        var lector = new FileReader();
        lector.onerror = function () { rej(new Error('No se pudo abrir el archivo')); };
        lector.onload = function () {
          var img = new Image();
          img.onerror = function () { rej(new Error('El archivo está dañado')); };
          img.onload = function () {
            var w = img.naturalWidth, h = img.naturalHeight;
            var escala = Math.min(1, maxLado / Math.max(w, h));
            w = Math.max(1, Math.round(w * escala));
            h = Math.max(1, Math.round(h * escala));

            var cv = document.createElement('canvas');
            cv.width = w; cv.height = h;
            var ctx = cv.getContext('2d');

            var esPNG = archivo.type === 'image/png';
            if (!esPNG) {
              ctx.fillStyle = '#0f1219';
              ctx.fillRect(0, 0, w, h);
            }
            ctx.drawImage(img, 0, 0, w, h);

            /* PNG chico conserva la transparencia; el resto va a JPEG */
            var salida = esPNG ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', calidad);
            if (esPNG && salida.length > 500000) {
              ctx.fillStyle = '#0f1219';
              ctx.fillRect(0, 0, w, h);
              ctx.drawImage(img, 0, 0, w, h);
              salida = cv.toDataURL('image/jpeg', calidad);
            }
            res(salida);
            /* el achicado sigue igual aunque ahora la foto viaje al
               servidor: subir 4 MB de una foto de celular para mostrar
               una tarjeta de 400 píxeles es tirar datos del cliente */
          };
          img.src = lector.result;
        };
        lector.readAsDataURL(archivo);
      });
    }

    /* ========================================================
       PUBLICAR / RESPALDOS
       ======================================================== */
    $('#bajar-datos').addEventListener('click', function () {
      guardar(true);
      var cabecera =
        '/* ============================================================\n' +
        '   DATOS DEL SITIO  ·  ' + datos.marca.nombre + '\n' +
        '   Generado desde el panel el ' + new Date().toLocaleString('es-AR') + '\n' +
        '\n' +
        '   Esto NO es lo que se publica: lo publicado ya está en el\n' +
        '   servidor. Esta es la red de seguridad, lo que el sitio pinta\n' +
        '   si el servidor no contesta. Reemplazá con esto el datos.js\n' +
        '   del repo cada tanto, para que el respaldo no quede viejo.\n' +
        '   ============================================================ */\n\n';
      bajarArchivo('datos.js', cabecera + 'window.DATOS_SITIO = ' +
                   JSON.stringify(datos, null, 2) + ';\n', 'text/javascript;charset=utf-8');
      avisar('datos.js descargado');
    });

    $('#bajar-backup').addEventListener('click', function () {
      guardar(true);
      var fecha = new Date().toISOString().slice(0, 10);
      bajarArchivo('respaldo-' + fecha + '.json', JSON.stringify(datos, null, 2),
                   'application/json;charset=utf-8');
      avisar('Copia descargada');
    });

    $('#subir-backup').addEventListener('click', function () { $('#archivo-backup').click(); });

    $('#archivo-backup').addEventListener('change', function () {
      var f = this.files && this.files[0];
      this.value = '';
      if (!f) return;
      if (!confirm('Restaurar esta copia reemplaza todo lo que tenés cargado ahora.\n\n¿Seguimos?')) return;

      var lector = new FileReader();
      lector.onload = function () {
        try {
          var nuevo = JSON.parse(lector.result);
          if (!nuevo || !nuevo.marca || !nuevo.productos) throw new Error('formato');
          datos = fusionar(nuevo, base);
          if (guardar()) { avisar('Copia restaurada'); setTimeout(function () { location.reload(); }, 900); }
        } catch (e) {
          avisar('El archivo no es un respaldo válido', true);
        }
      };
      lector.onerror = function () { avisar('No se pudo leer el archivo', true); };
      lector.readAsText(f);
    });

    /* --- resumen de lo que hay -----------------------------
       Antes acá había un medidor de espacio: las fotos viajaban en
       base64 adentro del texto y el navegador cortaba en 5 MB, así
       que saber cuánto quedaba era urgente. Ahora la foto es una
       dirección de 90 caracteres y el tope se volvió inalcanzable:
       ese medidor marcaría 1% para siempre. Un número que nunca se
       mueve no informa, tranquiliza de mentira. En su lugar va lo
       único que el dueño sí mira: cuántas piezas cargó y a cuántas
       les falta la foto. */
    function actualizarResumen() {
      var r = $('#resumen-contenido');
      if (!r) return;

      var total = datos.productos.length;
      var sinFoto = datos.productos.filter(function (p) { return !p.imagen; }).length;
      var ocultos = datos.productos.filter(function (p) { return p.visible === false; }).length;

      var partes = [total === 1 ? '1 producto' : total + ' productos'];
      if (sinFoto) partes.push(sinFoto === 1 ? '1 sin foto' : sinFoto + ' sin foto');
      if (ocultos) partes.push(ocultos === 1 ? '1 oculto' : ocultos + ' ocultos');
      partes.push(datos.faq.length === 1 ? '1 pregunta' : datos.faq.length + ' preguntas');

      r.textContent = partes.join(' · ') + '. Todo esto ya está online.';
    }
    resumenFn = actualizarResumen;
    actualizarResumen();

    /* aviso al salir con cambios sin guardar */
    window.addEventListener('beforeunload', function (ev) {
      if ($('#estado').classList.contains('pendiente')) {
        ev.preventDefault();
        ev.returnValue = '';
      }
    });
  }
})();
