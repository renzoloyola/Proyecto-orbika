export default function OrderSummary({ pedidos = [], rol = "comprador" }) {
  if (pedidos.length === 0) return null;

  const esVendedor = rol === "vendedor";

  if (esVendedor) {
    // Métricas del vendedor
    const completadosOEnCurso = pedidos.filter((p) => p.estado !== "cancelado");
    const ingresosTotales = completadosOEnCurso
      .filter((p) => ["entregado", "completado"].includes(p.estado))
      .reduce((acc, p) => acc + (Number(p.monto_total) || 0), 0);

    const unidadesVendidas = completadosOEnCurso
      .filter((p) => ["entregado", "completado"].includes(p.estado))
      .reduce((acc, p) => acc + (Number(p.cantidad) || 0), 0);

    const pendientesAtencion = pedidos.filter((p) =>
      ["creado", "preparando"].includes(p.estado)
    ).length;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-sage/40 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-ink-soft uppercase block">
            Ingresos confirmados
          </span>
          <span className="font-serif text-2xl font-bold text-forest-deep mt-1 block">
            S/ {ingresosTotales.toFixed(2)}
          </span>
          <span className="text-[11px] text-moss mt-0.5 block font-medium">
            De pedidos entregados o completados
          </span>
        </div>

        <div className="bg-card border border-sage/40 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-ink-soft uppercase block">
            Alimentos despachados
          </span>
          <span className="font-serif text-2xl font-bold text-forest-deep mt-1 block">
            {unidadesVendidas} unid.
          </span>
          <span className="text-[11px] text-ink-soft mt-0.5 block">
            Excedentes que encontraron comprador
          </span>
        </div>

        <div
          className={`border rounded-2xl p-4 shadow-xs transition-colors ${
            pendientesAtencion > 0
              ? "bg-amber/10 border-amber/40"
              : "bg-card border-sage/40"
          }`}
        >
          <span className="text-[11px] font-semibold text-ink-soft uppercase block">
            Por atender
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`font-serif text-2xl font-bold ${
                pendientesAtencion > 0 ? "text-amber-deep" : "text-forest-deep"
              }`}
            >
              {pendientesAtencion}
            </span>
            {pendientesAtencion > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber animate-ping" />
            )}
          </div>
          <span className="text-[11px] text-ink-soft mt-0.5 block">
            {pendientesAtencion > 0
              ? "Requieren marcar preparación o entrega"
              : "Todo al día"}
          </span>
        </div>
      </div>
    );
  }

  // Métricas del comprador
  const noCancelados = pedidos.filter((p) => p.estado !== "cancelado");
  const totalInvertido = noCancelados.reduce(
    (acc, p) => acc + (Number(p.monto_total) || 0),
    0
  );
  const unidadesRescatadas = noCancelados.reduce(
    (acc, p) => acc + (Number(p.cantidad) || 0),
    0
  );
  const pedidosActivos = pedidos.filter((p) =>
    ["creado", "preparando"].includes(p.estado)
  ).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="bg-card border border-sage/40 rounded-2xl p-4 shadow-xs">
        <span className="text-[11px] font-semibold text-ink-soft uppercase block">
          Alimentos rescatados
        </span>
        <span className="font-serif text-2xl font-bold text-forest-deep mt-1 block">
          {unidadesRescatadas} unid.
        </span>
        <span className="text-[11px] text-moss font-medium mt-0.5 block">
          Comida salvada del desperdicio
        </span>
      </div>

      <div className="bg-card border border-sage/40 rounded-2xl p-4 shadow-xs">
        <span className="text-[11px] font-semibold text-ink-soft uppercase block">
          Total de tus compras
        </span>
        <span className="font-serif text-2xl font-bold text-forest-deep mt-1 block">
          S/ {totalInvertido.toFixed(2)}
        </span>
        <span className="text-[11px] text-ink-soft mt-0.5 block">
          Precios con descuento aplicados
        </span>
      </div>

      <div className="bg-card border border-sage/40 rounded-2xl p-4 shadow-xs">
        <span className="text-[11px] font-semibold text-ink-soft uppercase block">
          Pedidos en camino
        </span>
        <span className="font-serif text-2xl font-bold text-forest-deep mt-1 block">
          {pedidosActivos}
        </span>
        <span className="text-[11px] text-ink-soft mt-0.5 block">
          {pedidosActivos > 0
            ? "Pendientes de recojo o entrega"
            : "No tienes pedidos pendientes"}
        </span>
      </div>
    </div>
  );
}
