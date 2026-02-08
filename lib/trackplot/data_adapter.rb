module Trackplot
  class DataAdapter
    def self.normalize(data)
      records = case data
      when -> (d) { defined?(ActiveRecord::Relation) && d.is_a?(ActiveRecord::Relation) }
        data.map { |record| to_string_hash(record.attributes) }
      when Array
        data.map { |item| coerce_record(item) }
      when Hash
        [data.transform_keys(&:to_s)]
      else
        Array(data).map { |item| coerce_record(item) }
      end

      records.map { |r| r.transform_keys(&:to_s) }
    end

    def self.coerce_record(item)
      case item
      when Hash
        item
      when -> (i) { i.respond_to?(:attributes) }
        item.attributes
      when -> (i) { i.respond_to?(:to_h) }
        item.to_h
      else
        raise ArgumentError, "Trackplot: cannot convert #{item.class} to chart data. Expected Hash, ActiveRecord, or an object responding to #to_h."
      end
    end

    private_class_method :coerce_record
  end
end
