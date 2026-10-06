import { datoInvalido, enteroPositivo, texto } from "./common.validation.js";

export const TRANSICIONES_PEDIDO = Object.freeze({
  creado: ["preparando"],
  preparando: ["entregado"],
  entregado: ["completado"],
  completado: [],
  cancelado: [],
});

export function validarCompra(input) {
  const modalidadEntrega = input?.modalidadEntrega;
  if (!["recojo", "coordinada"].includes(modalidadEntrega)) {
    throw datoInvalido("La modalidad de entrega no es válida.");
  }
  const referenciaEntrega = texto(input?.referenciaEntrega, "referencia de entrega", {
    requerido: modalidadEntrega === "coordinada",
    max: 300,
  });
  return {
    productoId: enteroPositivo(input?.productoId, "producto"),
    cantidad: enteroPositivo(input?.cantidad, "cantidad"),
    modalidadEntrega,
    referenciaEntrega,
  };
}

export function validarCancelacion(input) {
  return { motivo: texto(input?.motivo, "motivo de cancelación", { max: 300 }) };
}

export function validarCambioEstado(input) {
  const estado = input?.estado;
  if (!Object.hasOwn(TRANSICIONES_PEDIDO, estado) || estado === "creado" || estado === "cancelado") {
    throw datoInvalido("El estado solicitado no es válido.");
  }
  return { estado };
}

export function validarCalificacion(input) {
  const puntaje = enteroPositivo(input?.puntaje, "puntaje");
  if (puntaje > 5) throw datoInvalido("El puntaje debe estar entre 1 y 5.");
  return {
    puntaje,
    comentario: texto(input?.comentario, "comentario", { requerido: false, max: 1000 }),
  };
}
