module Trackplot
  module Components
    class DataLabel < Base
      FORMAT_SYMBOLS = {
        currency: "currency",
        percent: "percent",
        compact: "compact",
        decimal: "decimal",
        integer: "integer"
      }.freeze

      def to_config
        {
          type: "data_label",
          format: resolve_format(options[:format]),
          position: (options[:position] || :top).to_s,
          font_size: options[:font_size] || 11
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
