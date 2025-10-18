import { minimatch } from "minimatch";
import type { ElasticsearchField, ElasticsearchIndexMapping } from "@/types/elasticsearch.js";

export const quote = (str: string) => encodeURIComponent(str);

export function generateElasticsearchQuerySchema(mapping?: ElasticsearchIndexMapping): JSONSchema {
  return {
    type: "object",
    properties: {
      query: { $ref: "#/definitions/QueryContainer" },
      from: { type: "integer", minimum: 0 },
      size: { type: "integer", minimum: 0 },
      track_total_hits: { oneOf: [{ type: "boolean" }, { type: "integer", minimum: 0 }] },
      _source: {
        oneOf: [
          { type: "boolean" },
          { $ref: "#/definitions/SourceFields" },
          {
            type: "array",
            items: { $ref: "#/definitions/SourceFields" },
            uniqueItems: true,
          },
          {
            type: "object",
            properties: {
              includes: {
                oneOf: [
                  { $ref: "#/definitions/SourceFields" },
                  {
                    type: "array",
                    items: { $ref: "#/definitions/SourceFields" },
                    uniqueItems: true,
                  },
                ],
              },
              excludes: {
                oneOf: [
                  { $ref: "#/definitions/SourceFields" },
                  {
                    type: "array",
                    items: { $ref: "#/definitions/SourceFields" },
                    uniqueItems: true,
                  },
                ],
              },
            },
            additionalProperties: false,
          },
        ],
      },
    },
    required: ["query"],
    additionalProperties: false,
    definitions: {
      QueryContainer: {
        oneOf: [
          { $ref: "#/definitions/MatchAllQuery" },
          { $ref: "#/definitions/TermQuery" },
          { $ref: "#/definitions/TermsQuery" },
          { $ref: "#/definitions/BoolQuery" },
        ],
      },
      QueryArray: {
        type: "array",
        items: { $ref: "#/definitions/QueryContainer" },
        minItems: 1,
      },
      MatchAllQuery: {
        type: "object",
        properties: {
          match_all: {
            type: "object",
            properties: {
              boost: { type: "number", minimum: 0 },
            },
            additionalProperties: false,
          },
        },
        required: ["match_all"],
        additionalProperties: false,
      },
      TermQuery: {
        type: "object",
        properties: {
          term: {
            type: "object",
            propertyNames: mapping
              ? {
                  minProperties: 1,
                  enum: Object.keys(extractIndexFields(mapping)),
                }
              : undefined,
            additionalProperties: {
              oneOf: [
                { type: "string" },
                { type: "number" },
                { type: "boolean" },
                { type: "object", properties: { value: {} }, required: ["value"], additionalProperties: false },
              ],
            },
          },
        },
        required: ["term"],
        additionalProperties: false,
      },
      TermsQuery: {
        type: "object",
        properties: {
          terms: {
            type: "object",
            propertyNames: mapping
              ? {
                  minProperties: 1,
                  enum: Object.keys(extractIndexFields(mapping)),
                }
              : undefined,
            additionalProperties: {
              oneOf: [
                {
                  type: "array",
                  items: [{ type: "string" }, { type: "number" }, { type: "boolean" }],
                  minItems: 1,
                },
                { type: "object", properties: { value: {} }, required: ["value"], additionalProperties: false },
              ],
            },
          },
        },
        required: ["terms"],
        additionalProperties: false,
      },
      BoolQuery: {
        type: "object",
        properties: {
          bool: {
            type: "object",
            properties: {
              must: {
                oneOf: [
                  { $ref: "#/definitions/QueryContainer" },
                  {
                    type: "array",
                    items: { $ref: "#/definitions/QueryContainer" },
                    minItems: 1,
                  },
                ],
              },
              filter: {
                oneOf: [{ $ref: "#/definitions/QueryContainer" }, { $ref: "#/definitions/QueryArray" }],
              },
              should: {
                oneOf: [{ $ref: "#/definitions/QueryContainer" }, { $ref: "#/definitions/QueryArray" }],
              },
              must_not: {
                oneOf: [{ $ref: "#/definitions/QueryContainer" }, { $ref: "#/definitions/QueryArray" }],
              },
              minimum_should_match: { type: "integer", minimum: 0 },
              boost: { type: "number", minimum: 0 },
            },
            additionalProperties: false,
          },
        },
        required: ["bool"],
        additionalProperties: false,
      },
      SourceFields: {
        oneOf: [
          { type: "string", enum: mapping ? Object.keys(extractSourceFields(mapping)) : undefined },
          { type: "string", pattern: "^[*].*" },
          { type: "string", pattern: ".*[*]$" },
        ],
      },
      IndexFields: {
        oneOf: [
          { type: "string", enum: mapping ? Object.keys(extractIndexFields(mapping)) : undefined },
          { type: "string", pattern: "^[*].*" },
          { type: "string", pattern: ".*[*]$" },
        ],
      },
    },
  };
}

