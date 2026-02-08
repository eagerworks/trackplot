require_relative "trackplot/version"
require_relative "trackplot/engine" if defined?(Rails::Engine)

module Trackplot
  autoload :ChartBuilder, "trackplot/chart_builder"
  autoload :DataAdapter, "trackplot/data_adapter"
  autoload :Theme, "trackplot/theme"

  module Components
    autoload :Base, "trackplot/components/base"
    autoload :Line, "trackplot/components/line"
    autoload :Bar, "trackplot/components/bar"
    autoload :Area, "trackplot/components/area"
    autoload :Pie, "trackplot/components/pie"
    autoload :Axis, "trackplot/components/axis"
    autoload :Tooltip, "trackplot/components/tooltip"
    autoload :Legend, "trackplot/components/legend"
    autoload :Grid, "trackplot/components/grid"
    autoload :Scatter, "trackplot/components/scatter"
    autoload :Radar, "trackplot/components/radar"
    autoload :HorizontalBar, "trackplot/components/horizontal_bar"
    autoload :Candlestick, "trackplot/components/candlestick"
    autoload :Funnel, "trackplot/components/funnel"
    autoload :ReferenceLine, "trackplot/components/reference_line"
  end
end
