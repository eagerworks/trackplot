module Trackplot
  module Components
    class Treemap < Base
      def to_config
        {
          type: "treemap",
          value_key: options[:value_key],
          label_key: options[:label_key],
          parent_key: options[:parent_key]
        }.compact
      end
    end
  end
end
