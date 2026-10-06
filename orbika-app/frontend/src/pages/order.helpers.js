export function accionesPermitidas(rol, estado) {
  if (rol === "comprador") {
    if (["creado", "preparando"].includes(estado)) return ["cancelar"];
    if (estado === "completado") return ["calificar"];
    return [];
  }
  if (rol === "vendedor") {
    return { creado: ["preparando"], preparando: ["entregado"], entregado: ["completado"] }[estado] || [];
  }
  return [];
}

