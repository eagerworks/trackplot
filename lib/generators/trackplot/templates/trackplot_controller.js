import { Controller } from "@hotwired/stimulus"

// Auto-refreshing chart controller for Trackplot.
//
// Usage:
//   <div data-controller="trackplot"
//        data-trackplot-url-value="/api/chart_data.json"
//        data-trackplot-interval-value="5000">
//     <trackplot-chart config='<%= chart_config_json %>'></trackplot-chart>
//   </div>
//
// Actions:
//   <button data-action="trackplot#exportPng">Download PNG</button>
//   <button data-action="trackplot#exportSvg">Download SVG</button>

export default class extends Controller {
  static values = {
    url: String,
    interval: { type: Number, default: 0 }
  }

  connect() {
    this.chart = this.element.querySelector("trackplot-chart")
    if (this.urlValue && this.intervalValue > 0) {
      this.poll = setInterval(() => this.refresh(), this.intervalValue)
    }
  }

  disconnect() {
    if (this.poll) clearInterval(this.poll)
  }

  async refresh() {
    if (!this.urlValue || !this.chart) return
    try {
      const response = await fetch(this.urlValue)
      if (!response.ok) return
      const data = await response.json()
      this.chart.updateData(data)
    } catch (e) {
      console.warn("Trackplot: refresh failed", e)
    }
  }

  exportPng() {
    this.chart?.exportPNG()
  }

  exportSvg() {
    this.chart?.exportSVG()
  }
}
