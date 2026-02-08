require_relative "lib/trackplot/version"

Gem::Specification.new do |spec|
  spec.name = "trackplot"
  spec.version = Trackplot::VERSION
  spec.authors = ["Eagerworks"]
  spec.summary = "Beautiful D3.js charts for Rails with a Recharts-like DSL"
  spec.description = "A Rails engine that provides a declarative Ruby DSL for building interactive, animated D3.js charts. Offers line, bar, area, and pie charts with tooltips, legends, and responsive design out of the box."
  spec.homepage = "https://github.com/eagerworks/trackplot"
  spec.license = "MIT"
  spec.required_ruby_version = ">= 3.0"

  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = spec.homepage
  spec.metadata["changelog_uri"] = "#{spec.homepage}/blob/main/CHANGELOG.md"

  spec.files = Dir[
    "lib/**/*",
    "app/**/*",
    "config/**/*",
    "LICENSE.txt"
  ]

  spec.require_paths = ["lib"]

  spec.add_dependency "railties", ">= 7.0"
  spec.add_dependency "actionview", ">= 7.0"
end
