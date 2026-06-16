module Trackplot
  module Components
    class HorizontalBar < Base
      attr_reader :data_key

      def initialize(data_key, **options)
        @data_key = data_key
        super(**options)
      end

      def to_config
        {
          type: "horizontal_bar",
          data_key: data_key,
          color: options[:color],
          opacity: options[:opacity],
          radius: options[:radius] || 4,
          name: options[:name] || data_key
        }.compact
      end
    end
  end
end
