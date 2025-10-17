import { minimatch } from "minimatch";

export interface ElasticsearchField {
  type: string;
  index?: boolean;
  source?: boolean;
}

export interface ElasticsearchIndexMapping {
  _source?: {
    excludes?: string[];
  };
  properties: {
    [field: string]:
      | {
          properties?: ElasticsearchIndexMapping["properties"];
        }
      | {
          type: string;
          index?: boolean | string;
        };
  };
}

export interface ElasticsearchIndex {
  aliases: { [alias: string]: JSONValue };
  mappings: ElasticsearchIndexMapping;
  settings: Record<string, JSONValue>;
}

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
