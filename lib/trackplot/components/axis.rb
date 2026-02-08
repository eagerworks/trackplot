module Trackplot
  module Components
    class Axis < Base
      FORMAT_SYMBOLS = {
        currency: "currency",
        percent: "percent",
        compact: "compact",
        decimal: "decimal",
        integer: "integer"
      }.freeze

      attr_reader :direction

      def initialize(direction, **options)
        @direction = direction.to_s
        super(**options)
      end

      def to_config
        {
          type: "axis",
          direction: direction,
          data_key: options[:data_key],
          label: options[:label],
          format: resolve_format(options[:format]),
          tick_count: options[:tick_count],
          tick_rotation: options[:tick_rotation]
        }.compact
      end

      private

      def resolve_format(fmt)
        return nil if fmt.nil?

        FORMAT_SYMBOLS.fetch(fmt, fmt).to_s
      end
    end
  end
end
