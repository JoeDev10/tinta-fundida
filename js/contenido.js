/* ============================================================
   DE DÓNDE SALE EL CONTENIDO
   ------------------------------------------------------------
   Corre antes que sitio.js y decide con qué datos pintar. Hay
   tres fuentes, en este orden:

     1. La nube         · lo último que se guardó desde el panel.
                          Es lo que ve todo el mundo.
     2. Copia local     · lo último que vio ESTE navegador. Solo
                          entra si la nube no contestó.
     3. js/datos.js     · la red de seguridad.

   El orden importa y antes estaba al revés. Mientras el panel
   guardaba en esta computadora, lo local era la verdad. Ahora la
   verdad está en el servidor: si mandara lo local, el dueño
   cargaría cinco fotos desde el celular y en su computadora
   seguiría viendo lo de antes, sin entender por qué.

   Por eso lo local dejó de ser un "borrador sin publicar" y pasó
   a ser una copia de lo último que se vio. Cada vez que la nube
   contesta, esa copia se pisa.

   El punto 3 es el que hace que esto no se pueda caer. Si el
   proyecto de Supabase se durmió por falta de uso, si se cortó
   internet a mitad de camino o si el servicio tiene un mal día,
   el catálogo se sigue viendo igual. Nunca hay pantalla en
   blanco: lo peor que pasa es que se vea el contenido de la
   última publicación en vez del último cambio.

   Por eso también hay un tope de espera. Antes que hacer esperar
   a alguien mirando una página vacía, se pinta lo que ya está y
   listo.
   ============================================================ */

(function () {
  'use strict';

  var CLAVE_LS   = 'tinta-fundida:contenido';
  var ESPERA_MAX = 1500;   /* ms · pasado esto, se pinta con lo que haya */

  function cargarSitio() {
    var s = document.createElement('script');
    s.src = 'js/sitio.js';
    document.body.appendChild(s);
  }

  /* Las pruebas siembran su propio contenido y lo comparan contra lo
     que se pinta. Si además saliéramos a buscar a la nube, cada
     prueba dependería de la red y del contenido real del negocio:
     tardarían más y fallarían por motivos que no tienen nada que ver
     con lo que están probando. */
  var enPruebas = /[?&]test=/.test(location.search);

  if (enPruebas || !window.NUBE) {
    cargarSitio();
    return;
  }

  var yaArranco = false;
  function seguir() {
    if (yaArranco) return;
    yaArranco = true;
    cargarSitio();
  }

  setTimeout(seguir, ESPERA_MAX);

  fetch(window.NUBE.url + '/rest/v1/contenido?select=datos&id=eq.1', {
    headers: { apikey: window.NUBE.clave }
  })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (filas) {
      /* Solo se reemplaza si vino algo con forma de contenido. Una
         respuesta vacía o rara deja en pie la copia local. */
      if (filas && filas[0] && filas[0].datos && filas[0].datos.marca) {
        var fresco = filas[0].datos;
        window.DATOS_SITIO = fresco;
        /* se pisa la copia local: es de lo último que se vio, no un
           borrador que haya que respetar */
        try { localStorage.setItem(CLAVE_LS, JSON.stringify(fresco)); } catch (e) {}
      }
    })
    .catch(function () { /* sin internet o servicio caído: queda la copia local */ })
    .then(seguir);
})();
