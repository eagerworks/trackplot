module Trackplot
  class Theme
    PRESETS = {
      default: {
        colors: ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"],
        background: "transparent",
        text_color: "#374151",
        axis_color: "#d1d5db",
        grid_color: "#e5e7eb",
        tooltip_bg: "rgba(255, 255, 255, 0.96)",
        tooltip_text: "#111827",
        tooltip_border: "#e5e7eb",
        font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      },
      dark: {
        colors: ["#818cf8", "#22d3ee", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#f472b6", "#2dd4bf"],
        background: "#1e1e2e",
        text_color: "#e2e8f0",
        axis_color: "#4a5568",
        grid_color: "#2d3748",
        tooltip_bg: "rgba(30, 30, 46, 0.96)",
        tooltip_text: "#f1f5f9",
        tooltip_border: "#4a5568",
        font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      },
      vibrant: {
        colors: ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff922b", "#cc5de8", "#20c997", "#f06595"],
        background: "transparent",
        text_color: "#2d3436",
        axis_color: "#b2bec3",
        grid_color: "#dfe6e9",
        tooltip_bg: "rgba(255, 255, 255, 0.96)",
        tooltip_text: "#2d3436",
        tooltip_border: "#dfe6e9",
        font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      },
      minimal: {
        colors: ["#475569", "#94a3b8", "#334155", "#64748b", "#1e293b", "#78716c", "#57534e", "#a8a29e"],
        background: "transparent",
        text_color: "#64748b",
        axis_color: "#e2e8f0",
        grid_color: "#f1f5f9",
        tooltip_bg: "rgba(255, 255, 255, 0.96)",
        tooltip_text: "#334155",
        tooltip_border: "#e2e8f0",
        font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }
    }.freeze

    def self.resolve(option)
      case option
      when nil then PRESETS[:default]
      when Symbol then PRESETS.fetch(option) { raise ArgumentError, "Unknown theme: #{option}. Available: #{PRESETS.keys.join(', ')}" }
      when Hash then PRESETS[:default].merge(option.transform_keys(&:to_sym))
      else raise ArgumentError, "Theme must be a Symbol, Hash, or nil"
      end
    end
  end
end
