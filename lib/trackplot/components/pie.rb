module Trackplot
  module Components
    class Pie < Base
      attr_reader :data_key

      def initialize(data_key, **options)
        @data_key = data_key
        super(**options)
      end

      def to_config
        {
          type: "pie",
          data_key: data_key,
          label_key: options[:label_key],
          donut: options.fetch(:donut, false),
          inner_radius: options[:inner_radius],
          pad_angle: options[:pad_angle] || 0.02
        }.compact
      end
    end
  end
end
