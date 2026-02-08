module Trackplot
  module Components
    class Legend < Base
      def to_config
        {
          type: "legend",
          position: options[:position] || "bottom",
          clickable: options.fetch(:clickable, true)
        }.compact
      end
    end
  end
end
