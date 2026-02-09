module Trackplot
  module Generators
    class InstallGenerator < Rails::Generators::Base
      source_root File.expand_path("templates", __dir__)
      class_option :stimulus, type: :boolean, default: false,
        desc: "Copy a Stimulus controller for auto-refresh polling and export actions"

      desc "Install Trackplot into your Rails application"

      def detect_and_install_js
        if importmap?
          install_importmap
        elsif jsbundling?
          install_jsbundling
        else
          say "Could not detect JS setup (no config/importmap.rb or package.json found).", :red
          say "Please add `import \"trackplot\"` to your JavaScript entrypoint manually."
        end
      end

      def copy_stimulus_controller
        return unless options[:stimulus]

        dest = Rails.root.join("app/javascript/controllers/trackplot_controller.js")
        if File.exist?(dest)
          say "Stimulus controller already exists at #{dest}", :yellow
        else
          copy_file "trackplot_controller.js", dest
          say "Copied Stimulus controller to #{dest}", :green
        end
      end

      def print_post_install
        say ""
        say "Trackplot installed successfully!", :green
        say ""
        say "Quick start — add this to any ERB view:"
        say ""
        say '  <%= trackplot_chart([{month: "Jan", revenue: 100}, {month: "Feb", revenue: 200}]) do |c| %>'
        say "    <% c.axis :x, data_key: :month %>"
        say "    <% c.axis :y, format: :currency %>"
        say "    <% c.line :revenue, curve: true %>"
        say "    <% c.tooltip format: :currency %>"
        say "    <% c.legend %>"
        say "  <% end %>"
        say ""
      end

      private

      def importmap?
        File.exist?(Rails.root.join("config/importmap.rb"))
      end

      def jsbundling?
        File.exist?(Rails.root.join("package.json")) && !importmap?
      end

      def install_importmap
        say "Detected importmap setup", :cyan
        # Engine auto-registers pins via config/importmap.rb in the engine,
        # so we just need the import in application.js
        ensure_import_in_application_js
      end

      def install_jsbundling
        say "Detected jsbundling setup", :cyan
        pm = detect_package_manager
        say "Using #{pm} to install packages...", :cyan

        install_cmd = case pm
        when "yarn" then "yarn add d3 trackplot"
        when "pnpm" then "pnpm add d3 trackplot"
        else "npm install d3 trackplot"
        end

        run install_cmd
        ensure_import_in_application_js
      end

      def detect_package_manager
        if File.exist?(Rails.root.join("yarn.lock"))
          "yarn"
        elsif File.exist?(Rails.root.join("pnpm-lock.yaml"))
          "pnpm"
        else
          "npm"
        end
      end

      def ensure_import_in_application_js
        js_file = Rails.root.join("app/javascript/application.js")

        unless File.exist?(js_file)
          say "Could not find app/javascript/application.js — please add `import \"trackplot\"` manually", :red
          return
        end

        content = File.read(js_file)
        if content.include?('import "trackplot"')
          say "trackplot import already present in application.js", :yellow
        else
          append_to_file js_file, "\nimport \"trackplot\"\n"
          say "Added trackplot import to application.js", :green
        end
      end
    end
  end
end
