/* ============================================================
   PRUEBAS AUTOMÁTICAS
   Cargan index.html y admin.html de verdad dentro de un iframe
   y los revisan como lo haría una persona. No hay simulacros:
   es el mismo código que ve el cliente.
   ============================================================ */

(function () {
  'use strict';

  var LS_CONTENIDO = 'parulo:contenido';
  var LS_SESION    = 'parulo:sesion';

  /* ==========================================================
     MINI FRAMEWORK
     ========================================================== */
  var suite = [];
  var grupoActual = '';

  function grupo(nombre, fn) { grupoActual = nombre; fn(); }
  function prueba(nombre, fn) { suite.push({ grupo: grupoActual, nombre: nombre, fn: fn }); }

  /* Estos tres grupos abren admin.html, y el panel existe solo en la
     computadora del dueño: en el repo no está, a propósito. Cuando las
     pruebas corren en GitHub esas se saltean en vez de fallar — una falla
     ahí significaría "el sitio está roto" y no lo estaría. Por eso el
     LEEME insiste con correrlas también acá antes de publicar. */
  var GRUPOS_CON_PANEL = ['Panel', 'Fotos', 'Publicar'];

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

  function abrirPagina(url) {
    return new Promise(function (res, rej) {
      var f = document.createElement('iframe');
      f.style.cssText = 'position:absolute;left:-10000px;top:0;width:1280px;height:900px;border:0';
      f.src = url + (url.indexOf('?') === -1 ? '?' : '&') + 'test=' + Date.now();
      var listo = false;
      f.onload = function () { listo = true; setTimeout(function () { res(f); }, 90); };
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
      f.onload = function () { setTimeout(function () { res(f); }, 120); };
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
  function abrirPanel() {
    return abrirPagina('../admin.html').then(function (f) {
      var w = f.contentWindow, d = f.contentDocument;
      d.querySelector('#clave').value = w.CLAVE_ADMIN;
      d.querySelector('#form-acceso').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      return { marco: f, win: w, doc: d };
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
      f.src = '../index.html?movil=1';
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
         dueño no tendría cómo darse cuenta. El aviso se arma desde
         JavaScript y solo en local, igual que el candado. */
      var c = contenidoBase();
      c.contacto.whatsapp = '';
      sembrar(c);
      return abrirPagina('../index.html').then(function (f) {
        var d = f.contentDocument;
        var aviso = d.querySelector('.aviso-falta');
        esperar(!!aviso).aSerVerdadero();
        esperar(aviso.textContent.toLowerCase()).aContener('whatsapp');
        /* que el resto del sitio no se caiga por eso */
        esperar(d.querySelectorAll('.producto').length).aSerMayorQue(0);
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

    prueba('SEGURIDAD · el index.html que se publica no menciona el panel', function () {
      /* Se lee el archivo crudo, sin ejecutar nada: es exactamente lo que
         queda subido en el hosting. El candado se agrega después desde
         JavaScript y solo en local, así que acá no puede aparecer. */
      return fetch('../index.html').then(function (r) { return r.text(); })
        .then(function (fuente) {
          esperar(fuente).aNoContener('admin.html');
          esperar(fuente).aNoContener('admin.js');
          esperar(fuente).aNoContener('admin.css');
          esperar(fuente).aNoContener('clave');
        });
    });

    prueba('el candado del panel aparece cuando el sitio corre en local', function () {
      return abrirPagina('../index.html').then(function (f) {
        var c = f.contentDocument.querySelector('.candado');
        esperar(!!c).aSerVerdadero();
        esperar(c.getAttribute('href')).aSer('admin.html');
        esperar(c.getAttribute('aria-label')).aContener('Panel');
      });
    });

    prueba('SEGURIDAD · el candado no se arma fuera de local', function () {
      /* Se copia el sitio a un iframe con un dominio simulado para comprobar
         que la condición mira de verdad dónde está corriendo la página. */
      return fetch('../js/sitio.js').then(function (r) { return r.text(); })
        .then(function (fuente) {
          var deteccion = fuente.match(/var local = ([\s\S]*?);\n/);
          esperar(!!deteccion).aSerVerdadero();

          var evaluar = new Function('location',
            'return (' + deteccion[1].replace(/^\s*/, '') + ');');

          esperar(evaluar({ protocol: 'https:', hostname: 'joedev10.github.io' })).aSerFalso();
          esperar(evaluar({ protocol: 'https:', hostname: 'impresionesparulo.com.ar' })).aSerFalso();
          esperar(evaluar({ protocol: 'file:',  hostname: '' })).aSerVerdadero();
          esperar(evaluar({ protocol: 'http:',  hostname: 'localhost' })).aSerVerdadero();
          esperar(evaluar({ protocol: 'http:',  hostname: '127.0.0.1' })).aSerVerdadero();
        });
    });

    prueba('avisa cuando hay cambios sin publicar', function () {
      var c = contenidoBase();
      c.marca.nombre = 'Borrador';
      sembrar(c);
      return abrirPagina('../index.html').then(function (f) {
        esperar(!!f.contentDocument.querySelector('.aviso-borrador')).aSerVerdadero();
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('sin borrador no aparece ningún aviso', function () {
      limpiar();
      return abrirPagina('../index.html').then(function (f) {
        esperar(!!f.contentDocument.querySelector('.aviso-borrador')).aSerFalso();
      });
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
     PANEL
     ========================================================== */
  grupo('Panel', function () {

    prueba('rechaza una clave equivocada', function () {
      limpiar();
      return abrirPagina('../admin.html').then(function (f) {
        var d = f.contentDocument;
        d.querySelector('#clave').value = 'cualquier-cosa';
        d.querySelector('#form-acceso').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        esperar(d.querySelector('#panel').classList.contains('activo')).aSerFalso();
        esperar(d.querySelector('#error-acceso').textContent).aContener('incorrecta');
      });
    });

    prueba('entra con la clave correcta', function () {
      limpiar();
      return abrirPanel().then(function (p) {
        esperar(p.doc.querySelector('#panel').classList.contains('activo')).aSerVerdadero();
      });
    });

    prueba('SEGURIDAD · la clave vive fuera de datos.js', function () {
      return abrirPagina('../admin.html').then(function (f) {
        esperar(typeof f.contentWindow.CLAVE_ADMIN).aSer('string');
        esperar(f.contentWindow.CLAVE_ADMIN.length).aSerMayorQue(7);
        esperar(JSON.stringify(f.contentWindow.DATOS_SITIO)).aNoContener(f.contentWindow.CLAVE_ADMIN);
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

    prueba('el medidor de espacio informa algo coherente', function () {
      limpiar();
      return abrirPanel().then(function (p) {
        var t = p.doc.querySelector('#medidor-texto').textContent;
        esperar(t).aContener('de ~5 MB');
        esperar(t).aContener('productos con foto');
      });
    });
  });

  /* ==========================================================
     FOTOS
     ========================================================== */
  grupo('Fotos', function () {

    prueba('una foto grande se achica sola a 1100px', function () {
      limpiar();
      var panel;
      return abrirPanel().then(function (p) {
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
        esperar(Math.max(img.naturalWidth, img.naturalHeight)).aSer(1100);
        esperar(img.naturalWidth).aSer(1100);
        esperar(img.naturalHeight).aSer(762);
      }).then(limpiar, function (e) { limpiar(); throw e; });
    });

    prueba('una foto de celular termina pesando poco', function () {
      limpiar();
      var panel, pesoOriginal;
      return abrirPanel().then(function (p) {
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
      c.productos[0].imagen = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
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

    prueba('sin foto se ofrece agregar, con foto se ofrece cambiar', function () {
      var c = contenidoBase();
      c.productos[0].imagen = '';
      c.productos[1].imagen = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
      sembrar(c);
      return abrirPanel().then(function (p) {
        esperar(p.doc.querySelector('[data-pfoto="0"]').textContent).aContener('Agregar');
        esperar(p.doc.querySelector('[data-pfoto="1"]').textContent).aContener('Cambiar');
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
  });

  /* ==========================================================
     PUBLICAR
     ========================================================== */
  grupo('Publicar', function () {

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

    prueba('SEGURIDAD · la clave nunca viaja dentro del datos.js publicado', function () {
      limpiar();
      var clave;
      return abrirPanel().then(function (p) {
        clave = p.win.CLAVE_ADMIN;
        return capturarDescarga(p.win, p.doc, '#bajar-datos');
      }).then(function (cap) {
        esperar(cap.texto).aNoContener(clave);
        esperar(cap.texto.toLowerCase()).aNoContener('clave_admin');
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
