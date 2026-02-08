module Trackplot
  module Components
    class Tooltip < Base
      def to_config
        {
          type: "tooltip",
          format: options[:format],
          label_format: options[:label_format]
        }.compact
      end
    end
  end
end
