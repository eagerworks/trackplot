module Trackplot
  module Components
    class Base
      attr_reader :options

      def initialize(**options)
        @options = options
      end

      def type
        self.class.name.demodulize.underscore
      end

      def to_config
        { type: type }.merge(options).compact
      end
    end
  end
end
