module Trackplot
  module Generators
    class InstallGenerator < Rails::Generators::Base
      desc "Install Trackplot into your Rails application"

      def add_import
        js_file = Rails.root.join("app/javascript/application.js")

        if File.exist?(js_file)
          content = File.read(js_file)
          if content.include?('import "trackplot"')
            say "trackplot import already present in application.js", :yellow
          else
            append_to_file js_file, "\nimport \"trackplot\"\n"
            say "Added trackplot import to application.js", :green
          end
        else
          say "Could not find app/javascript/application.js — please add `import \"trackplot\"` manually", :red
        end
      end
    end
  end
end
