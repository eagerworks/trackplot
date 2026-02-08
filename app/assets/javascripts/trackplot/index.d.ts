// ─── Theme ──────────────────────────────────────────────────────────────────

export interface ThemeConfig {
  colors?: string[];
  background?: string;
  text_color?: string;
  axis_color?: string;
  grid_color?: string;
  tooltip_bg?: string;
  tooltip_text?: string;
  tooltip_border?: string;
  font?: string;
}

// ─── Component Configs ──────────────────────────────────────────────────────

export interface LineConfig {
  type: "line";
  data_key: string;
  color?: string;
  stroke_width?: number;
  curve?: boolean;
  dashed?: boolean;
  dot?: boolean;
  dot_size?: number;
  y_axis?: "left" | "right";
}

export interface BarConfig {
  type: "bar";
  data_key: string;
  color?: string;
  opacity?: number;
  radius?: number;
  stack?: string;
  y_axis?: "left" | "right";
}

export interface AreaConfig {
  type: "area";
  data_key: string;
  color?: string;
  opacity?: number;
  stroke_width?: number;
  curve?: boolean;
  stack?: string;
  y_axis?: "left" | "right";
}

export interface ScatterConfig {
  type: "scatter";
  data_key: string;
  x_key?: string;
  color?: string;
  opacity?: number;
  dot_size?: number;
  y_axis?: "left" | "right";
}

export interface PieConfig {
  type: "pie";
  data_key: string;
  label_key?: string;
  donut?: boolean;
  pad_angle?: number;
}

export interface RadarConfig {
  type: "radar";
  data_key: string;
  color?: string;
  opacity?: number;
  stroke_width?: number;
  dot?: boolean;
  dot_size?: number;
}

export interface HorizontalBarConfig {
  type: "horizontal_bar";
  data_key: string;
  color?: string;
  opacity?: number;
  radius?: number;
}

export interface CandlestickConfig {
  type: "candlestick";
  open: string;
  high: string;
  low: string;
  close: string;
  up_color?: string;
  down_color?: string;
}

export interface FunnelConfig {
  type: "funnel";
  data_key: string;
  label_key?: string;
}

export interface HeatmapConfig {
  type: "heatmap";
  x_key: string;
  y_key: string;
  value_key: string;
  color_range?: [string, string];
  radius?: number;
}

export interface TreemapConfig {
  type: "treemap";
  value_key: string;
  label_key: string;
  parent_key?: string;
}

export interface AxisConfig {
  type: "axis";
  direction: "x" | "y";
  axis_id?: "left" | "right";
  data_key?: string;
  label?: string;
  format?: "currency" | "percent" | "compact" | "decimal" | "integer" | string;
  tick_count?: number;
  tick_rotation?: number;
}

export interface TooltipConfig {
  type: "tooltip";
  format?: "currency" | "percent" | "compact" | "decimal" | "integer" | string;
}

export interface LegendConfig {
  type: "legend";
  position?: "top" | "bottom" | "left" | "right";
  clickable?: boolean;
}

export interface GridConfig {
  type: "grid";
  horizontal?: boolean;
  vertical?: boolean;
}

export interface ReferenceLineConfig {
  type: "reference_line";
  direction: "x" | "y";
  value: number | string;
  color?: string;
  stroke_width?: number;
  dashed?: boolean;
  label?: string;
}

export interface DataLabelConfig {
  type: "data_label";
  position?: "top" | "center";
  format?: "currency" | "percent" | "compact" | "decimal" | "integer" | string;
  font_size?: number;
}

export interface BrushConfig {
  type: "brush";
  axis?: "x" | "y";
  height?: number;
}

// ─── Discriminated Union ────────────────────────────────────────────────────

export type ComponentConfig =
  | LineConfig
  | BarConfig
  | AreaConfig
  | ScatterConfig
  | PieConfig
  | RadarConfig
  | HorizontalBarConfig
  | CandlestickConfig
  | FunnelConfig
  | HeatmapConfig
  | TreemapConfig
  | AxisConfig
  | TooltipConfig
  | LegendConfig
  | GridConfig
  | ReferenceLineConfig
  | DataLabelConfig
  | BrushConfig;

// ─── Chart Config ───────────────────────────────────────────────────────────

export interface ChartConfig {
  data: Record<string, unknown>[];
  components: ComponentConfig[];
  animate?: boolean;
  theme?: ThemeConfig;
  title?: string;
  description?: string;
  empty_message?: string;
}

// ─── Sparkline Config ───────────────────────────────────────────────────────

export interface SparklineConfig {
  data: Record<string, unknown>[];
  key: string;
  type?: "line" | "bar" | "area";
  color?: string;
  fill?: string;
  stroke_width?: number;
  dot?: boolean;
}

// ─── Custom Event Details ───────────────────────────────────────────────────

export interface TrackplotClickDetail {
  chartType: string;
  dataKey: string;
  datum: Record<string, unknown>;
  index: number;
  value: unknown;
}

export interface TrackplotDataUpdateDetail {
  count: number;
}

// ─── Custom Event Maps ──────────────────────────────────────────────────────

interface TrackplotEventMap {
  "trackplot:click": CustomEvent<TrackplotClickDetail>;
  "trackplot:data-update": CustomEvent<TrackplotDataUpdateDetail>;
  "trackplot:render": CustomEvent<void>;
}

// ─── Custom Elements ────────────────────────────────────────────────────────

export declare class TrackplotElement extends HTMLElement {
  /** Replace chart data and re-render without animation. */
  updateData(newData: Record<string, unknown>[]): void;

  /** Replace the full config object and re-render. */
  updateConfig(config: ChartConfig): void;

  /** Append new data points and re-render with sliding window. */
  appendData(
    newPoints: Record<string, unknown>[],
    options?: { maxPoints?: number }
  ): void;

  /** Export chart as SVG file download. */
  exportSVG(filename?: string): Promise<Blob | null>;

  /** Export chart as PNG file download. */
  exportPNG(scale?: number, filename?: string): Promise<Blob | null>;

  addEventListener<K extends keyof TrackplotEventMap>(
    type: K,
    listener: (this: TrackplotElement, ev: TrackplotEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;

  removeEventListener<K extends keyof TrackplotEventMap>(
    type: K,
    listener: (this: TrackplotElement, ev: TrackplotEventMap[K]) => void,
    options?: boolean | EventListenerOptions
  ): void;

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

export declare class SparklineElement extends HTMLElement {}

// ─── Global Augmentation ────────────────────────────────────────────────────

declare global {
  interface HTMLElementTagNameMap {
    "trackplot-chart": TrackplotElement;
    "trackplot-sparkline": SparklineElement;
  }
}
