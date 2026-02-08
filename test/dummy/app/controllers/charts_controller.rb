class ChartsController < ApplicationController
  def index
    # Line / Area chart data
    @sales_data = [
      {month: "Jan", revenue: 4000, profit: 2400, costs: 1600},
      {month: "Feb", revenue: 3000, profit: 1398, costs: 1602},
      {month: "Mar", revenue: 5000, profit: 3800, costs: 1200},
      {month: "Apr", revenue: 4780, profit: 3908, costs: 872},
      {month: "May", revenue: 5890, profit: 4800, costs: 1090},
      {month: "Jun", revenue: 6390, profit: 5300, costs: 1090},
      {month: "Jul", revenue: 7490, profit: 6100, costs: 1390}
    ]

    # Bar chart data
    @category_data = [
      {name: "Electronics", sales: 4200},
      {name: "Clothing", sales: 3100},
      {name: "Food", sales: 2800},
      {name: "Books", sales: 1900},
      {name: "Sports", sales: 2400},
      {name: "Home", sales: 3600}
    ]

    # Pie chart data
    @market_share = [
      {segment: "Desktop", value: 42},
      {segment: "Mobile", value: 35},
      {segment: "Tablet", value: 13},
      {segment: "Other", value: 10}
    ]

    # Scatter plot data
    @scatter_data = [
      {height: 170, weight: 65}, {height: 175, weight: 72},
      {height: 160, weight: 55}, {height: 180, weight: 80},
      {height: 165, weight: 60}, {height: 185, weight: 88},
      {height: 172, weight: 68}, {height: 168, weight: 62},
      {height: 178, weight: 76}, {height: 155, weight: 50},
      {height: 190, weight: 92}, {height: 163, weight: 57},
      {height: 182, weight: 84}, {height: 167, weight: 64},
      {height: 173, weight: 70}
    ]

    # Radar chart data
    @player_stats = [
      {stat: "Speed", player_a: 85, player_b: 70},
      {stat: "Shooting", player_a: 75, player_b: 90},
      {stat: "Passing", player_a: 90, player_b: 65},
      {stat: "Defense", player_a: 60, player_b: 85},
      {stat: "Dribbling", player_a: 88, player_b: 72},
      {stat: "Stamina", player_a: 70, player_b: 80}
    ]

    # Horizontal bar data
    @ranking_data = [
      {language: "JavaScript", popularity: 64},
      {language: "Python", popularity: 58},
      {language: "TypeScript", popularity: 43},
      {language: "Java", popularity: 35},
      {language: "Ruby", popularity: 28},
      {language: "Go", popularity: 22}
    ]

    # Candlestick data
    @stock_data = [
      {date: "Mon", open: 150, high: 158, low: 148, close: 155},
      {date: "Tue", open: 155, high: 162, low: 153, close: 160},
      {date: "Wed", open: 160, high: 165, low: 155, close: 157},
      {date: "Thu", open: 157, high: 163, low: 150, close: 152},
      {date: "Fri", open: 152, high: 159, low: 149, close: 158},
      {date: "Sat", open: 158, high: 168, low: 156, close: 165},
      {date: "Sun", open: 165, high: 172, low: 162, close: 170}
    ]

    # Funnel data
    @funnel_data = [
      {stage: "Visitors", count: 10000},
      {stage: "Sign-ups", count: 6500},
      {stage: "Trial", count: 3200},
      {stage: "Paid", count: 1800},
      {stage: "Retained", count: 1200}
    ]

    # Heatmap data
    @heatmap_data = []
    %w[Mon Tue Wed Thu Fri Sat Sun].each do |day|
      (0..23).each do |hour|
        @heatmap_data << {day: day, hour: hour.to_s, count: rand(1..100)}
      end
    end

    # Treemap data
    @treemap_data = [
      {name: "React", category: "Frontend", size: 4200},
      {name: "Vue", category: "Frontend", size: 2800},
      {name: "Angular", category: "Frontend", size: 2100},
      {name: "Svelte", category: "Frontend", size: 1200},
      {name: "Rails", category: "Backend", size: 3500},
      {name: "Django", category: "Backend", size: 2900},
      {name: "Express", category: "Backend", size: 2600},
      {name: "Laravel", category: "Backend", size: 2200},
      {name: "PostgreSQL", category: "Database", size: 3800},
      {name: "MongoDB", category: "Database", size: 2400},
      {name: "Redis", category: "Database", size: 1800}
    ]

    # Dual Y-axis data
    @dual_axis_data = [
      {month: "Jan", revenue: 4000, orders: 120},
      {month: "Feb", revenue: 3000, orders: 90},
      {month: "Mar", revenue: 5000, orders: 150},
      {month: "Apr", revenue: 4780, orders: 140},
      {month: "May", revenue: 5890, orders: 175},
      {month: "Jun", revenue: 6390, orders: 190},
      {month: "Jul", revenue: 7490, orders: 220}
    ]

    # Sparkline data
    @sparkline_data = (1..20).map { |i| {x: i, value: rand(20..80)} }
  end
end
