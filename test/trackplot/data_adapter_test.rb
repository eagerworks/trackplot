require_relative "../test_helper"

class DataAdapterTest < Minitest::Test
  def test_normalizes_array_of_hashes_with_symbol_keys
    data = [{ month: "Jan", revenue: 100 }, { month: "Feb", revenue: 200 }]
    result = Trackplot::DataAdapter.normalize(data)

    assert_equal 2, result.length
    assert_equal({ "month" => "Jan", "revenue" => 100 }, result[0])
    assert_equal({ "month" => "Feb", "revenue" => 200 }, result[1])
  end

  def test_normalizes_array_of_hashes_with_string_keys
    data = [{ "name" => "Alice", "score" => 95 }]
    result = Trackplot::DataAdapter.normalize(data)

    assert_equal [{ "name" => "Alice", "score" => 95 }], result
  end

  def test_normalizes_single_hash
    data = { month: "Jan", revenue: 100 }
    result = Trackplot::DataAdapter.normalize(data)

    assert_equal [{ "month" => "Jan", "revenue" => 100 }], result
  end

  def test_normalizes_objects_responding_to_to_h
    obj = Struct.new(:month, :revenue).new("Jan", 100)
    result = Trackplot::DataAdapter.normalize([obj])

    assert_equal [{ "month" => "Jan", "revenue" => 100 }], result
  end

  def test_raises_on_unsupported_type
    assert_raises(ArgumentError) do
      Trackplot::DataAdapter.normalize([42])
    end
  end

  def test_empty_array
    assert_equal [], Trackplot::DataAdapter.normalize([])
  end
end
