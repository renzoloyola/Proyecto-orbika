import { supabaseAdmin } from "../config/supabaseClient.js";
import { AppError } from "../errors/AppError.js";
import { TRANSICIONES_PEDIDO, validarCalificacion, validarCambioEstado, validarCancelacion, validarCompra } from "../validation/pedido.validation.js";
import { fechaHoyLima } from "../validation/common.validation.js";

function exigirRol(actor, rol) {
  if (!actor || actor.rol !== rol) throw new AppError(403, "FORBIDDEN", `Esta acción requiere el rol ${rol}.`);
}

function conflicto(error, mensaje = "No se pudo completar la operación.") {
  if (error) console.error("[supabase]", error);
  return new AppError(409, "DATA_CONFLICT", mensaje);
}

export async function crearPedido(actor, input, db = supabaseAdmin) {
  exigirRol(actor, "comprador");
  const datos = validarCompra(input);
  const { data: producto, error: productoError } = await db.from("productos")
    .select("id, vendedor_id, estado, stock, fecha_vencimiento, modalidad_entrega")
    .eq("id", datos.productoId).single();
  if (productoError || !producto) throw new AppError(404, "PRODUCT_NOT_FOUND", "Producto no encontrado.");
  if (producto.vendedor_id === actor.id) throw new AppError(403, "OWN_PRODUCT", "No puedes comprar tu propio producto.");
  if (!["disponible", "proximo_a_vencer"].includes(producto.estado) || producto.stock < datos.cantidad) {
    throw conflicto(null, "Producto no disponible o sin stock suficiente.");
  }
  if (producto.fecha_vencimiento < fechaHoyLima()) throw conflicto(null, "El producto está vencido.");
  if (producto.modalidad_entrega !== "ambas" && producto.modalidad_entrega !== datos.modalidadEntrega) {
    throw new AppError(409, "DELIVERY_NOT_AVAILABLE", "La modalidad elegida no está disponible.");
  }
  const { data, error } = await db.rpc("crear_pedido_transaccion", {
    p_producto_id: datos.productoId, p_comprador_id: actor.id, p_cantidad: datos.cantidad,
    p_modalidad_entrega: datos.modalidadEntrega, p_referencia_entrega: datos.referenciaEntrega,
  });
  if (error) throw conflicto(error, "El producto cambió de disponibilidad. Intenta nuevamente.");
  return data;
}

export async function listarPedidosDeUsuario(usuarioId, rol, db = supabaseAdmin) {
  let query = db.from("pedidos");
  if (rol === "vendedor") {
    query = query.select("*, productos!inner(nombre, foto_url, vendedor_id)").eq("productos.vendedor_id", usuarioId);
  } else if (rol === "comprador") {
    query = query.select("*, productos(nombre, foto_url, vendedor_id)").eq("comprador_id", usuarioId);
  } else {
    throw new AppError(403, "FORBIDDEN", "No tienes acceso a pedidos.");
  }
  const { data, error } = await query.order("fecha_creacion", { ascending: false });
  if (error) throw conflicto(error);
  return data || [];
}

export async function cancelarPedido(pedidoId, actor, motivo, db = supabaseAdmin) {
  exigirRol(actor, "comprador");
  const id = Number(pedidoId);
  if (!Number.isInteger(id) || id <= 0) throw new AppError(400, "VALIDATION_ERROR", "Pedido inválido.");
  const datos = validarCancelacion({ motivo });
  const { data, error } = await db.rpc("cancelar_pedido_transaccion", {
    p_pedido_id: id, p_comprador_id: actor.id, p_motivo: datos.motivo,
  });
  if (error) throw conflicto(error, "Este pedido no puede cancelarse.");
  return data;
}

export async function actualizarEstadoPedido(pedidoId, actor, nuevoEstado, db = supabaseAdmin) {
  exigirRol(actor, "vendedor");
  const id = Number(pedidoId);
  if (!Number.isInteger(id) || id <= 0) throw new AppError(400, "VALIDATION_ERROR", "Pedido inválido.");
  const { estado } = validarCambioEstado({ estado: nuevoEstado });
  const { data: pedido, error: busquedaError } = await db.from("pedidos")
    .select("id, estado, productos!inner(vendedor_id)").eq("id", id).single();
  if (busquedaError || !pedido) throw new AppError(404, "ORDER_NOT_FOUND", "Pedido no encontrado.");
  if (pedido.productos?.vendedor_id !== actor.id) throw new AppError(403, "FORBIDDEN", "Este pedido no pertenece a tu negocio.");
  if (!TRANSICIONES_PEDIDO[pedido.estado]?.includes(estado)) {
    throw new AppError(409, "INVALID_TRANSITION", `No se puede pasar de ${pedido.estado} a ${estado}.`);
  }
  const cambios = { estado };
  if (estado === "completado") cambios.fecha_finalizacion = new Date().toISOString();
  const { data, error } = await db.from("pedidos").update(cambios)
    .eq("id", id).eq("estado", pedido.estado).select().single();
  if (error || !data) throw conflicto(error, "El pedido cambió de estado. Recarga e intenta nuevamente.");
  return data;
}

export async function calificarPedido(pedidoId, actor, puntaje, comentario, db = supabaseAdmin) {
  exigirRol(actor, "comprador");
  const id = Number(pedidoId);
  if (!Number.isInteger(id) || id <= 0) throw new AppError(400, "VALIDATION_ERROR", "Pedido inválido.");
  const datos = validarCalificacion({ puntaje, comentario });
  const { data: pedido, error: busquedaError } = await db.from("pedidos")
    .select("estado, comprador_id").eq("id", id).single();
  if (busquedaError || !pedido) throw new AppError(404, "ORDER_NOT_FOUND", "Pedido no encontrado.");
  if (pedido.comprador_id !== actor.id) throw new AppError(403, "FORBIDDEN", "Este pedido no te pertenece.");
  if (pedido.estado !== "completado") throw conflicto(null, "Solo se puede calificar un pedido completado.");
  const { data, error } = await db.from("calificaciones").insert({ pedido_id: id, ...datos }).select().single();
  if (error) throw conflicto(error, "Este pedido ya fue calificado.");
  return data;
}

