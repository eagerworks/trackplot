require "securerandom"
require "json"

module Trackplot
  class SparklineBuilder
    attr_reader :data, :options

    def initialize(data, **options)
      @data = DataAdapter.normalize(data)
      @options = options
    end

    def render(view_context)
      config = build_config

      view_context.content_tag(
        "trackplot-sparkline",
        nil,
        config: config.to_json,
        style: sparkline_style
      )
    end

    private

    def build_config
      {
        data: data,
        key: options[:key].to_s,
        type: (options[:type] || :line).to_s,
        color: options[:color] || "#6366f1",
        fill: options[:fill],
        stroke_width: options[:stroke_width] || 1.5,
        dot: options.fetch(:dot, false)
      }.compact
    end

    def sparkline_style
      width = options[:width] || "120px"
      height = options[:height] || "32px"
      "display:inline-block;width:#{width};height:#{height};"
    end
  end
end
