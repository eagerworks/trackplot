module Trackplot
  module Components
    class Candlestick < Base
      def to_config
        {
          type: "candlestick",
          open: options[:open],
          high: options[:high],
          low: options[:low],
          close: options[:close],
          up_color: options[:up_color] || "#10b981",
          down_color: options[:down_color] || "#ef4444"
        }.compact
      end
    end
  end
end
