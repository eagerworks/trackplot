# Contributing to Trackplot

Thank you for considering contributing to Trackplot! This guide will help you get started.

## Development Setup

1. **Clone the repository**

```bash
git clone https://github.com/eagerworks/trackplot.git
cd trackplot
```

2. **Install dependencies**

```bash
bundle install
```

3. **Run the test suite**

```bash
bundle exec rake
```

Or run tests directly:

```bash
ruby -Ilib -Itest -e "Dir['test/**/*_test.rb'].each { |f| require File.expand_path(f) }"
```

4. **Run the dummy Rails app** (for visual testing)

```bash
cd test/dummy
bin/rails server
```

Then open `http://localhost:3000/charts` in your browser.

## Running the Linter

We use [Standard Ruby](https://github.com/standardrb/standard) for code formatting:

```bash
bundle exec standardrb
```

To auto-fix violations:

```bash
bundle exec standardrb --fix
```

## Project Structure

```
lib/trackplot/
  chart_builder.rb          # Main DSL builder
  sparkline_builder.rb      # Sparkline mini-chart builder
  data_adapter.rb           # Normalizes input data
  theme.rb                  # Theme presets and resolution
  engine.rb                 # Rails engine setup
  components/               # One file per chart/component type
    base.rb, line.rb, bar.rb, area.rb, pie.rb, ...

app/
  assets/javascripts/trackplot/
    index.js                # Complete JS engine (D3 rendering)
  helpers/trackplot/
    chart_helper.rb         # View helpers

test/
  trackplot/
    chart_builder_test.rb   # Ruby DSL tests
  dummy/                    # Rails dummy app for integration testing
```

## How to Contribute

### Reporting Bugs

- Open an issue at https://github.com/eagerworks/trackplot/issues
- Include: Ruby/Rails version, browser, minimal reproduction steps, expected vs actual behavior

### Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Add tests for new functionality
5. Run the full test suite (`bundle exec rake`)
6. Run the linter (`bundle exec standardrb`)
7. Commit with a descriptive message
8. Push to your fork and open a Pull Request

### Coding Conventions

- Follow Standard Ruby style
- Ruby components follow the existing pattern: inherit from `Components::Base`, implement `to_config`
- JS renderers follow the pattern: `renderXxx(g, data, ..., theme, chartElement)` function
- Keep the JS in a single `index.js` file (no build step)
- Test Ruby DSL output (config hashes), not HTML rendering
- Use `transform_keys` (stdlib) instead of `symbolize_keys` (ActiveSupport) in gem code

### Adding a New Chart Type

1. Create `lib/trackplot/components/my_chart.rb` inheriting from `Base`
2. Add autoload in `lib/trackplot.rb`
3. Add DSL method in `chart_builder.rb`
4. Add renderer function in `index.js`
5. Register the type in `ALL_SERIES_TYPES` constant
6. Add tooltip support if applicable
7. Add tests in `chart_builder_test.rb`
8. Add demo in `test/dummy/app/views/charts/index.html.erb`
