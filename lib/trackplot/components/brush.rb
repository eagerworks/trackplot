module Trackplot
  module Components
    class Brush < Base
      def to_config
        {
          type: "brush",
          axis: (options[:axis] || :x).to_s,
          height: options[:height] || 40
        }.compact
      end
    end
  end
end
