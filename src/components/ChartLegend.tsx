interface ChartLegendProps {
  items: { name: string; color: string }[];
}

/**
 * Fixed-order legend for combined Daily/Weekly/Monthly charts. Recharts'
 * built-in <Legend> auto-derives its payload order from internal chart
 * state (effectively alphabetical here), not render order, so we render
 * our own to guarantee Daily / Weekly / Monthly always appears in that
 * order.
 */
export function ChartLegend({ items }: ChartLegendProps) {
  return (
    <ul className="chart-legend">
      {items.map((item) => (
        <li key={item.name} className="chart-legend-item">
          <span className="chart-legend-swatch" style={{ background: item.color }} />
          {item.name}
        </li>
      ))}
    </ul>
  );
}
