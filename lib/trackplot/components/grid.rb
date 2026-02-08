module Trackplot
  module Components
    class Grid < Base
      def to_config
        {
          type: "grid",
          horizontal: options.fetch(:horizontal, true),
          vertical: options.fetch(:vertical, false)
        }.compact
      end
    end
  end
end
