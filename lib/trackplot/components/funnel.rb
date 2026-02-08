module Trackplot
  module Components
    class Funnel < Base
      attr_reader :data_key

      def initialize(data_key, **options)
        @data_key = data_key
        super(**options)
      end

      def to_config
        {
          type: "funnel",
          data_key: data_key,
          label_key: options[:label_key]
        }.compact
      end
    end
  end
end
