/* ============================================================
   DATOS DEL SITIO  ·  contenido publicado
   ------------------------------------------------------------
   Este archivo lo genera el panel de administración.
   No hace falta editarlo a mano: entrá a admin.html,
   hacé los cambios y apretá "Publicar".
   ============================================================ */

window.DATOS_SITIO = {

  version: 1,

  marca: {
    nombre: "Impresiones Parulo",
    logo: "PARULO",
    logoSufijo: "3D",
    slogan: "Taller de impresión 3D"
  },

  contacto: {
    whatsapp: "5491100000000",
    mensaje: "Hola! Vi la web y quería hacer una consulta.",
    instagram: "",
    tiktok: "",
    email: "",
    ciudad: "Buenos Aires, Argentina",
    horario: "Lun a Sáb · 9 a 19 hs",
    envios: "Envíos a todo el país · Retiro sin cargo"
  },

  hero: {
    kicker: "FDM · PLA · PETG · RESINA",
    titulo: "IMPRIMIMOS LO QUE IMAGINÁS",
    bajada: "Diseños propios listos para llevar y piezas a medida desde tu archivo o desde una idea escrita en una servilleta.",
    ctaPrimario: "Pedir por WhatsApp",
    ctaSecundario: "Ver catálogo"
  },

  stats: [
    { valor: "0.1", unidad: "mm", etiqueta: "Altura de capa" },
    { valor: "48", unidad: "hs", etiqueta: "Entrega promedio" },
    { valor: "22", unidad: "cm", etiqueta: "Tamaño máximo" },
    { valor: "12", unidad: "+", etiqueta: "Colores en stock" }
  ],

  servicios: [
    {
      icono: "caja",
      titulo: "Productos propios",
      desc: "Diseños listos para comprar: deco, organizadores, regalos y objetos únicos. Elegís color, lo imprimimos y te lo entregamos.",
      bullets: ["Stock permanente", "Colores a elección", "Personalizás nombre o texto"]
    },
    {
      icono: "engranaje",
      titulo: "Impresión por encargo",
      desc: "Traés tu archivo STL o solo la idea. Te pasamos presupuesto, imprimimos y probamos la pieza antes de entregarla.",
      bullets: ["Presupuesto sin cargo", "Repuestos y piezas técnicas", "Prototipos y series cortas"]
    }
  ],

  categorias: ["Deco", "Organización", "Regalos", "Piezas técnicas"],

  productos: [
    { id: "p1", nombre: "Maceta geométrica", categoria: "Deco", precio: "$ 8.500", desc: "Facetada, con plato integrado. Tres tamaños disponibles.", imagen: "", visible: true, destacado: true },
    { id: "p2", nombre: "Organizador de escritorio", categoria: "Organización", precio: "$ 12.000", desc: "Módulos apilables para lapiceras, cables y fichas.", imagen: "", visible: true, destacado: false },
    { id: "p3", nombre: "Lámpara espiral", categoria: "Deco", precio: "$ 21.000", desc: "Impresa en modo espiral, luz cálida incluida.", imagen: "", visible: true, destacado: true },
    { id: "p4", nombre: "Llavero personalizado", categoria: "Regalos", precio: "$ 2.800", desc: "Con el nombre, logo o frase que quieras.", imagen: "", visible: true, destacado: false },
    { id: "p5", nombre: "Soporte para celular", categoria: "Organización", precio: "$ 5.400", desc: "Ángulo regulable, apoyo antideslizante.", imagen: "", visible: true, destacado: false },
    { id: "p6", nombre: "Engranaje a medida", categoria: "Piezas técnicas", precio: "A cotizar", desc: "Repuestos discontinuados, réplicas y piezas funcionales en PETG.", imagen: "", visible: true, destacado: false }
  ],

  proceso: [
    { titulo: "Contame qué necesitás", desc: "Escribinos por WhatsApp con una foto, un archivo STL o simplemente la idea." },
    { titulo: "Te paso el presupuesto", desc: "Definimos material, color, tamaño y plazo. Sin cargo y sin compromiso." },
    { titulo: "Lo imprimo", desc: "Vas viendo el avance. Cada pieza se revisa y se prueba antes de salir del taller." },
    { titulo: "Lo retirás o te lo envío", desc: "Retiro sin cargo en el taller o envío a todo el país." }
  ],

  faq: [
    { p: "¿Cuánto tarda un pedido?", r: "Los productos del catálogo salen en 24 a 48 hs. Las piezas a medida dependen del tamaño, pero siempre te confirmo el plazo antes de arrancar." },
    { p: "¿Qué materiales usan?", r: "PLA para deco y objetos de uso general, PETG cuando la pieza necesita resistencia o va a estar a la intemperie, y resina para piezas con mucho detalle." },
    { p: "No tengo el archivo 3D, ¿igual pueden ayudarme?", r: "Sí. Mandame fotos, medidas o un dibujo y lo modelo. El diseño se cotiza aparte y queda tuyo." },
    { p: "¿Hacen cantidad para negocios?", r: "Sí, trabajamos series cortas para comercios y emprendimientos. A partir de 20 unidades hay descuento por volumen." },
    { p: "¿Cómo se paga?", r: "Transferencia, efectivo o link de pago. En pedidos a medida se abona el 50% para empezar." }
  ],

  secciones: {
    servicios: true,
    catalogo: true,
    proceso: true,
    faq: true,
    stats: true
  },

  admin: {
    clave: "parulo3d"
  }
};
