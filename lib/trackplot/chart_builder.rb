require "securerandom"
require "json"

module Trackplot
  class ChartBuilder
    attr_reader :data, :options, :components

    def initialize(data, **options)
      @data = DataAdapter.normalize(data)
      @options = options
      @components = []
    end

    def line(data_key, **opts)
      @components << Components::Line.new(data_key, **opts)
      nil
    end

    def bar(data_key, **opts)
      @components << Components::Bar.new(data_key, **opts)
      nil
    end

    def area(data_key, **opts)
      @components << Components::Area.new(data_key, **opts)
      nil
    end

    def pie(data_key, **opts)
      @components << Components::Pie.new(data_key, **opts)
      nil
    end

    def axis(direction, **opts)
      @components << Components::Axis.new(direction, **opts)
      nil
    end

    def tooltip(**opts)
      @components << Components::Tooltip.new(**opts)
      nil
    end

    def legend(**opts)
      @components << Components::Legend.new(**opts)
      nil
    end

    def grid(**opts)
      @components << Components::Grid.new(**opts)
      nil
    end

    def scatter(data_key, **opts)
      @components << Components::Scatter.new(data_key, **opts)
      nil
    end

    def radar(data_key, **opts)
      @components << Components::Radar.new(data_key, **opts)
      nil
    end

    def horizontal_bar(data_key, **opts)
      @components << Components::HorizontalBar.new(data_key, **opts)
      nil
    end

    def candlestick(**opts)
      @components << Components::Candlestick.new(**opts)
      nil
    end

    def funnel(data_key, **opts)
      @components << Components::Funnel.new(data_key, **opts)
      nil
    end

    def reference_line(**opts)
      @components << Components::ReferenceLine.new(**opts)
      nil
    end

    def data_label(**opts)
      @components << Components::DataLabel.new(**opts)
      nil
    end

    def brush(**opts)
      @components << Components::Brush.new(**opts)
      nil
    end

    def heatmap(**opts)
      @components << Components::Heatmap.new(**opts)
      nil
    end

    def treemap(**opts)
      @components << Components::Treemap.new(**opts)
      nil
    end

    def render(view_context)
      chart_id = options[:id] || "trackplot-#{SecureRandom.hex(8)}"
      config = build_config

      html_options = {
        id: chart_id,
        config: config.to_json,
        style: chart_style,
        class: css_classes
      }

      if options[:title]
        html_options[:role] = "img"
        html_options[:"aria-label"] = options[:title]
      end

      view_context.content_tag(
        "trackplot-chart",
        nil,
        html_options
      )
    end

    private

    def build_config
      config = {
        data: data,
        components: components.map(&:to_config),
        animate: options.fetch(:animate, true),
        theme: Theme.resolve(options[:theme])
      }

      config[:title] = options[:title] if options[:title]
      config[:description] = options[:description] if options[:description]
      config[:empty_message] = options[:empty_message] if options[:empty_message]

      config
    end

    def chart_style
      width = options[:width] || "100%"
      height = options[:height] || "400px"
      "display:block;width:#{width};height:#{height};"
    end

    def css_classes
      ["trackplot-chart", options[:class]].compact.join(" ")
    end
  end
end
