import { describe, expect, it } from "vitest";
import { accionesPermitidas } from "./order.helpers.js";

describe("acciones de pedido", () => {
  it.each([
    ["comprador", "creado", ["cancelar"]],
    ["comprador", "preparando", ["cancelar"]],
    ["comprador", "completado", ["calificar"]],
    ["vendedor", "creado", ["preparando"]],
    ["vendedor", "preparando", ["entregado"]],
    ["vendedor", "entregado", ["completado"]],
    ["vendedor", "cancelado", []],
  ])("%s con estado %s", (rol, estado, expected) => {
    expect(accionesPermitidas(rol, estado)).toEqual(expected);
  });
});
