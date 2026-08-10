/* ============================================================
   CONEXIÓN AL BACKEND
   ------------------------------------------------------------
   Estas dos líneas SÍ se publican, y está bien que se vean.

   La clave de abajo se llama "publicable" justamente porque su
   trabajo es viajar al navegador de cualquiera. No abre nada por
   sí sola: sirve para leer el catálogo, que ya es público, y
   nada más. Quien la use para intentar escribir se choca con las
   reglas de la base, que exigen estar logueado Y estar en la
   lista de editores.

   O sea: lo que protege el sitio no es esconder esta clave, son
   las políticas del servidor. Por eso el panel ahora sí se puede
   publicar, cosa que antes era imposible.
   ============================================================ */

window.NUBE = {
  url:   'https://dlfzcbzkpyfemwwbsovf.supabase.co',
  clave: 'sb_publishable_Gr0YYsbRJ4ipVtZwZWtjtg_5c29guNQ'
};
