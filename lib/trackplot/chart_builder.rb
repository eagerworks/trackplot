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

    def render(view_context)
      chart_id = "trackplot-#{SecureRandom.hex(8)}"
      config = build_config

      view_context.content_tag(
        "trackplot-chart",
        nil,
        id: chart_id,
        config: config.to_json,
        style: chart_style,
        class: css_classes
      )
    end

    private

    def build_config
      {
        data: data,
        components: components.map(&:to_config),
        animate: options.fetch(:animate, true)
      }
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
