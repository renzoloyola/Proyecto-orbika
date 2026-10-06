import { describe, expect, it, vi } from "vitest";
import {
  actualizarEstadoPedido,
  cancelarPedido,
  crearPedido,
  listarPedidosDeUsuario,
} from "../../src/services/pedido.service.js";

function queryReturning(data, error = null) {
  const promise = Promise.resolve({ data, error });
  const q = {
    select: vi.fn(() => q), eq: vi.fn(() => q), in: vi.fn(() => q),
    order: vi.fn(() => promise), single: vi.fn(() => promise),
    update: vi.fn(() => q), then: promise.then.bind(promise),
  };
  return q;
}

describe("servicio de pedidos", () => {
  it("impide comprar a quien no es comprador", async () => {
    await expect(crearPedido({ id: "seller", rol: "vendedor" }, {}, { from: vi.fn() }))
      .rejects.toMatchObject({ status: 403 });
  });

  it("impide comprar el producto propio", async () => {
    const producto = { id: 1, vendedor_id: "buyer", estado: "disponible", stock: 4, fecha_vencimiento: "2099-01-01", modalidad_entrega: "ambas" };
    const db = { from: vi.fn(() => queryReturning(producto)), rpc: vi.fn() };
    await expect(crearPedido(
      { id: "buyer", rol: "comprador" },
      { productoId: 1, cantidad: 1, modalidadEntrega: "recojo" },
      db,
    )).rejects.toMatchObject({ status: 403 });
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it("rechaza una modalidad que el producto no ofrece", async () => {
    const producto = { id: 1, vendedor_id: "seller", estado: "disponible", stock: 4, fecha_vencimiento: "2099-01-01", modalidad_entrega: "recojo" };
    const db = { from: vi.fn(() => queryReturning(producto)), rpc: vi.fn() };
    await expect(crearPedido(
      { id: "buyer", rol: "comprador" },
      { productoId: 1, cantidad: 1, modalidadEntrega: "coordinada", referenciaEntrega: "Casa azul" },
      db,
    )).rejects.toMatchObject({ status: 409 });
  });

  it("usa la cancelación transaccional para el comprador", async () => {
    const db = { rpc: vi.fn().mockResolvedValue({ data: { id: 7, estado: "cancelado" }, error: null }) };
    await expect(cancelarPedido(7, { id: "buyer", rol: "comprador" }, "Ya no lo necesito", db))
      .resolves.toMatchObject({ estado: "cancelado" });
    expect(db.rpc).toHaveBeenCalledWith("cancelar_pedido_transaccion", {
      p_pedido_id: 7, p_comprador_id: "buyer", p_motivo: "Ya no lo necesito",
    });
  });

  it("impide al comprador cambiar estados", async () => {
    await expect(actualizarEstadoPedido(1, { id: "buyer", rol: "comprador" }, "preparando", { from: vi.fn() }))
      .rejects.toMatchObject({ status: 403 });
  });

  it("rechaza saltar estados aunque el vendedor sea dueño", async () => {
    const pedido = { id: 1, estado: "creado", productos: { vendedor_id: "seller" } };
    const db = { from: vi.fn(() => queryReturning(pedido)) };
    await expect(actualizarEstadoPedido(1, { id: "seller", rol: "vendedor" }, "completado", db))
      .rejects.toMatchObject({ status: 409 });
  });

  it("usa relación inner al listar ventas", async () => {
    const q = queryReturning([]);
    const db = { from: vi.fn(() => q) };
    await listarPedidosDeUsuario("seller", "vendedor", db);
    expect(q.select).toHaveBeenCalledWith(expect.stringContaining("productos!inner"));
  });
});