export function extractFields(
  mapping: ElasticsearchIndexMapping | ElasticsearchIndexMapping["properties"],
  prefix: string = "",
  excludes?: string[],
): Record<string, ElasticsearchField> {
  //@ts-expect-error
  excludes = excludes ?? mapping._source?.excludes;
  let fields: Record<string, ElasticsearchField> = {};
  for (const [field, props] of Object.entries(mapping.properties)) {
    const index = props.type && props.type !== "object" && props.type !== "nested" && props.index !== false;
    const source = !excludes?.some((pattern) => minimatch(field, pattern));
    const fullPath = prefix ? `${prefix}.${field}` : field;
    fields[fullPath] = { type: props.type ?? "object", index, source };
    if (props.properties) {
      fields = { ...fields, ...extractSourceFields(props, fullPath, excludes) };
    }
  }
  return fields;
}

export function extractSourceFields(
  mapping: ElasticsearchIndexMapping | ElasticsearchIndexMapping["properties"],
  prefix: string = "",
  excludes?: string[],
): Record<string, ElasticsearchField> {
  return Object.fromEntries(
    Object.entries(extractFields(mapping, prefix, excludes)).filter(([_, config]) => config.source !== false),
  );
}

export function extractIndexFields(
  mapping: ElasticsearchIndexMapping | ElasticsearchIndexMapping["properties"],
  prefix = "",
): Record<string, ElasticsearchField> {
  return Object.fromEntries(
    Object.entries(extractFields(mapping, prefix)).filter(([_, config]) => config.index !== false),
  );
}

/**
 * Get Tailwind CSS color class for an Elasticsearch field type
 */
export function getFieldTypeColor(fieldType: string): string {
  // Text types
  if (fieldType === "text" || fieldType === "match_only_text") {
    return "bg-blue-300/60";
  }
  if (fieldType === "keyword" || fieldType === "constant_keyword" || fieldType === "wildcard") {
    return "bg-blue-400/60";
  }

  // Numeric types
  if (
    fieldType === "long" ||
    fieldType === "integer" ||
    fieldType === "short" ||
    fieldType === "byte" ||
    fieldType === "double" ||
    fieldType === "float" ||
    fieldType === "half_float" ||
    fieldType === "scaled_float" ||
    fieldType === "unsigned_long"
  ) {
    return "bg-emerald-300/60";
  }

  // Date types
  if (fieldType === "date" || fieldType === "date_nanos") {
    return "bg-purple-300/60";
  }

  // Boolean
  if (fieldType === "boolean") {
    return "bg-amber-300/60";
  }

  // Binary
  if (fieldType === "binary") {
    return "bg-slate-300/60";
  }

  // Range types
  if (
    fieldType === "integer_range" ||
    fieldType === "float_range" ||
    fieldType === "long_range" ||
    fieldType === "double_range" ||
    fieldType === "date_range" ||
    fieldType === "ip_range"
  ) {
    return "bg-emerald-400/60";
  }

  // Object/Nested
  if (fieldType === "object" || fieldType === "nested" || fieldType === "flattened") {
    return "bg-orange-300/60";
  }

  // Geo types
  if (fieldType === "geo_point" || fieldType === "geo_shape") {
    return "bg-teal-300/60";
  }

  // IP
  if (fieldType === "ip") {
    return "bg-cyan-300/60";
  }

  // Completion
  if (fieldType === "completion") {
    return "bg-indigo-300/60";
  }

  // Search as you type
  if (fieldType === "search_as_you_type") {
    return "bg-sky-300/60";
  }

  // Token count
  if (fieldType === "token_count") {
    return "bg-yellow-300/60";
  }

  // Dense vector
  if (fieldType === "dense_vector") {
    return "bg-pink-300/60";
  }

  // Rank features/feature
  if (fieldType === "rank_feature" || fieldType === "rank_features") {
    return "bg-rose-300/60";
  }

  // Alias
  if (fieldType === "alias") {
    return "bg-slate-400/60";
  }

  // Join
  if (fieldType === "join") {
    return "bg-violet-300/60";
  }

  // Percolator
  if (fieldType === "percolator") {
    return "bg-fuchsia-300/60";
  }

  // Default for unknown types
  return "bg-gray-400/60";
}
