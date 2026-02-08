begin
  require "view_component"
rescue LoadError
  # ViewComponent is an optional dependency
end

module Trackplot
  if defined?(ViewComponent::Base)
    class Component < ViewComponent::Base
      def initialize(data:, **options, &block)
        @builder = ChartBuilder.new(data, **options)
        @block = block
      end

      def call
        @block&.call(@builder)
        @builder.render(self)
      end
    end
  end
end
