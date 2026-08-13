/* ============================================================
   PRUEBAS AUTOMÁTICAS
   Cargan index.html y admin.html de verdad dentro de un iframe
   y los revisan como lo haría una persona. No hay simulacros:
   es el mismo código que ve el cliente.
   ============================================================ */

(function () {
  'use strict';

  var LS_CONTENIDO = 'tinta-fundida:contenido';
  var LS_SESION    = 'tinta-fundida:sesion';

  /* ==========================================================
     MINI FRAMEWORK
     ========================================================== */
  var suite = [];
  var grupoActual = '';

  function grupo(nombre, fn) { grupoActual = nombre; fn(); }
  function prueba(nombre, fn) { suite.push({ grupo: grupoActual, nombre: nombre, fn: fn }); }

  /* Estos tres grupos abren admin.html. Desde que el panel se publica
     junto con el sitio, siempre está: los 93 corren en todos lados y
     no se saltea nada.

     El mecanismo queda igual, y no por nostalgia: si alguna vez el
     panel vuelve a quedar afuera del repo, estas pruebas se saltean
     en vez de fallar. Una falla ahí diría "el sitio está roto" y el
     sitio estaría perfecto. */
  var GRUPOS_CON_PANEL = ['Panel', 'Fotos', 'Copias'];

  function hayPanel() {
    return fetch('../admin.html', { method: 'HEAD' })
      .then(function (r) { return r.ok; })
      .catch(function () { return false; });
  }

  function esperar(valor) {
    return {
      aSer: function (esperado) {
        if (valor !== esperado) {
          throw new Error('esperaba ' + JSON.stringify(esperado) + ' pero vino ' + JSON.stringify(valor));
        }
      },
      aContener: function (trozo) {
        if (String(valor).indexOf(trozo) === -1) {
          throw new Error('esperaba que contuviera ' + JSON.stringify(trozo) +
                          ' pero vino ' + JSON.stringify(String(valor).slice(0, 160)));
        }
      },
      aNoContener: function (trozo) {
        if (String(valor).indexOf(trozo) !== -1) {
          throw new Error('esperaba que NO contuviera ' + JSON.stringify(trozo));
        }
      },
      aSerVerdadero: function () {
        if (!valor) throw new Error('esperaba algo verdadero pero vino ' + JSON.stringify(valor));
      },
      aSerFalso: function () {
        if (valor) throw new Error('esperaba algo falso pero vino ' + JSON.stringify(valor));
      },
      aSerMenorQue: function (tope) {
        if (!(valor < tope)) throw new Error('esperaba menos de ' + tope + ' pero vino ' + valor);
      },
      aSerMayorQue: function (piso) {
        if (!(valor > piso)) throw new Error('esperaba más de ' + piso + ' pero vino ' + valor);
      }
    };
  }

  /* ==========================================================
     HERRAMIENTAS
     ========================================================== */
  var marcosAbiertos = [];

  /* sitio.js ya no lo carga el HTML: lo carga contenido.js cuando
     terminó de decidir de dónde salen los datos. Un script agregado
     así no retrasa el onload del iframe, o sea que cuando onload
     dispara la página puede estar todavía sin pintar. Esperar 90 ms
     y cruzar los dedos alcanzaba antes y ahora no: se espera hasta
     ver la marca puesta, que es lo primero que escribe sitio.js. */
  function esperarPintado(f, res, rej, url) {
    var limite = Date.now() + 6000;
    (function mirar() {
      var d = f.contentDocument;
      var pintado = d && d.querySelector('#logo-nav') &&
                    d.querySelector('#logo-nav').textContent.trim();
      /* 404.html no tiene logo ni sitio.js: con que exista el body alcanza */
      var sinSitio = d && !d.querySelector('#logo-nav') && d.body;
      if (pintado || sinSitio) return res(f);
      if (Date.now() > limite) return rej(new Error('nunca se pintó: ' + url));
      setTimeout(mirar, 20);
    })();
  }

  function abrirPagina(url) {
    return new Promise(function (res, rej) {
      var f = document.createElement('iframe');
      f.style.cssText = 'position:absolute;left:-10000px;top:0;width:1280px;height:900px;border:0';
      f.src = url + (url.indexOf('?') === -1 ? '?' : '&') + 'test=' + Date.now();
      var listo = false;
      f.onload = function () { listo = true; esperarPintado(f, res, rej, url); };
      f.onerror = function () { rej(new Error('no cargó ' + url)); };
      setTimeout(function () { if (!listo) rej(new Error('tardó demasiado: ' + url)); }, 8000);
      document.body.appendChild(f);
      marcosAbiertos.push(f);
    });
  }

  /* igual que abrirPagina pero con la ventana del tamaño que se pida.
     Sirve para las pruebas de celular, donde lo que se mide es si algo
     entra o se pisa con otra cosa. */
  function abrirPaginaAncho(url, ancho, alto) {
    return new Promise(function (res, rej) {
      var f = document.createElement('iframe');
      f.style.cssText = 'position:absolute;left:-10000px;top:0;border:0;width:' +
                        ancho + 'px;height:' + alto + 'px';
      f.src = url + (url.indexOf('?') === -1 ? '?' : '&') + 'test=' + Date.now();
      f.onload = function () { esperarPintado(f, res, rej, url); };
      f.onerror = function () { rej(new Error('no cargó ' + url)); };
      setTimeout(function () { rej(new Error('tardó demasiado: ' + url)); }, 8000);
      document.body.appendChild(f);
      marcosAbiertos.push(f);
    });
  }

  function cerrarMarcos() {
    marcosAbiertos.forEach(function (f) { if (f.parentNode) f.parentNode.removeChild(f); });
    marcosAbiertos = [];
  }

  function esperarUnPoco(ms) {
    return new Promise(function (r) { setTimeout(r, ms || 60); });
  }

  /* espera hasta que la condición se cumpla, o se rinde */
  function esperarA(condicion, mensaje, limite) {
    limite = limite || 4000;
    var inicio = Date.now();
    return new Promise(function (res, rej) {
      (function revisar() {
        var v;
        try { v = condicion(); } catch (e) { v = false; }
        if (v) return res(v);
        if (Date.now() - inicio > limite) return rej(new Error('nunca pasó: ' + mensaje));
        setTimeout(revisar, 60);
      })();
    });
  }

  function contenidoBase() {
    return JSON.parse(JSON.stringify(window.DATOS_SITIO));
  }

  /* una imagen de verdad, de 1x1, para cuando lo que se prueba no es la
     foto sino lo que el panel o el sitio hacen con ella */
  var PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
  function pixeles(n) {
    var lista = [];
    /* distintas entre sí: si el orden se pierde, hay que poder notarlo */
    for (var i = 0; i < n; i++) lista.push(PIXEL + '#' + (i + 1));
    return lista;
  }

  function sembrar(contenido) {
    localStorage.setItem(LS_CONTENIDO, JSON.stringify(contenido));
  }

  function limpiar() {
    localStorage.removeItem(LS_CONTENIDO);
    sessionStorage.removeItem(LS_SESION);
  }

  /* genera un archivo de imagen real para probar el redimensionado */
  function fotoDePrueba(ancho, alto, nombre, tipo) {
    return new Promise(function (res) {
      var cv = document.createElement('canvas');
      cv.width = ancho; cv.height = alto;
      var cx = cv.getContext('2d');
      var g = cx.createLinearGradient(0, 0, ancho, alto);
      g.addColorStop(0, '#2f7d1e'); g.addColorStop(1, '#d4e84a');
      cx.fillStyle = g; cx.fillRect(0, 0, ancho, alto);
      cx.fillStyle = '#000'; cx.font = 'bold ' + Math.round(alto / 6) + 'px sans-serif';
      cx.fillText('TEST', ancho * 0.1, alto * 0.55);
      cv.toBlob(function (b) {
        res(new File([b], nombre || 'prueba.jpg', { type: tipo || 'image/jpeg' }));
      }, tipo || 'image/jpeg', 0.95);
    });
  }

  function ponerArchivos(input, archivos) {
    var dt = new DataTransfer();
    archivos.forEach(function (a) { dt.items.add(a); });
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /* entra al panel y devuelve su window */
  /* ==========================================================
     LA NUBE DE MENTIRA
     ------------------------------------------------------------
     El panel ya no compara una clave escrita en un archivo: se la
     pide a un servidor. Estas pruebas son sobre la lógica del
     panel —que el formulario guarde, que la foto se achique, que
     el catálogo se reordene— y no sobre el viaje por la red.

     Así que se le pone adelante un NUBE_PANEL falso. admin.js lo
     busca en window en el momento de usarlo, no al arrancar, y por
     eso alcanza con reemplazarlo después de que cargó la página y
     antes de apretar Entrar. El panel no se entera de nada.

     Ojo con lo que esto NO cubre: nada de js/nube-panel.js, que es
     el que habla con el servidor de verdad. Eso todavía está probado
     a mano y le falta su propio grupo de pruebas.
     ========================================================== */
  function nubeFalsa() {
    var guardado;
    try {
      var s = localStorage.getItem(LS_CONTENIDO);
      guardado = s ? JSON.parse(s) : null;
    } catch (e) { guardado = null; }
    if (!guardado) guardado = JSON.parse(JSON.stringify(window.DATOS_SITIO));

    return {
      hayNube: function () { return true; },
      sesion:  function () { return { mail: 'prueba@local' }; },
      entrar:  function () { return Promise.resolve({ mail: 'prueba@local' }); },
      salir:   function () { return Promise.resolve(); },
      traerContenido:   function () { return Promise.resolve(guardado); },
      guardarContenido: function (d) {
        guardado = JSON.parse(JSON.stringify(d));
        return Promise.resolve(guardado);
      },
      /* Devuelve la foto ya procesada como dataURL en vez de subirla.
         Así las pruebas de fotos pueden seguir midiendo el ancho y el
         peso de lo que salió de procesarImagen, que es lo que les
         importa: que el achicado funcione. */
      subirFoto: function (blob) {
        return new Promise(function (res, rej) {
          var fr = new FileReader();
          fr.onload  = function () { res(fr.result); };
          fr.onerror = function () { rej(new Error('no se pudo leer el blob')); };
          fr.readAsDataURL(blob);
        });
      },
      borrarFoto: function () { return Promise.resolve(); }
    };
  }

  function abrirPanel() {
    return abrirPagina('../admin.html').then(function (f) {
      var w = f.contentWindow, d = f.contentDocument;
      w.NUBE_PANEL = nubeFalsa();
      d.querySelector('#mail').value  = 'prueba@local';
      d.querySelector('#clave').value = 'lo-que-sea';
      d.querySelector('#form-acceso').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));

      /* entrar ahora pasa por una promesa (va a buscar el contenido),
         así que hay que esperar a que el panel esté realmente abierto */
      return new Promise(function (res, rej) {
        var limite = Date.now() + 4000;
        (function mirar() {
          if (d.querySelector('#panel').classList.contains('activo')) {
            return res({ marco: f, win: w, doc: d });
          }
          if (Date.now() > limite) {
            return rej(new Error('el panel no abrió: ' +
              (d.querySelector('#error-acceso').textContent || 'sin motivo')));
          }
          setTimeout(mirar, 20);
        })();
      });
    });
  }

  /* ==========================================================
     CONTENIDO
     ========================================================== */
  grupo('Contenido', function () {

    prueba('datos.js define window.DATOS_SITIO', function () {
      esperar(typeof window.DATOS_SITIO).aSer('object');
    });

    prueba('están todas las secciones que el sitio espera', function () {
      var d = window.DATOS_SITIO;
      ['marca', 'contacto', 'hero', 'stats', 'servicios', 'categorias',
       'productos', 'proceso', 'faq', 'secciones'].forEach(function (k) {
        esperar(d[k] !== undefined && d[k] !== null).aSerVerdadero();
      });
    });

    prueba('SEGURIDAD · datos.js no lleva ninguna clave adentro', function () {
      var texto = JSON.stringify(window.DATOS_SITIO).toLowerCase();
      esperar(texto).aNoContener('"admin"');
      esperar(texto).aNoContener('clave');
      esperar(texto).aNoContener('password');
    });

    prueba('cada producto tiene id único', function () {
      var ids = window.DATOS_SITIO.productos.map(function (p) { return p.id; });
      esperar(ids.filter(Boolean).length).aSer(ids.length);
      esperar(new Set(ids).size).aSer(ids.length);
    });

    prueba('las categorías de los productos existen en la lista', function () {
      var cats = window.DATOS_SITIO.categorias;
      window.DATOS_SITIO.productos.forEach(function (p) {
        if (!p.categoria) return;
        if (cats.indexOf(p.categoria) === -1) {
          throw new Error('"' + p.nombre + '" usa la categoría "' + p.categoria + '", que no está en la lista');
        }
      });
    });

    prueba('el WhatsApp es solo números y tiene largo de teléfono real', function () {
      var n = String(window.DATOS_SITIO.contacto.whatsapp);
      esperar(/^\d+$/.test(n)).aSerVerdadero();
      esperar(n.length).aSerMayorQue(9);
      esperar(n.length).aSerMenorQue(16);
    });

    prueba('las categorías no vienen repetidas', function () {
      /* El panel arma la lista partiendo un texto por comas, así que una
         coma de más o un nombre escrito dos veces pasa sin protestar y
         después salen dos botones iguales en el filtro. */
      var cats = window.DATOS_SITIO.categorias;
      var normalizadas = cats.map(function (c) { return String(c).trim().toLowerCase(); });
      esperar(normalizadas.filter(Boolean).length).aSer(cats.length);
      esperar(new Set(normalizadas).size).aSer(cats.length);
    });
  });

  /* ==========================================================
     SITIO PÚBLICO
     ========================================================== */
  grupo('Sitio público', function () {

    prueba('carga sin errores en la consola', function () {
      var errores = [];
      return abrirPagina('../index.html').then(function (f) {
        f.contentWindow.addEventListener('error', function (e) { errores.push(e.message); });
        return esperarUnPoco(150).then(function () {
          esperar(errores.join(' | ')).aSer('');
        });
      });
    });

    prueba('muestra la marca y el título de portada', function () {
      return abrirPagina('../index.html').then(function (f) {
        var d = f.contentDocument;
        esperar(d.querySelector('#logo-nav').textContent).aContener(window.DATOS_SITIO.marca.logo);
        var titulo = d.querySelector('#hero-titulo').textContent.replace(/\s+/g, ' ');
        var esperado = window.DATOS_SITIO.hero.titulo.split(' ')[0];
        esperar(titulo).aContener(esperado);
      });
    });

    prueba('REGRESIÓN · el contenido de portada se revela sin scrollear', function () {
      /* El sitio dependía del IntersectionObserver para hacerse visible: si no
         disparaba, el texto quedaba invisible para siempre. Después el reemplazo
         con requestAnimationFrame tenía exactamente el mismo problema.

         Se revisa la clase, no la opacidad: la opacidad la mueve una transición
         CSS, y una transición no avanza si el navegador no está pintando la
         página. Medir eso sería medir el motor de animación, no este código. */
      return abrirPagina('../index.html').then(function (f) {
        var d = f.contentDocument;
        ['#hero-kicker', '#hero-titulo', '#hero-bajada', '#hero-meta'].forEach(function (sel) {
          var n = d.querySelector(sel);
          if (!n.classList.contains('visible')) {
            throw new Error(sel + ' se quedó sin revelar: el visitante no vería nada');
          }
        });
      });
    });

    prueba('REGRESIÓN · revelado equivale a opacidad total', function () {
      /* Complemento del test anterior: que la clase exista no sirve de nada si
         la regla CSS no deja el elemento visible. Se apaga la transición para
         leer el estado final sin depender de que se pinten cuadros. */
      return abrirPagina('../index.html').then(function (f) {
        var w = f.contentWindow, d = f.contentDocument;
        var n = d.querySelector('#hero-titulo');
        n.style.transition = 'none';
        esperar(w.getComputedStyle(n).opacity).aSer('1');
        esperar(w.getComputedStyle(n).clipPath).aNoContener('100%');
      });
    });

    prueba('REGRESIÓN · lo de abajo espera hasta entrar en pantalla', function () {
      /* La contracara del test anterior: si todo se revelara de entrada, la
         animación no existiría. Confirma que el revelado sigue atado a la
         posición del elemento.

         Acá se mueve el elemento hacia la pantalla en vez de scrollear la
         página. Motivo: un iframe fuera de vista ignora scrollTo(),
         documentElement.scrollTop y scrollIntoView() por igual — se probó
         los tres y el scroll queda en 0. Agrandar la ventana tampoco sirve,
         porque el hero mide 100svh y crece junto con ella, empujando todo
         hacia abajo. Moviendo el elemento se recorre el mismo camino real:
         evento de scroll → revisar() → medir posición → revelar. */
      var lejos;
      return abrirPagina('../index.html').then(function (f) {
        var d = f.contentDocument;
        lejos = d.querySelector('#faq [data-reveal], #contacto [data-reveal]');
        esperar(!!lejos).aSerVerdadero();
        esperar(lejos.classList.contains('visible')).aSerFalso();

        lejos.style.position = 'fixed';
        lejos.style.top = '10px';
        f.contentWindow.dispatchEvent(new Event('scroll'));

        return esperarA(function () {
          return lejos.classList.contains('visible');
        }, 'entró en pantalla y el contenido siguió oculto');
      });
    });

    prueba('REGRESIÓN · en celular el botón de WhatsApp entra sin scrollear', function () {
      /* El cubo 3D iba primero en mobile y empujaba el título y el CTA
         abajo del fold: se veía solo una animación. */
      var f = document.createElement('iframe');
      f.style.cssText = 'position:absolute;left:-10000px;top:0;width:390px;height:760px;border:0';
      /* El `test=` no es decorativo y no alcanza con que lo tengan las
         otras: sin él, contenido.js sale a buscar a la nube de verdad y
         guarda lo que trae en localStorage. Esta prueba no se entera
         —mide dónde cae el botón, no cuántos productos hay— pero la
         siguiente abre el sitio y cuenta los productos del negocio en
         vez de los de datos.js. Fallaba «esperaba 6 pero vino 7», y solo
         cuando Supabase contestaba rápido: con la red lenta pasaba. */
      f.src = '../index.html?movil=1&test=1';
      marcosAbiertos.push(f);
      return new Promise(function (res, rej) {
        f.onload = function () { res(); };
        f.onerror = function () { rej(new Error('no cargó')); };
        document.body.appendChild(f);
      }).then(function () {
        return esperarUnPoco(200);
      }).then(function () {
        var d = f.contentDocument;
        var cta = d.querySelector('#hero-cta1').getBoundingClientRect();
        var titulo = d.querySelector('#hero-titulo').getBoundingClientRect();
        esperar(titulo.top).aSerMenorQue(760);
        esperar(cta.bottom).aSerMenorQue(760);
      });
    });

    prueba('lista todos los productos visibles', function () {
      return abrirPagina('../index.html').then(function (f) {
        var visibles = window.DATOS_SITIO.productos.filter(function (p) { return p.visible !== false; });
        esperar(f.contentDocument.querySelectorAll('.producto').length).aSer(visibles.length);
      });
    });

    prueba('esconde los productos marcados como no visibles', function () {
      var c = contenidoBase();
      c.productos[0].visible = false;
      var oculto = c.productos[0].nombre;
      sembrar(c);
      return abrirPagina('../index.html').then(function (f) {
        var textos = f.contentDocument.querySelector('#grilla').textContent;
        esperar(textos).aNoContener(oculto);
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('apagar una sección la saca del sitio', function () {
      var c = contenidoBase();
      c.secciones.faq = false;
      c.secciones.proceso = false;
      sembrar(c);
      return abrirPagina('../index.html').then(function (f) {
        esperar(f.contentDocument.querySelector('#faq').hidden).aSerVerdadero();
        esperar(f.contentDocument.querySelector('#proceso').hidden).aSerVerdadero();
        esperar(f.contentDocument.querySelector('#catalogo').hidden).aSerFalso();
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('los filtros de categoría dejan solo lo que corresponde', function () {
      return abrirPagina('../index.html').then(function (f) {
        var d = f.contentDocument;
        var botones = d.querySelectorAll('.filtro');
        var cat = botones[1].dataset.cat;
        botones[1].click();
        var esperados = window.DATOS_SITIO.productos.filter(function (p) {
          return p.visible !== false && p.categoria === cat;
        }).length;
        esperar(d.querySelectorAll('.producto').length).aSer(esperados);
      });
    });

    prueba('ningún filtro de categoría lleva a una grilla vacía', function () {
      /* Los botones se arman solo con las categorías que tienen piezas.
         Si esa poda se rompe, el cliente toca un filtro y se encuentra
         con el cartel de "no hay piezas todavía". */
      return abrirPagina('../index.html').then(function (f) {
        var d = f.contentDocument;
        var botones = Array.prototype.slice.call(d.querySelectorAll('.filtro'));
        esperar(botones.length).aSerMayorQue(1);
        botones.forEach(function (b) {
          b.click();
          if (!d.querySelectorAll('.producto').length) {
            throw new Error('el filtro "' + b.dataset.cat + '" no muestra ninguna pieza');
          }
        });
      });
    });

    prueba('REGRESIÓN · el nombre de la marca no rompe la barra en celular', function () {
      /* El nombre lo escribe el dueño desde el panel y ninguna pantalla es
         más chica que la de un celular. Con nowrap, un nombre que no entra
         no se pisa con la hamburguesa: empuja la barra y la hamburguesa se
         va afuera de la pantalla, con scroll horizontal en todo el sitio.
         Eso es lo que se mide — se comprobó que un nombre largo manda la
         hamburguesa a 591px en una pantalla de 375.

         El conteo de renglones es el respaldo: hoy el CSS tiene nowrap,
         así que no puede partirse. Si alguien lo saca, el nombre envuelve
         adentro de una barra de 70px fijos y el desborde deja de notarse.
         Se cuentan rectángulos de un Range (uno por línea) y no alturas:
         la interlínea de esta tipografía es más apretada que el cuerpo, y
         dos renglones no llegan a medir el doble que uno. */
      var ANCHO = 375;
      return abrirPaginaAncho('../index.html', ANCHO, 760).then(function (f) {
        var d = f.contentDocument;
        var texto  = d.querySelector('#logo-nav b');
        var burger = d.querySelector('#burger').getBoundingClientRect();

        if (burger.right > ANCHO + 0.5) {
          throw new Error('con el nombre "' + texto.textContent + '" la hamburguesa ' +
                          'termina en ' + Math.round(burger.right) + 'px de una pantalla de ' +
                          ANCHO + 'px: queda afuera y no se puede tocar el menú');
        }

        if (d.documentElement.scrollWidth > ANCHO + 1) {
          throw new Error('el sitio se va de ancho: ' + d.documentElement.scrollWidth +
                          'px en una pantalla de ' + ANCHO + 'px, se scrollea para el costado');
        }

        var rango = d.createRange();
        rango.selectNodeContents(texto);
        var renglones = rango.getClientRects().length;
        if (renglones !== 1) {
          throw new Error('"' + texto.textContent + '" ocupa ' + renglones +
                          ' renglones en la barra: tiene que entrar en uno');
        }
      });
    });

    prueba('la franja de números se reparte entera, sean 2, 3 o 4', function () {
      /* Antes la fila era de 4 columnas fijas: al sacar números quedaban
         apretados contra la izquierda con un hueco al lado. Como el dueño
         los agrega y los saca desde el panel, se prueban las tres cantidades. */
      function medir(cuantos) {
        var c = contenidoBase();
        c.stats = [
          { valor: '48', unidad: 'hs', etiqueta: 'Entrega' },
          { valor: '12', unidad: '+',  etiqueta: 'Colores' },
          { valor: '3',  unidad: '',   etiqueta: 'Años' },
          { valor: '99', unidad: '%',  etiqueta: 'Contentos' }
        ].slice(0, cuantos);
        sembrar(c);
        return abrirPagina('../index.html').then(function (f) {
          var d = f.contentDocument;
          var fila = d.querySelector('#stats').getBoundingClientRect().width;
          var cajas = Array.prototype.slice.call(d.querySelectorAll('.stat'));
          esperar(cajas.length).aSer(cuantos);
          var suma = cajas.reduce(function (t, n) { return t + n.getBoundingClientRect().width; }, 0);
          if (Math.abs(suma - fila) > 2) {
            throw new Error('con ' + cuantos + ' números la fila mide ' + Math.round(fila) +
                            'px y lo ocupado suma ' + Math.round(suma) + 'px: queda un hueco');
          }
        });
      }
      return medir(2).then(function () { return medir(3); })
                     .then(function () { return medir(4); })
                     .then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('sin números cargados la franja no aparece', function () {
      var c = contenidoBase();
      c.stats = [];
      sembrar(c);
      return abrirPagina('../index.html').then(function (f) {
        esperar(f.contentDocument.querySelector('#bloque-stats').hidden).aSerVerdadero();
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('el botón de WhatsApp arma bien el link', function () {
      return abrirPagina('../index.html').then(function (f) {
        var href = f.contentDocument.querySelector('#flotante').href;
        esperar(href).aContener('https://wa.me/' + window.DATOS_SITIO.contacto.whatsapp);
        esperar(href).aContener('?text=');
      });
    });

    prueba('cada producto abre WhatsApp con su propio nombre escrito', function () {
      return abrirPagina('../index.html').then(function (f) {
        var d = f.contentDocument;
        var primero = window.DATOS_SITIO.productos.filter(function (p) { return p.visible !== false; })[0];
        var href = decodeURIComponent(d.querySelector('.producto__pedir').href);
        esperar(href).aContener(primero.nombre);
      });
    });

    prueba('un número de WhatsApp con espacios y símbolos igual funciona', function () {
      var c = contenidoBase();
      c.contacto.whatsapp = '+54 9 11 2233-4455';
      sembrar(c);
      return abrirPagina('../index.html').then(function (f) {
        esperar(f.contentDocument.querySelector('#flotante').href).aContener('https://wa.me/5491122334455');
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('REGRESIÓN · el sitio no se scrollea para el costado en ninguna pantalla', function () {
      /* La grilla de servicios pedía columnas de 320px fijos. En una pantalla
         de 320px el contenedor mide 278, así que la tarjeta empujaba el sitio
         hasta hacerlo scrollear para el costado — se medía 336px de contenido
         en 320 de pantalla. Lo mismo, más chico, con la grilla de productos.

         Se barren varios anchos y no uno solo porque el problema aparecía
         justo abajo de cierto tamaño y arriba de ese punto no se veía nada. */
      var ANCHOS = [300, 320, 360, 414, 768, 1280];
      return ANCHOS.reduce(function (cadena, ancho) {
        return cadena.then(function () {
          return abrirPaginaAncho('../index.html', ancho, 900).then(function (f) {
            var d = f.contentDocument;
            if (d.documentElement.scrollWidth > ancho + 1) {
              throw new Error('en ' + ancho + 'px de pantalla el contenido mide ' +
                              d.documentElement.scrollWidth + 'px: se scrollea para el costado');
            }
          });
        });
      }, Promise.resolve());
    });

    prueba('las tarjetas no se salen de la caja del contenido', function () {
      /* Complemento del anterior: una tarjeta puede pasarse del contenedor
         sin llegar a generar scroll, y ahí solo se ve desalineada. */
      return abrirPaginaAncho('../index.html', 320, 900).then(function (f) {
        var d = f.contentDocument;
        var caja = d.querySelector('#catalogo .contenedor').getBoundingClientRect();
        var fuera = Array.prototype.filter.call(d.querySelectorAll('.tarjeta'), function (n) {
          return n.getBoundingClientRect().right > caja.right + 1;
        });
        if (fuera.length) {
          throw new Error(fuera.length + ' tarjetas se pasan del contenedor, que termina en ' +
                          Math.round(caja.right) + 'px');
        }
      });
    });

    prueba('REGRESIÓN · sin WhatsApp cargado no queda ningún botón muerto', function () {
      /* Es el campo más importante del panel y el que más fácil queda vacío.
         Antes los botones seguían dibujados con href="#": el cliente tocaba
         "Pedir por WhatsApp" y volvía al principio de la página sin entender
         nada. Eran 10 botones así. Ahora no se dibuja ninguno. */
      var c = contenidoBase();
      c.contacto.whatsapp = '';
      sembrar(c);
      return abrirPagina('../index.html').then(function (f) {
        var d = f.contentDocument;

        var muertos = Array.prototype.filter.call(d.querySelectorAll('a'), function (a) {
          return a.getAttribute('href') === '#';
        });
        if (muertos.length) {
          throw new Error(muertos.length + ' links no llevan a ningún lado: "' +
                          muertos.map(function (a) { return a.textContent.trim(); }).join('", "') + '"');
        }

        esperar(d.querySelectorAll('.producto__pedir').length).aSer(0);
        esperar(!!d.querySelector('#flotante')).aSerFalso();
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('sin WhatsApp el dueño ve un aviso y el catálogo sigue en pie', function () {
      /* El sitio sin número queda prolijo pero inútil: si no avisara, el
         dueño no tendría cómo darse cuenta. Ahora que el panel está
         publicado, el aviso ya no puede depender de estar en local: se
         muestra a quien tenga una sesión abierta, que es el dueño. */
      var c = contenidoBase();
      c.contacto.whatsapp = '';
      sembrar(c);
      localStorage.setItem('tinta-fundida:sesion-nube', '{"mail":"prueba@local"}');

      var soltar = function () {
        limpiar();
        localStorage.removeItem('tinta-fundida:sesion-nube');
      };

      return abrirPagina('../index.html').then(function (f) {
        var d = f.contentDocument;
        var aviso = d.querySelector('.aviso-falta');
        esperar(!!aviso).aSerVerdadero();
        esperar(aviso.textContent.toLowerCase()).aContener('whatsapp');
        /* que el resto del sitio no se caiga por eso */
        esperar(d.querySelectorAll('.producto').length).aSerMayorQue(0);
      }).then(soltar, function (e) { soltar(); throw e; });
    });

    prueba('un cliente cualquiera no ve el aviso de que falta el WhatsApp', function () {
      /* Es un recado interno. Al visitante no le dice nada y encima le
         muestra que el negocio tiene algo a medio configurar. */
      var c = contenidoBase();
      c.contacto.whatsapp = '';
      sembrar(c);
      localStorage.removeItem('tinta-fundida:sesion-nube');
      return abrirPagina('../index.html').then(function (f) {
        esperar(!!f.contentDocument.querySelector('.aviso-falta')).aSerFalso();
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('con WhatsApp cargado no aparece ningún aviso de faltante', function () {
      return abrirPagina('../index.html').then(function (f) {
        esperar(!!f.contentDocument.querySelector('.aviso-falta')).aSerFalso();
        esperar(!!f.contentDocument.querySelector('#flotante')).aSerVerdadero();
      });
    });

    prueba('con una sola categoría no se dibuja la barra de filtros', function () {
      /* Un botón "Todo" solo no filtra nada: es un control que no hace nada. */
      var c = contenidoBase();
      c.categorias = ['Deco'];
      c.productos.forEach(function (p) { p.categoria = 'Deco'; });
      sembrar(c);
      return abrirPagina('../index.html').then(function (f) {
        var d = f.contentDocument;
        esperar(d.querySelector('#filtros').hidden).aSerVerdadero();
        esperar(d.querySelectorAll('.filtro').length).aSer(0);
        esperar(d.querySelectorAll('.producto').length).aSerMayorQue(0);
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('el acordeón de preguntas abre y cierra', function () {
      /* Se apaga la transición y se lee grid-template-rows: medir el alto
         a secas da 0 siempre, porque la animación no avanza si el navegador
         no está pintando la página. */
      return abrirPagina('../index.html').then(function (f) {
        var d = f.contentDocument, w = f.contentWindow;
        var boton = d.querySelector('.faq__boton');
        var panel = d.querySelector('.faq__panel');
        panel.style.transition = 'none';

        esperar(boton.getAttribute('aria-expanded')).aSer('false');
        esperar(panel.getBoundingClientRect().height).aSer(0);

        boton.click();
        esperar(boton.getAttribute('aria-expanded')).aSer('true');
        esperar(panel.getBoundingClientRect().height).aSerMayorQue(10);

        boton.click();
        esperar(boton.getAttribute('aria-expanded')).aSer('false');
        esperar(panel.getBoundingClientRect().height).aSer(0);
      });
    });

    prueba('el menú de celular abre, cierra y se cierra al elegir', function () {
      return abrirPaginaAncho('../index.html', 375, 760).then(function (f) {
        var d = f.contentDocument;
        var burger = d.querySelector('#burger'), menu = d.querySelector('#menu');

        esperar(burger.getAttribute('aria-expanded')).aSer('false');
        burger.click();
        esperar(burger.getAttribute('aria-expanded')).aSer('true');
        esperar(menu.classList.contains('abierta')).aSerVerdadero();

        /* tocar un link tiene que cerrarlo: si no, tapa la sección a la que
           acabás de saltar */
        menu.querySelector('a').click();
        esperar(menu.classList.contains('abierta')).aSerFalso();
        esperar(burger.getAttribute('aria-expanded')).aSer('false');
      });
    });

    prueba('todos los links del menú llevan a una sección que existe', function () {
      return abrirPagina('../index.html').then(function (f) {
        var d = f.contentDocument;
        var rotos = Array.prototype.map.call(d.querySelectorAll('a[href^="#"]'), function (a) {
          return a.getAttribute('href');
        }).filter(function (h) {
          return h !== '#' && !d.querySelector(h);
        });
        if (rotos.length) throw new Error('apuntan a la nada: ' + rotos.join(', '));
      });
    });

    prueba('la página está bien armada por dentro', function () {
      /* Chequeos de estructura que se rompen sin hacer ruido: un id repetido
         hace que el sitio agarre el elemento equivocado, y una foto sin alt
         deja al lector de pantalla sin nada que decir. */
      return abrirPagina('../index.html').then(function (f) {
        var d = f.contentDocument;

        var vistos = {}, repetidos = [];
        Array.prototype.forEach.call(d.querySelectorAll('[id]'), function (n) {
          if (vistos[n.id]) repetidos.push(n.id);
          vistos[n.id] = true;
        });
        if (repetidos.length) throw new Error('ids repetidos: ' + repetidos.join(', '));

        esperar(d.querySelectorAll('h1').length).aSer(1);
        esperar(d.documentElement.lang).aSer('es');

        var sinAlt = Array.prototype.filter.call(d.querySelectorAll('img'), function (i) {
          return !i.getAttribute('alt');
        });
        esperar(sinAlt.length).aSer(0);

        var mudos = Array.prototype.filter.call(d.querySelectorAll('a, button'), function (n) {
          return !(n.textContent.trim() || n.getAttribute('aria-label') || n.title);
        });
        if (mudos.length) throw new Error(mudos.length + ' links o botones sin texto ni etiqueta');
      });
    });

    prueba('sin Instagram cargado no queda un icono muerto', function () {
      /* Mientras el dueño no ponga su usuario, el icono no tiene que
         existir: un icono que no lleva a ningún lado es peor que ninguno. */
      var c = contenidoBase();
      c.contacto.instagram = '';
      c.contacto.tiktok = '';
      c.contacto.email = '';
      sembrar(c);
      return abrirPagina('../index.html').then(function (f) {
        var d = f.contentDocument;
        esperar(d.querySelectorAll('#redes .red').length).aSer(1); // solo WhatsApp
        esperar(d.querySelector('#redes').innerHTML).aNoContener('instagram.com');
        esperar(d.querySelector('#pie-contacto').textContent).aNoContener('Instagram');
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('el icono de Instagram apunta a la cuenta, con o sin arroba', function () {
      /* El dueño lo va a escribir de las dos formas. Las dos tienen que
         llevar al mismo lado y sin el @ pegado en la dirección. */
      function probar(comoLoEscribe) {
        var c = contenidoBase();
        c.contacto.instagram = comoLoEscribe;
        sembrar(c);
        return abrirPagina('../index.html').then(function (f) {
          var a = f.contentDocument.querySelector('#redes .red[href*="instagram"]');
          esperar(!!a).aSerVerdadero();
          esperar(a.getAttribute('href')).aSer('https://instagram.com/tintafundida');
          esperar(a.getAttribute('aria-label')).aContener('@tintafundida');
          esperar(!!a.querySelector('svg')).aSerVerdadero();
          esperar(a.target).aSer('_blank');
          esperar(a.rel).aContener('noopener');
        });
      }
      return probar('tintafundida')
        .then(function () { return probar('@tintafundida'); })
        .then(function () { return probar('  @tintafundida  '); })
        .then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('SEGURIDAD · un usuario de Instagram raro no se escapa del dominio', function () {
      /* El usuario sale de un campo de texto libre. Sin codificar, algo como
         "../../otrositio" o unas comillas convierten el link en otra cosa. */
      var c = contenidoBase();
      c.contacto.instagram = '../../sitio-falso.com/x" onclick="window.__hackeado=1';
      sembrar(c);
      return abrirPagina('../index.html').then(function (f) {
        return esperarUnPoco(150).then(function () {
          var a = f.contentDocument.querySelector('#redes .red[href*="instagram"]');
          esperar(!!a).aSerVerdadero();
          var href = a.getAttribute('href');
          esperar(href.indexOf('https://instagram.com/') === 0).aSerVerdadero();
          esperar(href).aNoContener('/../');
          esperar(href).aNoContener('"');
          esperar(a.getAttribute('onclick')).aSer(null);
          esperar(f.contentWindow.__hackeado).aSer(undefined);
        });
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('el número de WhatsApp se muestra separado y legible', function () {
      /* Se guarda pegado porque así es más difícil que el dueño lo escriba
         mal, pero "+5492494250859" de corrido no lo lee nadie. */
      function conNumero(numero, esperado) {
        var c = contenidoBase();
        c.contacto.whatsapp = numero;
        sembrar(c);
        return abrirPagina('../index.html').then(function (f) {
          var texto = f.contentDocument.querySelector('#pie-contacto').textContent;
          esperar(texto).aContener(esperado);
          /* el link, en cambio, va siempre con los números pelados */
          esperar(f.contentDocument.querySelector('#flotante').href)
            .aContener('wa.me/' + numero.replace(/\D/g, ''));
        });
      }
      return conNumero('5492494250859', '+54 9 249 425-0859')   /* Tandil, área de 3 */
        .then(function () { return conNumero('5491122334455', '+54 9 11 2233-4455'); })
        .then(function () { return conNumero('542664250859',  '+54 266 425-0859'); })
        .then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('REGRESIÓN · en celular el cubo usa las medidas chicas', function () {
      /* Las reglas de celular del cubo estaban escritas antes que las de
         escritorio en la hoja de estilos. Pesan igual, así que ganaba la
         última: el cubo nunca se achicaba y todo ese bloque era letra
         muerta. Se mide el valor que el navegador termina aplicando. */
      return abrirPaginaAncho('../index.html', 375, 760).then(function (f) {
        var w = f.contentWindow;
        var cubo = w.getComputedStyle(f.contentDocument.querySelector('.cubo')).width;
        if (cubo !== '130px') {
          throw new Error('en celular el cubo mide ' + cubo + ' y tendría que medir 130px: ' +
                          'las reglas de pantalla chica no le están llegando');
        }
      }).then(function () {
        return abrirPaginaAncho('../index.html', 1280, 900).then(function (f) {
          esperar(f.contentWindow.getComputedStyle(
            f.contentDocument.querySelector('.cubo')).width).aSer('190px');
        });
      });
    });

    prueba('la pieza se imprime de abajo hacia arriba y el cabezal la sigue', function () {
      /* La animación se muestrea parándola en distintos momentos, que es la
         única forma de medirla: una transición no avanza sola si el
         navegador no está pintando la página.

         Que el cabezal acompañe importa más que la pieza en sí: si van
         cada uno por su lado, se ve una línea barriendo al pedo. */
      return abrirPagina('../index.html').then(function (f) {
        var d = f.contentDocument;
        var pared = d.querySelector('.pieza__pared');
        var cabezal = d.querySelector('.escena__cabezal');
        esperar(d.querySelectorAll('.pieza__pared').length).aSer(4);

        if (!pared.getAnimations) return;   /* navegador viejo: no se mide */

        var anims = [].concat(pared.getAnimations(), cabezal.getAnimations());
        esperar(anims.length).aSerMayorQue(1);
        anims.forEach(function (a) { a.pause(); });

        function alto(ms) {
          anims.forEach(function (a) { a.currentTime = ms; });
          return {
            pieza: pared.getBoundingClientRect().height,
            cabezal: cabezal.getBoundingClientRect().top
          };
        }

        var arranque = alto(450), mitad = alto(3150), fin = alto(6300);

        if (!(arranque.pieza < mitad.pieza && mitad.pieza < fin.pieza)) {
          throw new Error('la pieza no crece: ' + [arranque.pieza, mitad.pieza, fin.pieza].join(' → '));
        }
        /* el cabezal sube, o sea que su posición en pantalla baja de valor */
        if (!(arranque.cabezal > mitad.cabezal && mitad.cabezal > fin.cabezal)) {
          throw new Error('el cabezal no acompaña a la pieza: ' +
                          [arranque.cabezal, mitad.cabezal, fin.cabezal].map(Math.round).join(' → '));
        }

        /* y al terminar la vuelta arranca de nuevo desde abajo */
        var reinicio = alto(8990);
        esperar(reinicio.pieza).aSerMenorQue(arranque.pieza + 1);
      });
    });

    prueba('el nombre de la marca queda en el título de la pestaña y en el pie', function () {
      /* Cuando se cambia el nombre del negocio es fácil que quede el viejo
         escondido en algún lado. Esto lo agarra. */
      return abrirPagina('../index.html').then(function (f) {
        var nombre = window.DATOS_SITIO.marca.nombre;
        esperar(f.contentDocument.title).aContener(nombre);
        esperar(f.contentDocument.querySelector('#pie-copy').textContent).aContener(nombre);
      });
    });

    prueba('SEGURIDAD · el texto del cliente no puede inyectar HTML', function () {
      var c = contenidoBase();
      c.productos[0].nombre = '<img src=x onerror="window.__hackeado=1">';
      c.productos[0].desc = '<script>window.__hackeado=1<\/script>';
      sembrar(c);
      return abrirPagina('../index.html').then(function (f) {
        return esperarUnPoco(150).then(function () {
          esperar(f.contentWindow.__hackeado).aSer(undefined);
          esperar(f.contentDocument.querySelector('#grilla').querySelectorAll('img[src="x"]').length).aSer(0);
        });
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('SEGURIDAD · el index.html publicado no lleva ninguna clave', function () {
      /* Que el index nombre al panel ya no importa: el panel está
         publicado y el candado es visible a propósito. Lo que sigue
         importando, y para siempre, es que en el archivo que queda en
         el servidor no viaje ninguna contraseña. */
      return fetch('../index.html').then(function (r) { return r.text(); })
        .then(function (fuente) {
          esperar(fuente.toLowerCase()).aNoContener('password');
          esperar(fuente).aNoContener('CLAVE_ADMIN');
          /* la única clave que puede estar es la publicable, y ni
             siquiera está acá: vive en js/nube.js */
          esperar(fuente).aNoContener('service_role');
        });
    });

    prueba('el candado del panel está en el sitio publicado', function () {
      return abrirPagina('../index.html').then(function (f) {
        var c = f.contentDocument.querySelector('.candado');
        esperar(!!c).aSerVerdadero();
        esperar(c.getAttribute('href')).aSer('admin.html');
        esperar(c.getAttribute('aria-label')).aContener('Panel');
      });
    });

    prueba('el candado no depende de dónde esté corriendo el sitio', function () {
      /* Antes el candado se escondía fuera de la computadora del dueño,
         y era necesario: la clave estaba escrita en un archivo y lo
         único que la protegía era que ese archivo no se publicara.

         Ahora esconderlo no protegería nada —la contraseña la verifica
         el servidor— y rompería lo único que se quiso ganar: que el
         dueño pueda entrar desde el celular. Esta prueba existe para
         que a nadie se le ocurra volver a ponerle una condición. */
      return fetch('../js/sitio.js').then(function (r) { return r.text(); })
        .then(function (fuente) {
          if (/var local\s*=/.test(fuente)) {
            throw new Error('volvió la condición que escondía el candado fuera de local');
          }
          esperar(fuente).aContener("el('a', 'candado')");
        });
    });

    prueba('ya no existe el aviso de "cambios sin publicar"', function () {
      /* Se lo llevó el backend: lo que el dueño guarda ya está publicado,
         no hay un segundo paso que recordarle. Dejar el cartel sería
         asustarlo por algo que no es un problema. */
      var c = contenidoBase();
      c.marca.nombre = 'Cualquier cosa';
      sembrar(c);
      return abrirPagina('../index.html').then(function (f) {
        esperar(!!f.contentDocument.querySelector('.aviso-borrador')).aSerFalso();
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('la copia local se usa cuando el servidor no contesta', function () {
      /* La garantía de que esto no se cae. Las pruebas ya corren sin
         tocar la red, así que esta situación es exactamente la de
         alguien entrando con el servicio caído: tiene que ver el sitio
         completo igual. */
      var c = contenidoBase();
      c.marca.nombre = 'Guardado de antes';
      sembrar(c);
      return abrirPagina('../index.html').then(function (f) {
        var d = f.contentDocument;
        esperar(d.querySelector('#logo-nav').textContent.length).aSerMayorQue(0);
        esperar(d.querySelectorAll('.producto').length).aSerMayorQue(0);
        esperar(d.title).aContener('Guardado de antes');
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('aguanta un borrador viejo al que le faltan campos', function () {
      sembrar({ marca: { nombre: 'Viejo', logo: 'V', logoSufijo: '3D', slogan: 's' },
                contacto: { whatsapp: '5491122334455' }, hero: {} });
      return abrirPagina('../index.html').then(function (f) {
        esperar(f.contentDocument.querySelector('#logo-nav').textContent).aContener('V');
        esperar(f.contentDocument.body.textContent.length).aSerMayorQue(20);
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });
  });

  /* ==========================================================
     COMPARTIR Y BUSCADORES
     Lo que pasa cuando el sitio se ve desde afuera: pegado en un
     chat, rastreado por Google o abierto en una dirección que no
     existe. Nada de esto se nota mirando la página, así que si se
     rompe no hay quien lo vea. De ahí que estén estas pruebas.
     ========================================================== */
  grupo('Compartir y buscadores', function () {

    function fichaDe(f) {
      var n = f.contentDocument.querySelector('script[type="application/ld+json"]');
      if (!n) throw new Error('no se armó la ficha de Google');
      return JSON.parse(n.textContent);
    }

    prueba('el link pegado en un chat muestra miniatura, título y bajada', function () {
      /* Sin estas cuatro etiquetas WhatsApp muestra la dirección pelada.
         Es la diferencia entre un link que invita y uno que da desconfianza. */
      return abrirPagina('../index.html').then(function (f) {
        var d = f.contentDocument;
        ['og:title', 'og:description', 'og:image', 'og:url'].forEach(function (p) {
          var m = d.querySelector('meta[property="' + p + '"]');
          if (!m || !m.content.trim()) throw new Error('falta ' + p);
        });
        esperar(d.querySelector('meta[name="twitter:card"]').content).aSer('summary_large_image');

        /* Quien lee esto entra de afuera: una ruta relativa no le sirve */
        var img = d.querySelector('meta[property="og:image"]').content;
        esperar(img.indexOf('https://')).aSer(0);
        esperar(img).aContener('imagenes/compartir.png');
      });
    });

    prueba('la imagen de compartir existe y mide lo que espera WhatsApp', function () {
      /* 1200x630 es la medida que las apps recortan sin deformar. Si
         alguien la reemplaza por una foto del celular, esto avisa. */
      return new Promise(function (res, rej) {
        var img = new Image();
        img.onload = function () { res(img); };
        img.onerror = function () { rej(new Error('no se pudo cargar imagenes/compartir.png')); };
        img.src = '../imagenes/compartir.png?t=' + Date.now();
      }).then(function (img) {
        esperar(img.naturalWidth).aSer(1200);
        esperar(img.naturalHeight).aSer(630);
      });
    });

    prueba('REGRESIÓN · el título de compartir no se despega de datos.js', function () {
      /* Estas etiquetas están escritas a mano en el HTML porque WhatsApp
         no ejecuta JavaScript. El precio de eso es que no se enteran de
         un cambio de nombre — y la marca ya se renombró una vez. Esta
         prueba es la que se entera por ellas. */
      return abrirPagina('../index.html').then(function (f) {
        var d = f.contentDocument;
        var nombre = window.DATOS_SITIO.marca.nombre;

        esperar(d.querySelector('meta[property="og:title"]').content).aContener(nombre);
        esperar(d.querySelector('meta[property="og:site_name"]').content).aSer(nombre);
        esperar(d.querySelector('meta[property="og:image:alt"]').content).aContener(nombre);
        esperar(d.title).aContener(nombre);

        /* la bajada de compartir y la que ve Google tienen que ser la misma */
        esperar(d.querySelector('meta[property="og:description"]').content)
          .aSer(d.querySelector('meta[name="description"]').content);
      });
    });

    prueba('la ficha de Google se arma con los datos del dueño', function () {
      limpiar();
      return abrirPagina('../index.html').then(function (f) {
        var ficha = fichaDe(f);
        var c = window.DATOS_SITIO.contacto;

        esperar(ficha['@type']).aSer('LocalBusiness');
        esperar(ficha.name).aSer(window.DATOS_SITIO.marca.nombre);
        esperar(ficha.telephone).aSer('+' + String(c.whatsapp).replace(/\D/g, ''));
        esperar(ficha.address.addressLocality).aSer(c.ciudad.split(',')[0].trim());
        esperar(ficha.address.addressCountry).aSer('AR');
        esperar(ficha.image).aContener('imagenes/compartir.png');
      });
    });

    prueba('el horario escrito a mano se traduce al formato de Google', function () {
      var c = contenidoBase();
      c.contacto.horario = 'Lun a Sáb · 9 a 19 hs';
      sembrar(c);
      return abrirPagina('../index.html').then(function (f) {
        esperar(fichaDe(f).openingHours).aSer('Mo-Sa 09:00-19:00');
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('un horario que no se entiende se omite en vez de inventarse', function () {
      /* Tres formas de escribirlo que el traductor no cubre. En ninguna
         puede quedar un horario a medias: o sale bien o no sale. */
      var casos = ['a convenir', 'Lun a Vie · 9 a 13 y 16 a 20 hs', 'todos los días'];
      return casos.reduce(function (cadena, texto) {
        return cadena.then(function () {
          var c = contenidoBase();
          c.contacto.horario = texto;
          sembrar(c);
          return abrirPagina('../index.html').then(function (f) {
            var ficha = fichaDe(f);
            if ('openingHours' in ficha) {
              throw new Error('con "' + texto + '" publicó ' + ficha.openingHours);
            }
          });
        });
      }, Promise.resolve()).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('lo que el dueño no cargó no aparece en la ficha', function () {
      var c = contenidoBase();
      c.contacto.instagram = '';
      c.contacto.tiktok = '';
      c.contacto.email = '';
      sembrar(c);
      return abrirPagina('../index.html').then(function (f) {
        var ficha = fichaDe(f);
        esperar('sameAs' in ficha).aSerFalso();
        esperar('email' in ficha).aSerFalso();
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('SEGURIDAD · el nombre del negocio no puede romper la ficha', function () {
      /* La ficha es JSON metido dentro de una etiqueta <script>. Un
         "</script>" en el nombre la cerraría antes de tiempo y lo que
         viniera después lo ejecutaría el navegador. */
      var veneno = 'Taller </script><img src=x onerror="window.__roto=1">';
      var c = contenidoBase();
      c.marca.nombre = veneno;
      sembrar(c);
      return abrirPagina('../index.html').then(function (f) {
        var d = f.contentDocument;
        esperar(fichaDe(f).name).aSer(veneno);
        esperar(d.head.querySelectorAll('img').length).aSer(0);
        esperar(f.contentWindow.__roto).aSer(undefined);

        var crudo = d.querySelector('script[type="application/ld+json"]').textContent;
        esperar(crudo).aNoContener('</script>');
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('las direcciones escritas a mano apuntan todas al mismo lugar', function () {
      /* La dirección del sitio está repetida en seis lugares. El día que
         se compre un dominio propio se cambian los seis, y si se olvida
         uno el sitio queda diciendo dos cosas distintas: Google se queda
         con la vieja y la miniatura del chat deja de cargar. */
      var texto = function (u) { return fetch(u).then(function (r) { return r.text(); }); };
      return Promise.all([
        abrirPagina('../index.html'),
        texto('../robots.txt'),
        texto('../sitemap.xml'),
        texto('../404.html')
      ]).then(function (r) {
        var d = r[0].contentDocument;
        var canonica = d.querySelector('link[rel="canonical"]').getAttribute('href');

        esperar(canonica.indexOf('https://')).aSer(0);
        esperar(d.querySelector('meta[property="og:url"]').content).aSer(canonica);
        esperar(d.querySelector('meta[property="og:image"]').content).aContener(canonica);
        esperar(r[1]).aContener(canonica + 'sitemap.xml');
        esperar(r[2]).aContener('<loc>' + canonica + '</loc>');
        esperar(r[3]).aContener(canonica);
      });
    });

    prueba('robots.txt deja pasar el sitio y esconde las pruebas', function () {
      /* La carpeta tests/ se publica junto con el resto (está en el repo
         y GitHub Pages sirve todo). No es secreta, pero no tiene por qué
         aparecer cuando alguien busca el negocio. */
      return fetch('../robots.txt').then(function (r) { return r.text(); })
        .then(function (t) {
          esperar(t).aContener('Disallow: /tests/');
          esperar(t).aContener('Sitemap:');
          esperar(t).aNoContener('Disallow: /\n');
        });
    });

    prueba('la página 404 tiene salida y no se indexa', function () {
      /* Aparece en cualquier dirección inventada, así que no puede
         depender de css/estilo.css: desde /una/ruta/rara las rutas
         relativas apuntan a cualquier lado y quedaría sin diseño. */
      return abrirPagina('../404.html').then(function (f) {
        var d = f.contentDocument;
        esperar(d.querySelector('meta[name="robots"]').content).aContener('noindex');
        esperar(d.body.textContent).aContener('404');

        var salida = d.querySelector('a[href^="https://"]');
        esperar(!!salida).aSerVerdadero();
        esperar(salida.textContent.trim().length).aSerMayorQue(0);

        var afuera = d.querySelectorAll('link[rel="stylesheet"], script[src]');
        if (afuera.length) throw new Error('la 404 depende de ' + afuera.length + ' archivo(s) de afuera');
      });
    });
  });

  /* ==========================================================
     PANEL
     ========================================================== */
  grupo('Panel', function () {

    prueba('rechaza una clave equivocada', function () {
      /* El "no" ahora lo dice el servidor. Lo que se prueba acá es que
         el panel no se abra igual y que el motivo se vea en pantalla:
         un error tragado deja al dueño mirando el formulario sin
         entender por qué no pasa nada. */
      limpiar();
      return abrirPagina('../admin.html').then(function (f) {
        var w = f.contentWindow, d = f.contentDocument;
        w.NUBE_PANEL = {
          hayNube: function () { return true; },
          sesion:  function () { return null; },
          entrar:  function () { return Promise.reject(new Error('Mail o contraseña incorrectos.')); }
        };
        d.querySelector('#mail').value  = 'quien@sea.com';
        d.querySelector('#clave').value = 'cualquier-cosa';
        d.querySelector('#form-acceso').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));

        return new Promise(function (r) { setTimeout(r, 300); }).then(function () {
          esperar(d.querySelector('#panel').classList.contains('activo')).aSerFalso();
          esperar(d.querySelector('#error-acceso').textContent).aContener('incorrectos');
          esperar(d.querySelector('#clave').value).aSer('');   /* no queda escrita */
        });
      });
    });

    prueba('SEGURIDAD · el panel publicado no lleva ninguna contraseña adentro', function () {
      /* La razón de fondo de todo el cambio. Antes la clave estaba
         escrita en js/clave.js y el único motivo por el que servía era
         que ese archivo no se publicaba; con el panel en internet
         cualquiera abría la URL del archivo y la leía.

         Ahora la contraseña la tiene el servidor y no baja nunca. Esta
         prueba revisa los tres archivos que sí se publican y falla si
         alguien vuelve a escribir una clave en el código. */
      var archivos = ['../js/admin.js', '../js/nube.js', '../js/nube-panel.js'];
      return Promise.all(archivos.map(function (a) {
        return fetch(a).then(function (r) { return r.text(); })
          .then(function (t) { return { archivo: a, texto: t }; });
      })).then(function (fuentes) {
        /* Dos cosas se llaman "clave" en este proyecto y no son secretos:
           los nombres de las llaves de localStorage, que llevan dos
           puntos ("tinta-fundida:contenido"), y la clave publicable, que
           es pública por diseño. Todo lo demás que parezca una
           contraseña escrita a mano es un problema. */
        function esInofensivo(valor) {
          return valor.indexOf(':') !== -1 || valor.indexOf('sb_publishable_') === 0;
        }

        fuentes.forEach(function (f) {
          var patron = /(?:clave|password|contrase\wa|secret)\w*\s*[:=]\s*['"]([^'"\s]{6,})['"]/gi;
          var m;
          while ((m = patron.exec(f.texto))) {
            if (!esInofensivo(m[1])) {
              throw new Error(f.archivo + ' tiene una clave escrita: ' + m[0]);
            }
          }
        });

        /* y la clave publicable sí tiene que estar: es la que identifica
           al proyecto, y su trabajo es justamente ser pública */
        var nube = fuentes.filter(function (f) { return /nube\.js$/.test(f.archivo); })[0];
        esperar(nube.texto).aContener('sb_publishable_');
      });
    });

    prueba('entra con la clave correcta', function () {
      limpiar();
      return abrirPanel().then(function (p) {
        esperar(p.doc.querySelector('#panel').classList.contains('activo')).aSerVerdadero();
      });
    });

    prueba('SEGURIDAD · sin sesión el panel no se abre solo', function () {
      /* Nadie tiene que poder entrar por el simple hecho de abrir la
         página. Sin sesión guardada el panel se queda en el formulario,
         y sin la configuración del servidor avisa qué falta en vez de
         dejar pasar. */
      limpiar();
      try { localStorage.removeItem('tinta-fundida:sesion-nube'); } catch (e) {}

      return abrirPagina('../admin.html').then(function (f) {
        var d = f.contentDocument;
        esperar(d.querySelector('#panel').classList.contains('activo')).aSerFalso();

        /* y si falta js/nube.js, tampoco entra: lo dice y se queda */
        f.contentWindow.NUBE_PANEL = { hayNube: function () { return false; } };
        d.querySelector('#mail').value  = 'quien@sea.com';
        d.querySelector('#clave').value = 'lo-que-sea';
        d.querySelector('#form-acceso').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));

        return new Promise(function (r) { setTimeout(r, 200); }).then(function () {
          esperar(d.querySelector('#panel').classList.contains('activo')).aSerFalso();
          esperar(d.querySelector('#error-acceso').textContent).aContener('servidor');
        });
      });
    });

    prueba('lista los productos que existen', function () {
      limpiar();
      return abrirPanel().then(function (p) {
        esperar(p.doc.querySelectorAll('#grilla-admin .prod-card').length)
          .aSer(window.DATOS_SITIO.productos.length);
      });
    });

    prueba('editar un texto se guarda solo', function () {
      limpiar();
      return abrirPanel().then(function (p) {
        var campo = p.doc.querySelector('#m-nombre');
        campo.value = 'Nombre Cambiado';
        campo.dispatchEvent(new Event('input', { bubbles: true }));
        return esperarA(function () {
          var g = JSON.parse(localStorage.getItem(LS_CONTENIDO) || '{}');
          return g.marca && g.marca.nombre === 'Nombre Cambiado';
        }, 'el cambio nunca se guardó');
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('crear un producto lo agrega y lo persiste', function () {
      limpiar();
      return abrirPanel().then(function (p) {
        var antes = p.doc.querySelectorAll('#grilla-admin .prod-card').length;
        p.doc.querySelector('#nuevo-producto').click();
        p.doc.querySelector('#p-nombre').value = 'Pieza de prueba';
        p.doc.querySelector('#p-precio').value = '$ 1.234';
        p.doc.querySelector('#modal-guardar').click();
        esperar(p.doc.querySelectorAll('#grilla-admin .prod-card').length).aSer(antes + 1);
        var g = JSON.parse(localStorage.getItem(LS_CONTENIDO));
        esperar(g.productos[g.productos.length - 1].nombre).aSer('Pieza de prueba');
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('un producto sin nombre no se guarda', function () {
      limpiar();
      return abrirPanel().then(function (p) {
        var antes = p.doc.querySelectorAll('#grilla-admin .prod-card').length;
        p.doc.querySelector('#nuevo-producto').click();
        p.doc.querySelector('#p-nombre').value = '   ';
        p.doc.querySelector('#modal-guardar').click();
        esperar(p.doc.querySelectorAll('#grilla-admin .prod-card').length).aSer(antes);
        esperar(p.doc.querySelector('#modal-producto').classList.contains('abierto')).aSerVerdadero();
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('reordenar productos cambia el orden guardado', function () {
      limpiar();
      return abrirPanel().then(function (p) {
        var original = window.DATOS_SITIO.productos.map(function (x) { return x.nombre; });
        p.doc.querySelector('[data-pmover="0"][data-dir="1"]').click();
        var g = JSON.parse(localStorage.getItem(LS_CONTENIDO));
        esperar(g.productos[0].nombre).aSer(original[1]);
        esperar(g.productos[1].nombre).aSer(original[0]);
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('agregar y quitar filas de preguntas frecuentes', function () {
      limpiar();
      return abrirPanel().then(function (p) {
        var antes = p.doc.querySelectorAll('#lista-faq .fila').length;
        p.doc.querySelector('[data-agregar="faq"]').click();
        esperar(p.doc.querySelectorAll('#lista-faq .fila').length).aSer(antes + 1);
        var g = JSON.parse(localStorage.getItem(LS_CONTENIDO));
        esperar(g.faq.length).aSer(antes + 1);
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('el resumen cuenta lo que hay y no habla de espacio', function () {
      /* El medidor de 5 MB se fue con el base64. Lo que queda tiene que
         contar piezas, no bytes, y sobre todo no puede volver a hablar
         de un límite que ya no existe. */
      limpiar();
      return abrirPanel().then(function (p) {
        var t = p.doc.querySelector('#resumen-contenido').textContent;
        esperar(t).aContener(String(window.DATOS_SITIO.productos.length) + ' productos');
        esperar(t).aContener('ya está online');
        esperar(t).aNoContener('MB');
      });
    });

    prueba('el resumen avisa cuántas piezas quedaron sin foto', function () {
      /* Las dos claves, siempre. Una pieza con fotos guarda la lista en
         `imagenes` y la portada en `imagen`: tocar solo una deja la
         otra con la foto real que traiga el contenido, y la prueba
         termina midiendo algo que no preparó. */
      var c = contenidoBase();
      c.productos[0].imagen = '';  c.productos[0].imagenes = [];
      c.productos[1].imagen = 'https://ejemplo/una.jpg';
      c.productos[1].imagenes = ['https://ejemplo/una.jpg'];
      sembrar(c);
      return abrirPanel().then(function (p) {
        var sinFoto = c.productos.filter(function (x) { return !x.imagen; }).length;
        esperar(p.doc.querySelector('#resumen-contenido').textContent)
          .aContener(sinFoto + ' sin foto');
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('cerrar sesión borra la sesión y la copia local', function () {
      /* El panel se abre desde el celular. Si "Salir" dejara la sesión
         viva, prestar el teléfono una vez sería prestarlo para siempre.
         Y la copia local es contenido del negocio: tampoco tiene por
         qué quedar en una máquina que no es del dueño. */
      limpiar();
      return abrirPanel().then(function (p) {
        var cerro = false;
        p.win.confirm = function () { return true; };
        /* salir() nunca resuelve a propósito: la recarga cuelga de esa
           promesa, así que el iframe se queda quieto y da tiempo a
           mirar cómo quedó todo. location.reload no se puede pisar. */
        p.win.NUBE_PANEL.salir = function () {
          cerro = true;
          return new Promise(function () {});
        };
        localStorage.setItem(LS_CONTENIDO, JSON.stringify(contenidoBase()));

        p.doc.querySelector('#salir').click();
        return esperarA(function () { return cerro; }, 'nunca se cerró la sesión')
          .then(function () {
            esperar(localStorage.getItem(LS_CONTENIDO)).aSer(null);
          });
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('cerrar sesión se puede cancelar', function () {
      limpiar();
      return abrirPanel().then(function (p) {
        var cerro = false;
        p.win.confirm = function () { return false; };
        p.win.NUBE_PANEL.salir = function () { cerro = true; return Promise.resolve(); };
        p.doc.querySelector('#salir-cuenta').click();
        return esperarUnPoco(150).then(function () {
          esperar(cerro).aSerFalso();
          esperar(p.doc.querySelector('#panel').classList.contains('activo')).aSerVerdadero();
        });
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('la barra muestra con qué mail entraste', function () {
      limpiar();
      return abrirPanel().then(function (p) {
        esperar(p.doc.querySelector('#barra-mail').textContent).aSer('prueba@local');
      });
    });
  });

  /* ==========================================================
     FOTOS
     ========================================================== */
  grupo('Fotos', function () {

    /* Las dos que siguen suben una foto y miden la que quedó guardada.
       Para eso el producto tiene que arrancar SIN foto: si ya tiene una,
       la espera de abajo se cumple con esa —está desde el primer
       instante— y la prueba termina midiendo la foto vieja en vez de la
       que acaba de subir. Pasaba desapercibido mientras datos.js traía
       productos de ejemplo pelados; el día que se refrescó con el
       catálogo de verdad, donde cada pieza tiene su foto, la de los
       1600px empezó a leer 1100. */
    function panelConProductoSinFoto() {
      var c = contenidoBase();
      c.productos[0].imagen = '';
      c.productos[0].imagenes = [];
      sembrar(c);
      return abrirPanel();
    }

    prueba('una foto grande se achica sola a 1600px', function () {
      var panel;
      return panelConProductoSinFoto().then(function (p) {
        panel = p;
        return fotoDePrueba(2600, 1800, 'grande.jpg');
      }).then(function (archivo) {
        panel.doc.querySelector('[data-pfoto="0"]').click();
        ponerArchivos(panel.doc.querySelector('#archivo-rapido'), [archivo]);
        return esperarA(function () {
          var g = JSON.parse(localStorage.getItem(LS_CONTENIDO) || '{}');
          return g.productos && g.productos[0].imagen;
        }, 'la foto nunca se guardó', 6000);
      }).then(function (dataURL) {
        return new Promise(function (res) {
          var img = new Image();
          img.onload = function () { res(img); };
          img.src = dataURL;
        });
      }).then(function (img) {
        esperar(Math.max(img.naturalWidth, img.naturalHeight)).aSer(1600);
        esperar(img.naturalWidth).aSer(1600);
        esperar(img.naturalHeight).aSer(1108);
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('una foto de celular termina pesando poco', function () {
      var panel, pesoOriginal;
      return panelConProductoSinFoto().then(function (p) {
        panel = p;
        return fotoDePrueba(3000, 2250, 'celular.jpg');
      }).then(function (archivo) {
        pesoOriginal = archivo.size;
        panel.doc.querySelector('[data-pfoto="0"]').click();
        ponerArchivos(panel.doc.querySelector('#archivo-rapido'), [archivo]);
        return esperarA(function () {
          var g = JSON.parse(localStorage.getItem(LS_CONTENIDO) || '{}');
          return g.productos && g.productos[0].imagen;
        }, 'la foto nunca se guardó', 6000);
      }).then(function (dataURL) {
        var bytes = Math.round(dataURL.length * 0.75);
        esperar(bytes).aSerMenorQue(300000);
        esperar(bytes).aSerMenorQue(pesoOriginal);
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('un click quita la foto y la deja vacía', function () {
      var c = contenidoBase();
      c.productos[0].imagen = PIXEL;  c.productos[0].imagenes = [PIXEL];
      sembrar(c);
      return abrirPanel().then(function (p) {
        var botonQuitar = p.doc.querySelector('[data-pquitarfoto="0"]');
        esperar(!!botonQuitar).aSerVerdadero();
        botonQuitar.click();
        var g = JSON.parse(localStorage.getItem(LS_CONTENIDO));
        esperar(g.productos[0].imagen).aSer('');
        esperar(!!p.doc.querySelector('[data-pquitarfoto="0"]')).aSerFalso();
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('sin foto se ofrece agregar, con foto se ofrece agregar otra', function () {
      /* Con una sola foto el botón decía "Cambiar" y reemplazaba. Desde
         que hay varias, agrega: reemplazar es quitar y volver a poner. */
      var c = contenidoBase();
      c.productos[0].imagen = '';     c.productos[0].imagenes = [];
      c.productos[1].imagen = PIXEL;  c.productos[1].imagenes = [PIXEL];
      sembrar(c);
      return abrirPanel().then(function (p) {
        esperar(p.doc.querySelector('[data-pfoto="0"]').textContent).aContener('Agregar foto');
        esperar(p.doc.querySelector('[data-pfoto="1"]').textContent).aContener('Agregar otra');
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('soltar varias fotos crea un producto por cada una', function () {
      limpiar();
      var panel, antes;
      return abrirPanel().then(function (p) {
        panel = p;
        antes = p.doc.querySelectorAll('#grilla-admin .prod-card').length;
        return Promise.all([
          fotoDePrueba(900, 700, 'maceta-chica.jpg'),
          fotoDePrueba(900, 700, 'porta_lapices.jpg'),
          fotoDePrueba(900, 700, 'llavero.jpg')
        ]);
      }).then(function (fotos) {
        ponerArchivos(panel.doc.querySelector('#archivo-varias'), fotos);
        return esperarA(function () {
          var g = JSON.parse(localStorage.getItem(LS_CONTENIDO) || '{}');
          return g.productos && g.productos.length === antes + 3;
        }, 'no se crearon los 3 productos', 15000);
      }).then(function () {
        var g = JSON.parse(localStorage.getItem(LS_CONTENIDO));
        var nuevos = g.productos.slice(-3);
        esperar(nuevos[0].nombre).aSer('Maceta chica');
        esperar(nuevos[1].nombre).aSer('Porta lapices');
        esperar(nuevos[2].nombre).aSer('Llavero');
        nuevos.forEach(function (p) {
          esperar(p.imagen).aContener('data:image');
          esperar(p.visible).aSerVerdadero();
        });
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('un archivo que no es imagen no rompe nada', function () {
      limpiar();
      var panel;
      return abrirPanel().then(function (p) {
        panel = p;
        var basura = new File(['no soy una imagen'], 'notas.txt', { type: 'text/plain' });
        var antes = JSON.parse(localStorage.getItem(LS_CONTENIDO) || 'null');
        ponerArchivos(panel.doc.querySelector('#archivo-varias'), [basura]);
        return esperarUnPoco(400).then(function () {
          esperar(panel.doc.querySelector('#toast').textContent).aContener('imagen');
          var despues = JSON.parse(localStorage.getItem(LS_CONTENIDO) || 'null');
          var n = despues ? despues.productos.length : window.DATOS_SITIO.productos.length;
          esperar(n).aSer(window.DATOS_SITIO.productos.length);
        });
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    /* --------------------------------------------------------
       VARIAS FOTOS POR PIEZA
       -------------------------------------------------------- */

    prueba('COMPATIBILIDAD · un producto viejo, con imagen y sin lista, se sigue viendo', function () {
      /* El caso real: una copia de seguridad de antes del carrusel, o el
         datos.js del repo sin actualizar. No tienen `imagenes` en ningún
         lado y el sitio tiene que mostrarlos igual. */
      var c = contenidoBase();
      c.productos.forEach(function (p) { delete p.imagenes; p.imagen = ''; });
      c.productos[0].imagen = PIXEL;
      c.productos[0].categoria = 'Todo';
      sembrar(c);
      return abrirPagina('../index.html').then(function (f) {
        var d = f.contentDocument;
        var caja = d.querySelector('.producto .producto__foto');
        esperar(caja.querySelectorAll('img').length).aSer(1);
        esperar(caja.querySelector('img').getAttribute('src')).aSer(PIXEL);
        /* con una sola foto no se arma carrusel ni aparecen puntitos */
        esperar(caja.querySelectorAll('.carrusel__punto').length).aSer(0);
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('tres fotos dibujan tres imágenes y tres puntitos', function () {
      var c = contenidoBase();
      c.productos.forEach(function (p) { p.imagen = ''; p.imagenes = []; });
      c.productos[0].imagenes = pixeles(3);
      c.productos[0].imagen   = c.productos[0].imagenes[0];
      sembrar(c);
      return abrirPagina('../index.html').then(function (f) {
        var d = f.contentDocument;
        var caja = d.querySelector('.producto .producto__foto');
        esperar(caja.querySelectorAll('.carrusel img').length).aSer(3);
        esperar(caja.querySelectorAll('.carrusel__punto').length).aSer(3);
        esperar(caja.querySelectorAll('.carrusel__punto.activo').length).aSer(1);
        /* la primera no va con lazy: es la que el visitante ve al entrar */
        var imgs = caja.querySelectorAll('.carrusel img');
        esperar(imgs[0].hasAttribute('loading')).aSerFalso();
        esperar(imgs[1].getAttribute('loading')).aSer('lazy');
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('la primera de la lista es la portada, y ese es el orden que se ve', function () {
      var fotos = pixeles(3);
      var c = contenidoBase();
      c.productos.forEach(function (p) { p.imagen = ''; p.imagenes = []; });
      c.productos[0].imagenes = fotos;
      c.productos[0].imagen   = fotos[0];
      sembrar(c);
      return abrirPagina('../index.html').then(function (f) {
        var vistas = Array.prototype.map.call(
          f.contentDocument.querySelectorAll('.producto .carrusel img'),
          function (n) { return n.getAttribute('src'); });
        esperar(vistas.join(' | ')).aSer(fotos.join(' | '));
      }).then(function () {
        /* y en el panel, la tarjeta muestra esa misma primera */
        return abrirPanel().then(function (p) {
          var tarjeta = p.doc.querySelector('.prod-card .prod-card__foto');
          esperar(tarjeta.querySelector('img').getAttribute('src')).aSer(fotos[0]);
          esperar(tarjeta.querySelector('.prod-card__cuenta').textContent).aContener('3');
        });
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('al guardar, imagen queda igual a la primera de imagenes', function () {
      /* El espejo. Si esto se rompe, las copias viejas y el datos.js del
         repo dejan de mostrar la foto sin que nadie se entere. */
      var fotos = pixeles(2);
      var c = contenidoBase();
      c.productos[0].imagenes = fotos;
      c.productos[0].imagen   = fotos[0];
      sembrar(c);
      return abrirPanel().then(function (p) {
        p.doc.querySelector('[data-peditar="0"]').click();
        /* dar vuelta el orden con la flechita de la segunda miniatura */
        p.doc.querySelector('[data-mimover="1"][data-dir="-1"]').click();
        p.doc.querySelector('#modal-guardar').click();
        var g = JSON.parse(localStorage.getItem(LS_CONTENIDO));
        esperar(g.productos[0].imagenes.join(' | ')).aSer([fotos[1], fotos[0]].join(' | '));
        esperar(g.productos[0].imagen).aSer(fotos[1]);
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('REGRESIÓN · quitarle la foto a un duplicado no le rompe la del original', function () {
      /* Duplicar copia las direcciones tal cual. Antes, quitar la foto de
         una de las dos copias borraba el archivo del servidor y la otra
         quedaba apuntando a una foto que ya no existía. */
      var c = contenidoBase();
      c.productos[0].imagen = PIXEL;
      c.productos[0].imagenes = [PIXEL];
      sembrar(c);
      return abrirPanel().then(function (p) {
        var borradas = [];
        p.win.NUBE_PANEL.borrarFoto = function (url) {
          borradas.push(url);
          return Promise.resolve();
        };
        p.doc.querySelector('[data-pdup="0"]').click();      /* queda la copia en el índice 1 */
        p.doc.querySelector('[data-pquitarfoto="1"]').click();

        var g = JSON.parse(localStorage.getItem(LS_CONTENIDO));
        esperar(g.productos[1].imagen).aSer('');             /* la copia se quedó sin foto */
        esperar(g.productos[0].imagen).aSer(PIXEL);          /* el original la conserva */
        esperar(borradas.length).aSer(0);                    /* y el archivo NO se borró */
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('tocar un puntito mueve el carrusel y marca ese puntito', function () {
      /* Lo único que el resto de las pruebas no mira: que además de
         dibujarse, el carrusel se mueva. Se rompió una vez porque el
         cálculo de a dónde saltar estaba bien pero el evento de scroll
         no llegaba, y las tarjetas quedaban con el puntito 1 marcado
         para siempre. */
      var c = contenidoBase();
      c.productos.forEach(function (p) { p.imagen = ''; p.imagenes = []; });
      c.productos[0].imagenes = pixeles(3);
      c.productos[0].imagen   = c.productos[0].imagenes[0];
      sembrar(c);
      return abrirPagina('../index.html').then(function (f) {
        var caja = f.contentDocument.querySelector('.producto__foto--varias');
        var carrusel = caja.querySelector('.carrusel');
        caja.querySelector('[data-ira="2"]').click();
        return esperarA(function () {
          return Math.round(carrusel.scrollLeft / carrusel.clientWidth) === 2;
        }, 'el carrusel no se movió a la tercera foto', 3000).then(function () {
          return esperarA(function () {
            var puntos = caja.querySelectorAll('.carrusel__punto');
            return puntos[2].classList.contains('activo') &&
                   !puntos[0].classList.contains('activo');
          }, 'el puntito activo no se movió', 2000);
        });
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('REGRESIÓN · el carrusel no hace scrollear el sitio para el costado', function () {
      /* Un contenedor que scrollea en horizontal adentro de la tarjeta es
         justo la forma de romper el ancho de la página en celular. */
      var c = contenidoBase();
      c.productos.forEach(function (p) { p.imagenes = pixeles(4); p.imagen = p.imagenes[0]; });
      sembrar(c);
      return abrirPaginaAncho('../index.html', 360, 720).then(function (f) {
        var d = f.contentDocument;
        esperar(d.documentElement.scrollWidth).aSerMenorQue(361);
        var carrusel = d.querySelector('.carrusel');
        /* el que scrollea es el carrusel, no la página */
        esperar(carrusel.scrollWidth).aSerMayorQue(carrusel.clientWidth);
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    /* --- el visor de fotos -------------------------------------
       Lo delicado del visor no es abrirse: es no abrirse cuando el
       visitante estaba pasando de foto. La misma imagen se toca para
       agrandarla y se arrastra para correr el carrusel, así que las
       dos pruebas de abajo son las dos mitades de lo mismo. */
    function unaPiezaConFotos(cuantas) {
      var c = contenidoBase();
      c.productos.forEach(function (p) { p.imagen = ''; p.imagenes = []; });
      c.productos[0].imagenes = pixeles(cuantas);
      c.productos[0].imagen   = c.productos[0].imagenes[0];
      sembrar(c);
      return c;
    }

    /* un dedo que baja y sube; `corrido` es cuánto se movió mientras tanto */
    function dedo(f, elem, corrido) {
      var W = f.contentWindow;
      elem.dispatchEvent(new W.PointerEvent('pointerdown',
        { bubbles: true, clientX: 100, clientY: 100 }));
      elem.dispatchEvent(new W.PointerEvent('pointerup',
        { bubbles: true, clientX: 100 + (corrido || 0), clientY: 100 }));
    }

    prueba('tocar la foto la abre en grande con los datos de esa pieza', function () {
      var c = unaPiezaConFotos(3);
      return abrirPagina('../index.html').then(function (f) {
        var d = f.contentDocument;

        /* el visor no existe hasta que hace falta */
        esperar(!!d.querySelector('.visor')).aSerFalso();

        dedo(f, d.querySelector('.carrusel img'), 2);

        return esperarA(function () {
          var v = d.querySelector('.visor');
          return v && !v.hidden;
        }, 'el visor no se abrió al tocar la foto', 3000).then(function () {
          var v = d.querySelector('.visor');
          esperar(v.querySelector('.visor__nombre').textContent).aSer(c.productos[0].nombre);
          esperar(v.querySelector('.visor__precio').textContent)
            .aSer(c.productos[0].precio || 'Consultar');
          esperar(v.querySelectorAll('.visor__punto').length).aSer(3);

          /* el pedido sale desde adentro del visor y con esta pieza */
          esperar(v.querySelector('.visor__pedir').getAttribute('href'))
            .aContener(encodeURIComponent(c.productos[0].nombre));

          /* la página de atrás no se mueve mientras se mira la foto */
          esperar(d.documentElement.classList.contains('sin-scroll')).aSerVerdadero();
        });
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('arrastrar para pasar de foto no abre el visor', function () {
      /* La mitad que importa. Si esto se rompe, el visitante intenta ver
         la foto siguiente y le salta el visor a la cara. */
      unaPiezaConFotos(3);
      return abrirPagina('../index.html').then(function (f) {
        var d = f.contentDocument;
        dedo(f, d.querySelector('.carrusel img'), 45);
        return esperarUnPoco(300).then(function () {
          var v = d.querySelector('.visor');
          esperar(!!(v && !v.hidden)).aSerFalso();
        });
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('el visor cierra con Escape y devuelve el scroll', function () {
      unaPiezaConFotos(2);
      return abrirPagina('../index.html').then(function (f) {
        var d = f.contentDocument, W = f.contentWindow;
        dedo(f, d.querySelector('.carrusel img'), 0);

        return esperarA(function () {
          var v = d.querySelector('.visor');
          return v && !v.hidden;
        }, 'el visor no se abrió', 3000).then(function () {
          d.dispatchEvent(new W.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
          /* cerrar pasa por history.back(), que tarda un momento en llegar */
          return esperarA(function () {
            return d.querySelector('.visor').hidden &&
                   !d.documentElement.classList.contains('sin-scroll');
          }, 'el visor no cerró con Escape', 3000);
        });
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });
  });

  /* ==========================================================
     COPIAS
     ------------------------------------------------------------
     Este grupo se llamaba "Publicar" y probaba el paso que ya no
     existe. Lo que sobrevive es lo que sigue saliendo del panel
     como archivo: el respaldo, y el datos.js que hace de red de
     seguridad cuando el servidor no contesta. Que ese archivo se
     genere bien importa más que antes, no menos: ahora es lo
     único que queda en pie si la nube se cae.
     ========================================================== */
  grupo('Copias', function () {

    /* intercepta la descarga sin escribir en el disco */
    function capturarDescarga(win, doc, selectorBoton) {
      return new Promise(function (res, rej) {
        var capturado = null;
        var origCreate = win.URL.createObjectURL;
        var origClick = win.HTMLAnchorElement.prototype.click;

        win.URL.createObjectURL = function (blob) {
          var fr = new win.FileReader();
          fr.onload = function () { capturado = { texto: fr.result, tipo: blob.type }; };
          fr.readAsText(blob);
          return 'blob:capturado';
        };
        win.HTMLAnchorElement.prototype.click = function () {
          if (this.href.indexOf('blob:capturado') !== -1) { capturado = capturado || {}; return; }
          return origClick.apply(this, arguments);
        };

        doc.querySelector(selectorBoton).click();

        var inicio = Date.now();
        (function revisar() {
          if (capturado && capturado.texto) {
            win.URL.createObjectURL = origCreate;
            win.HTMLAnchorElement.prototype.click = origClick;
            return res(capturado);
          }
          if (Date.now() - inicio > 5000) return rej(new Error('la descarga nunca se generó'));
          setTimeout(revisar, 50);
        })();
      });
    }

    prueba('el datos.js que genera es JavaScript válido', function () {
      limpiar();
      return abrirPanel().then(function (p) {
        return capturarDescarga(p.win, p.doc, '#bajar-datos');
      }).then(function (cap) {
        esperar(cap.tipo).aContener('javascript');
        var caja = {};
        new Function('window', cap.texto)(caja);
        esperar(typeof caja.DATOS_SITIO).aSer('object');
        esperar(caja.DATOS_SITIO.productos.length).aSer(window.DATOS_SITIO.productos.length);
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('lo que editás sobrevive el viaje de ida y vuelta', function () {
      limpiar();
      return abrirPanel().then(function (p) {
        var campo = p.doc.querySelector('#m-nombre');
        campo.value = 'Marca Publicada';
        campo.dispatchEvent(new Event('input', { bubbles: true }));
        p.doc.querySelector('#nuevo-producto').click();
        p.doc.querySelector('#p-nombre').value = 'Producto Publicado';
        p.doc.querySelector('#modal-guardar').click();
        return capturarDescarga(p.win, p.doc, '#bajar-datos');
      }).then(function (cap) {
        var caja = {};
        new Function('window', cap.texto)(caja);
        esperar(caja.DATOS_SITIO.marca.nombre).aSer('Marca Publicada');
        esperar(caja.DATOS_SITIO.productos[caja.DATOS_SITIO.productos.length - 1].nombre)
          .aSer('Producto Publicado');
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('SEGURIDAD · ninguna clave viaja dentro del datos.js', function () {
      /* Esta prueba comparaba contra window.CLAVE_ADMIN, que ya no
         existe: leía undefined y no comparaba nada. Pasaba siempre,
         que es la peor forma de fallar. Ahora busca lo que sí puede
         llegar a colarse en un archivo que se sube al repo. */
      limpiar();
      return abrirPanel().then(function (p) {
        return capturarDescarga(p.win, p.doc, '#bajar-datos');
      }).then(function (cap) {
        var bajo = cap.texto.toLowerCase();
        esperar(bajo).aNoContener('clave_admin');
        esperar(bajo).aNoContener('password');
        esperar(bajo).aNoContener('service_role');
        esperar(bajo).aNoContener('refresh_token');
        var caja = {};
        new Function('window', cap.texto)(caja);
        esperar(caja.DATOS_SITIO.admin).aSer(undefined);
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('un borrador viejo con clave adentro queda limpio al publicar', function () {
      var c = contenidoBase();
      c.admin = { clave: 'clave-vieja-filtrada' };
      sembrar(c);
      return abrirPanel().then(function (p) {
        return capturarDescarga(p.win, p.doc, '#bajar-datos');
      }).then(function (cap) {
        esperar(cap.texto).aNoContener('clave-vieja-filtrada');
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('la copia de seguridad se puede volver a cargar', function () {
      limpiar();
      return abrirPanel().then(function (p) {
        return capturarDescarga(p.win, p.doc, '#bajar-backup');
      }).then(function (cap) {
        var recuperado = JSON.parse(cap.texto);
        esperar(recuperado.marca.nombre).aSer(window.DATOS_SITIO.marca.nombre);
        esperar(recuperado.productos.length).aSer(window.DATOS_SITIO.productos.length);
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });
  });

  /* ==========================================================
     CORRIDA
     ========================================================== */
  function correr(alProgreso) {
    var resultados = [];
    /* se guarda el contenido real para que las pruebas no pisen el trabajo */
    var respaldo = localStorage.getItem(LS_CONTENIDO);

    return hayPanel().then(function (panelDisponible) {
    return suite.reduce(function (cadena, t) {
      return cadena.then(function () {
        if (!panelDisponible && GRUPOS_CON_PANEL.indexOf(t.grupo) !== -1) {
          resultados.push({
            grupo: t.grupo, nombre: t.nombre, ok: true, saltada: true, ms: 0,
            motivo: 'necesita el panel, que no se publica'
          });
          if (alProgreso) alProgreso(resultados[resultados.length - 1], resultados.length, suite.length);
          return;
        }
        var inicio = Date.now();
        return Promise.resolve()
          .then(function () { return t.fn(); })
          .then(function () {
            resultados.push({ grupo: t.grupo, nombre: t.nombre, ok: true, ms: Date.now() - inicio });
          })
          .catch(function (err) {
            resultados.push({
              grupo: t.grupo, nombre: t.nombre, ok: false,
              ms: Date.now() - inicio, error: err && err.message ? err.message : String(err)
            });
          })
          .then(function () {
            cerrarMarcos();
            if (alProgreso) alProgreso(resultados[resultados.length - 1], resultados.length, suite.length);
          });
      });
    }, Promise.resolve()).then(function () {
      cerrarMarcos();
      limpiar();
      if (respaldo !== null) localStorage.setItem(LS_CONTENIDO, respaldo);
      return resultados;
    });
    });
  }

  window.PRUEBAS = {
    correr: correr,
    total: function () { return suite.length; },
    hayPanel: hayPanel
  };
})();
