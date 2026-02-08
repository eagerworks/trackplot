begin
  require "phlex"
rescue LoadError
  # Phlex is an optional dependency
end

module Trackplot
  if defined?(Phlex::HTML)
    class PhlexComponent < Phlex::HTML
      def initialize(data:, **options, &block)
        @data = data
        @options = options
        @block = block
      end

      def view_template
        builder = ChartBuilder.new(@data, **@options)
        @block&.call(builder)
        config = builder.send(:build_config)

        chart_id = @options[:id] || "trackplot-#{SecureRandom.hex(8)}"
        width = @options[:width] || "100%"
        height = @options[:height] || "400px"

        tag(
          "trackplot-chart",
          id: chart_id,
          config: config.to_json,
          style: "display:block;width:#{width};height:#{height};",
          class: ["trackplot-chart", @options[:class]].compact.join(" "),
          role: @options[:title] ? "img" : nil,
          **aria_attributes
        )
      end

      private

      def aria_attributes
        attrs = {}
        attrs[:"aria-label"] = @options[:title] if @options[:title]
        attrs
      end
    end
  end
end
