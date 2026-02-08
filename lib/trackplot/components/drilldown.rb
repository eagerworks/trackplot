module Trackplot
  module Components
    class Drilldown < Base
      def to_config
        {
          type: "drilldown",
          key: options[:key].to_s
        }
      end
    end
  end
end
