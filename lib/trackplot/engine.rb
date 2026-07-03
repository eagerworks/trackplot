module Trackplot
  class Engine < ::Rails::Engine
    isolate_namespace Trackplot

    initializer "trackplot.helpers" do
      require_relative "../../app/helpers/trackplot/chart_helper"
      ActiveSupport.on_load(:action_view) do
        include Trackplot::ChartHelper
      end
    end

    initializer "trackplot.assets" do |app|
      app.config.assets.paths << root.join("app/assets/javascripts") if app.config.respond_to?(:assets)
    end

    initializer "trackplot.importmap", before: "importmap" do |app|
      if app.config.respond_to?(:importmap)
        app.config.importmap.paths << root.join("config/importmap.rb")
        app.config.importmap.cache_sweepers << root.join("app/assets/javascripts")
      end
    end
  end
end
