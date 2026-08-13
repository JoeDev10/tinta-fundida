/* ============================================================
   EL PANEL CONTRA LA NUBE
   ------------------------------------------------------------
   Todo lo que el panel necesita del servidor: entrar, traer el
   contenido, guardarlo y subir fotos.

   Está escrito con fetch pelado y no con la librería oficial a
   propósito. Son siete llamadas contadas, el proyecto no tiene
   ni un solo paquete instalado, y meter un script de un CDN
   ajeno sería la única cosa del sitio que puede romperse porque
   alguien más tuvo un mal día.
   ============================================================ */

(function () {
  'use strict';

  var LS_SESION = 'tinta-fundida:sesion-nube';
  var N = window.NUBE || {};

  /* --- sesión guardada -------------------------------------- */
  var sesion = null;
  try { sesion = JSON.parse(localStorage.getItem(LS_SESION)); } catch (e) {}

  function guardarSesion(s) {
    sesion = s;
    try {
      if (s) localStorage.setItem(LS_SESION, JSON.stringify(s));
      else localStorage.removeItem(LS_SESION);
    } catch (e) {}
  }

  /* La respuesta de Supabase trae expires_in (segundos). Lo pasamos a
     un momento absoluto, que es lo único comparable después de que el
     navegador estuvo cerrado dos días. Se le restan 60 segundos para
     no usar un token que vence mientras viaja. */
  function normalizar(r) {
    return {
      token:   r.access_token,
      refresco: r.refresh_token,
      vence:   Date.now() + ((r.expires_in || 3600) - 60) * 1000,
      mail:    r.user && r.user.email
    };
  }

  function pedir(ruta, opciones) {
    opciones = opciones || {};
    var cab = opciones.headers || {};
    cab.apikey = N.clave;
    opciones.headers = cab;
    return fetch(N.url + ruta, opciones);
  }

  function errorDeRed(e) {
    throw new Error('No hay internet, o el servicio no responde. ' +
                    'Probá de nuevo en un minuto. (' + (e.message || e) + ')');
  }

  /* ==========================================================
     ENTRAR Y SALIR
     ========================================================== */
  function entrar(mail, clave) {
    return pedir('/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: mail, password: clave })
    })
      .catch(errorDeRed)
      .then(function (r) {
        return r.json().then(function (j) {
          if (!r.ok) {
            /* el mensaje de Supabase viene en inglés y es críptico para
               quien solo quiere entrar a cargar unas fotos */
            if (/invalid login/i.test(j.error_description || j.msg || '')) {
              throw new Error('Mail o contraseña incorrectos.');
            }
            if (/email not confirmed/i.test(j.msg || '')) {
              throw new Error('Falta confirmar el mail. Buscá el correo de ' +
                              'Supabase y tocá el link.');
            }
            throw new Error(j.msg || j.error_description || 'No se pudo entrar.');
          }
          guardarSesion(normalizar(j));
          return sesion;
        });
      });
  }

  function salir() {
    var s = sesion;
    guardarSesion(null);
    if (!s) return Promise.resolve();
    return pedir('/auth/v1/logout', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + s.token }
    }).catch(function () { /* la sesión local ya se borró: alcanza */ });
  }

  /* Renueva el token si está por vencer. Sin esto, el dueño deja el
     panel abierto una hora, vuelve, toca guardar y se come un error
     sin entender por qué. */
  function tokenVigente() {
    if (!sesion) return Promise.reject(new Error('No hay sesión iniciada.'));
    if (Date.now() < sesion.vence) return Promise.resolve(sesion.token);

    return pedir('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: sesion.refresco })
    })
      .catch(errorDeRed)
      .then(function (r) {
        if (!r.ok) {
          guardarSesion(null);
          throw new Error('La sesión venció. Entrá de nuevo.');
        }
        return r.json().then(function (j) {
          guardarSesion(normalizar(j));
          return sesion.token;
        });
      });
  }

  /* ==========================================================
     ME OLVIDÉ LA CONTRASEÑA
     ------------------------------------------------------------
     Dos pasos separados por un mail. Primero se pide el correo de
     recuperación; después, cuando el dueño vuelve desde el link, se
     escribe la contraseña nueva con el token que trajo puesto.

     El servidor contesta que sí exista o no exista ese mail, y está
     bien que así sea: si dijera "ese mail no está registrado",
     cualquiera podría averiguar quién administra el sitio probando
     direcciones. Por eso el aviso de arriba es siempre el mismo.
     ========================================================== */
  function pedirRecuperacion(mail, volverA) {
    return pedir('/auth/v1/recover?redirect_to=' + encodeURIComponent(volverA), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: mail })
    })
      .catch(errorDeRed)
      .then(function (r) {
        if (r.ok) return true;
        return r.json().catch(function () { return {}; }).then(function (j) {
          /* Supabase corta los pedidos seguidos para que nadie use esto
             para mandar correos a mansalva. Es lo único que conviene
             contar, porque se arregla esperando. */
          if (r.status === 429) {
            throw new Error('Pediste el correo hace muy poco. Esperá un ' +
                            'minuto y probá de nuevo.');
          }
          throw new Error(j.msg || j.error_description ||
                          'No se pudo pedir el correo (' + r.status + ').');
        });
      });
  }

  /* El token sale del link del mail, no de una sesión guardada: el
     dueño llega acá justamente porque no puede entrar. */
  function cambiarClave(token, nueva) {
    return pedir('/auth/v1/user', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: nueva })
    })
      .catch(errorDeRed)
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (r.ok) return true;
          if (r.status === 401 || r.status === 403) {
            throw new Error('El link venció o ya se usó. Pedí el correo de nuevo.');
          }
          if (/at least|should be/i.test(j.msg || j.error_description || '')) {
            throw new Error('La contraseña es muy corta: tiene que tener ' +
                            'al menos 6 caracteres.');
          }
          throw new Error(j.msg || j.error_description ||
                          'No se pudo cambiar la contraseña (' + r.status + ').');
        });
      });
  }

  /* ==========================================================
     CONTENIDO
     ========================================================== */
  function traerContenido() {
    return pedir('/rest/v1/contenido?select=datos&id=eq.1')
      .catch(errorDeRed)
      .then(function (r) {
        if (!r.ok) throw new Error('No se pudo leer el contenido (' + r.status + ').');
        return r.json();
      })
      .then(function (filas) {
        return filas && filas[0] ? filas[0].datos : null;
      });
  }

  function guardarContenido(datos) {
    return tokenVigente().then(function (token) {
      return pedir('/rest/v1/contenido?id=eq.1', {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
          /* Sin esto la respuesta viene vacía siempre y no habría forma
             de distinguir "guardado" de "no tenías permiso". */
          Prefer: 'return=representation'
        },
        body: JSON.stringify({ datos: datos })
      })
        .catch(errorDeRed)
        .then(function (r) {
          if (!r.ok) throw new Error('No se pudo guardar (' + r.status + ').');
          return r.json();
        })
        .then(function (filas) {
          /* ACÁ ESTÁ LA TRAMPA. Cuando las reglas del servidor no te
             dejan escribir, no contesta un error: contesta que sí y
             cambia cero filas. Sin este chequeo el panel diría
             "Guardado" para siempre sin guardar nada. */
          if (!filas || !filas.length) {
            throw new Error('Tu usuario no tiene permiso para editar este sitio. ' +
                            'Hay que agregarlo a la lista de editores.');
          }
          return filas[0];
        });
    });
  }

  /* ==========================================================
     FOTOS
     ========================================================== */
  var CARPETA = '/storage/v1/object/fotos/';

  function nombreDeArchivo(original) {
    var ext = (String(original || '').match(/\.(jpe?g|png|webp|gif)$/i) || ['.jpg'])[0];
    return Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext.toLowerCase();
  }

  function subirFoto(blob, nombreOriginal) {
    return tokenVigente().then(function (token) {
      var archivo = nombreDeArchivo(nombreOriginal);
      return pedir(CARPETA + archivo, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': blob.type || 'image/jpeg',
          'Cache-Control': '31536000'
        },
        body: blob
      })
        .catch(errorDeRed)
        .then(function (r) {
          if (!r.ok) {
            return r.json().catch(function () { return {}; }).then(function (j) {
              if (r.status === 403 || r.status === 401) {
                throw new Error('Tu usuario no tiene permiso para subir fotos.');
              }
              throw new Error(j.message || 'No se pudo subir la foto (' + r.status + ').');
            });
          }
          return N.url + '/storage/v1/object/public/fotos/' + archivo;
        });
    });
  }

  /* Se le pasa la URL pública que quedó guardada en el producto y de
     ahí se saca el nombre del archivo. */
  function borrarFoto(url) {
    var m = String(url || '').match(/\/object\/public\/fotos\/(.+)$/);
    if (!m) return Promise.resolve();          /* foto vieja en base64: no hay nada que borrar */
    return tokenVigente().then(function (token) {
      return pedir(CARPETA + m[1], {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token }
      }).catch(function () { /* que no se borre el archivo no puede trabar al dueño */ });
    });
  }

  window.NUBE_PANEL = {
    entrar: entrar,
    salir: salir,
    pedirRecuperacion: pedirRecuperacion,
    cambiarClave: cambiarClave,
    sesion: function () { return sesion; },
    hayNube: function () { return !!(N.url && N.clave); },
    traerContenido: traerContenido,
    guardarContenido: guardarContenido,
    subirFoto: subirFoto,
    borrarFoto: borrarFoto
  };
})();
