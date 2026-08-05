/* ============================================================
   PANEL DE ADMINISTRACIÓN
   Todo se guarda en el navegador (localStorage). Para publicar
   se descarga js/datos.js y se sube al hosting.
   ============================================================ */

(function () {
  'use strict';

  var CLAVE_LS   = 'parulo:contenido';
  var CLAVE_SES  = 'parulo:sesion';
  var TOPE_BYTES = 5000000;           /* ~5 MB, el límite típico de localStorage */

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

  /* --- lectura / escritura por ruta ("marca.nombre") -------- */
  function leer(ruta) {
    return ruta.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, datos);
  }
  function escribir(ruta, valor) {
    var partes = ruta.split('.'), ultima = partes.pop();
    var obj = partes.reduce(function (o, k) { return (o[k] = o[k] || {}); }, datos);
    obj[ultima] = valor;
  }

  /* --- guardado -------------------------------------------- */
  var temporizador = null;
  var medidorFn = null;   /* lo define iniciar(); guardar() puede correr antes */

  function marcarPendiente() {
    var e = $('#estado');
    e.className = 'estado pendiente';
    $('#estado-txt').textContent = 'Guardando…';
    clearTimeout(temporizador);
    temporizador = setTimeout(guardar, 420);
  }

  function guardar(silencioso) {
    try {
      localStorage.setItem(CLAVE_LS, JSON.stringify(datos));
      $('#estado').className = 'estado guardado';
      $('#estado-txt').textContent = 'Guardado';
      if (medidorFn) medidorFn();
      return true;
    } catch (err) {
      $('#estado').className = 'estado';
      $('#estado-txt').textContent = 'Sin guardar';
      if (!silencioso) {
        avisar('No entra más. Borrá alguna foto o usá imágenes más chicas.', true);
      }
      return false;
    }
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
  function pesar(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
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
    iniciar();
  }

  $('#form-acceso').addEventListener('submit', function (ev) {
    ev.preventDefault();
    if ($('#clave').value === datos.admin.clave) {
      try { sessionStorage.setItem(CLAVE_SES, '1'); } catch (e) {}
      entrar();
    } else {
      $('#error-acceso').textContent = '✕ Clave incorrecta';
      $('#clave').value = '';
      $('#clave').focus();
    }
  });

  try {
    if (sessionStorage.getItem(CLAVE_SES) === '1') entrar();
  } catch (e) {}

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

    $('#ir-publicar').addEventListener('click', function () {
      $$('.pestana').filter(function (b) { return b.dataset.vista === 'publicar'; })[0].click();
    });

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
          '<div class="prod-card__foto">' +
            (p.destacado ? '<span class="prod-card__tag">Destacado</span>' : '') +
            (p.visible === false ? '<span class="prod-card__tag prod-card__tag--gris">Oculto</span>' : '') +
            foto +
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
        var bytes = Math.round(fotoTemp.length * 0.75);
        z.innerHTML = '<div class="previa">' +
          '<img src="' + esc(fotoTemp) + '" alt="Vista previa">' +
          '<button type="button" class="previa__quitar" id="quitar-foto">Quitar foto</button>' +
          '<span class="previa__peso">' + pesar(bytes) + '</span>' +
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
      avisar('Procesando la foto…');
      procesarImagen(archivo).then(function (dataURL) {
        fotoTemp = dataURL;
        pintarZonaFoto();
        avisar('Foto lista');
      }).catch(function (err) {
        avisar(err.message || 'No se pudo leer la imagen', true);
      });
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
        '   Subí este archivo a la carpeta js/ de tu hosting.\n' +
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

    $('#resetear').addEventListener('click', function () {
      if (!confirm('Se borran TODOS los cambios y las fotos que cargaste en esta computadora.\n\n' +
                   'Vuelve al contenido publicado en js/datos.js.\n\n¿Seguro?')) return;
      if (!confirm('Última confirmación: esto no se puede deshacer.')) return;
      try { localStorage.removeItem(CLAVE_LS); } catch (e) {}
      location.reload();
    });

    /* --- medidor de espacio -------------------------------- */
    function actualizarMedidor() {
      var json = JSON.stringify(datos);
      var pct = Math.min(100, Math.round(json.length / TOPE_BYTES * 100));
      var m = $('#medidor');
      if (!m) return;

      $('#medidor-relleno').style.width = pct + '%';
      m.className = 'medidor' + (pct >= 85 ? ' critico' : pct >= 60 ? ' alerta' : '');

      var conFoto = datos.productos.filter(function (p) { return p.imagen; }).length;
      $('#medidor-texto').textContent =
        pesar(json.length) + ' de ~5 MB · ' + pct + '% · ' +
        conFoto + ' de ' + datos.productos.length + ' productos con foto' +
        (pct >= 85 ? ' · queda poco espacio' : '');
    }
    medidorFn = actualizarMedidor;
    actualizarMedidor();

    /* aviso al salir con cambios sin guardar */
    window.addEventListener('beforeunload', function (ev) {
      if ($('#estado').classList.contains('pendiente')) {
        ev.preventDefault();
        ev.returnValue = '';
      }
    });
  }
})();
