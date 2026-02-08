module Trackplot
  class DataAdapter
    def self.normalize(data)
      records = case data
      when -> (d) { defined?(ActiveRecord::Relation) && d.is_a?(ActiveRecord::Relation) }
        data.map { |record| record.attributes.symbolize_keys }
      when Array
        data.map { |item| coerce_record(item) }
      when Hash
        [data.symbolize_keys]
      else
        Array(data).map { |item| coerce_record(item) }
      end

      stringify_keys_for_json(records)
    end

    def self.coerce_record(item)
      case item
      when Hash
        item.symbolize_keys
      when -> (i) { i.respond_to?(:attributes) }
        item.attributes.symbolize_keys
      when -> (i) { i.respond_to?(:to_h) }
        item.to_h.symbolize_keys
      else
        raise ArgumentError, "Trackplot: cannot convert #{item.class} to chart data. Expected Hash, ActiveRecord, or an object responding to #to_h."
      end
    end

    def self.stringify_keys_for_json(records)
      records.map { |record| record.transform_keys(&:to_s) }
    end

    private_class_method :coerce_record, :stringify_keys_for_json
  end
end
