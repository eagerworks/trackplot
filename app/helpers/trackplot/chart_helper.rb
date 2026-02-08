module Trackplot
  module ChartHelper
    def trackplot_chart(data, **options, &block)
      builder = ChartBuilder.new(data, **options)
      capture(builder, &block) if block_given?
      builder.render(self)
    end
  end
end
