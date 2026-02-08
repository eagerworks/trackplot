source "https://rubygems.org"

gemspec

gem "rake"
gem "minitest"
rails_version = ENV.fetch("RAILS_VERSION", ">= 7.0")
gem "rails", (rails_version.match?(/^\d/) ? "~> #{rails_version}.0" : rails_version)
gem "standard"
