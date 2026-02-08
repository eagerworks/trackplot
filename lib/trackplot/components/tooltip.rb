module Trackplot
  module Components
    class Tooltip < Base
      FORMAT_SYMBOLS = {
        currency: "currency",
        percent: "percent",
        compact: "compact",
        decimal: "decimal",
        integer: "integer"
      }.freeze

      def to_config
        {
          type: "tooltip",
          format: resolve_format(options[:format]),
          label_format: options[:label_format]
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
