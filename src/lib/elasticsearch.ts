import { minimatch } from "minimatch";
import type { ElasticsearchField, ElasticsearchIndexMapping } from "@/types/elasticsearch.js";

export const quote = (str: string) => encodeURIComponent(str);

export function generateElasticsearchQuerySchema(mapping?: ElasticsearchIndexMapping): JSONSchema {
  return {
    type: "object",
    properties: {
      query: { $ref: "#/definitions/QueryContainer" },
      knn: {
        oneOf: [{ $ref: "#/definitions/KnnQuery" }, { type: "array", items: { $ref: "#/definitions/KnnQuery" } }],
      },
      aggs: { $ref: "#/definitions/Aggregations" },
      aggregations: { $ref: "#/definitions/Aggregations" },
      from: { type: "integer", minimum: 0 },
      size: { type: "integer", minimum: 0 },
      sort: {
        oneOf: [{ $ref: "#/definitions/SortField" }, { type: "array", items: { $ref: "#/definitions/SortField" } }],
      },
      track_total_hits: { oneOf: [{ type: "boolean" }, { type: "integer", minimum: 0 }] },
      track_scores: { type: "boolean" },
      timeout: { type: "string" },
      terminate_after: { type: "integer", minimum: 0 },
      min_score: { type: "number" },
      explain: { type: "boolean" },
      version: { type: "boolean" },
      seq_no_primary_term: { type: "boolean" },
      stored_fields: {
        oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
      },
      docvalue_fields: {
        type: "array",
        items: {
          oneOf: [
            { type: "string" },
            {
              type: "object",
              properties: {
                field: { type: "string" },
                format: { type: "string" },
              },
              required: ["field"],
              additionalProperties: false,
            },
          ],
        },
      },
      fields: {
        type: "array",
        items: {
          oneOf: [
            { type: "string" },
            {
              type: "object",
              properties: {
                field: { type: "string" },
                format: { type: "string" },
              },
              required: ["field"],
              additionalProperties: false,
            },
          ],
        },
      },
      runtime_mappings: { $ref: "#/definitions/RuntimeMappings" },
      highlight: { $ref: "#/definitions/Highlight" },
      search_after: {
        type: "array",
        items: { oneOf: [{ type: "string" }, { type: "number" }, { type: "null" }] },
      },
      collapse: {
        type: "object",
        properties: {
          field: { type: "string" },
          inner_hits: {
            oneOf: [{ $ref: "#/definitions/InnerHits" }, { type: "array", items: { $ref: "#/definitions/InnerHits" } }],
          },
          max_concurrent_group_searches: { type: "integer", minimum: 1 },
        },
        required: ["field"],
        additionalProperties: false,
      },
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
          { $ref: "#/definitions/MatchQuery" },
          { $ref: "#/definitions/MatchPhraseQuery" },
          { $ref: "#/definitions/MatchPhrasePrefixQuery" },
          { $ref: "#/definitions/MatchBoolPrefixQuery" },
          { $ref: "#/definitions/MultiMatchQuery" },
          { $ref: "#/definitions/TermQuery" },
          { $ref: "#/definitions/TermsQuery" },
          { $ref: "#/definitions/RangeQuery" },
          { $ref: "#/definitions/ExistsQuery" },
          { $ref: "#/definitions/PrefixQuery" },
          { $ref: "#/definitions/WildcardQuery" },
          { $ref: "#/definitions/RegexpQuery" },
          { $ref: "#/definitions/FuzzyQuery" },
          { $ref: "#/definitions/IdsQuery" },
          { $ref: "#/definitions/QueryStringQuery" },
          { $ref: "#/definitions/SimpleQueryStringQuery" },
          { $ref: "#/definitions/NestedQuery" },
          { $ref: "#/definitions/BoolQuery" },
          { $ref: "#/definitions/FunctionScoreQuery" },
          { $ref: "#/definitions/ScriptScoreQuery" },
          { $ref: "#/definitions/MoreLikeThisQuery" },
        ],
      },
      QueryArray: {
        type: "array",
        items: { $ref: "#/definitions/QueryContainer" },
        minItems: 0,
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
      MatchQuery: {
        type: "object",
        properties: {
          match: {
            type: "object",
            propertyNames: mapping
              ? {
                  minProperties: 1,
                  enum: Object.keys(extractTextFields(mapping)),
                }
              : undefined,
            additionalProperties: {
              oneOf: [
                { type: "string" },
                { type: "number" },
                { type: "boolean" },
                {
                  type: "object",
                  properties: {
                    query: { oneOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }] },
                    operator: { type: "string", enum: ["and", "or"] },
                    fuzziness: { oneOf: [{ type: "string" }, { type: "number" }] },
                    prefix_length: { type: "integer", minimum: 0 },
                    max_expansions: { type: "integer", minimum: 0 },
                    fuzzy_transpositions: { type: "boolean" },
                    fuzzy_rewrite: { type: "string" },
                    lenient: { type: "boolean" },
                    zero_terms_query: { type: "string", enum: ["none", "all"] },
                    auto_generate_synonyms_phrase_query: { type: "boolean" },
                    boost: { type: "number", minimum: 0 },
                    analyzer: { type: "string" },
                    minimum_should_match: { oneOf: [{ type: "string" }, { type: "integer" }] },
                  },
                  required: ["query"],
                  additionalProperties: false,
                },
              ],
            },
          },
        },
        required: ["match"],
        additionalProperties: false,
      },
      MatchPhraseQuery: {
        type: "object",
        properties: {
          match_phrase: {
            type: "object",
            propertyNames: mapping
              ? {
                  minProperties: 1,
                  enum: Object.keys(extractTextFields(mapping)),
                }
              : undefined,
            additionalProperties: {
              oneOf: [
                { type: "string" },
                {
                  type: "object",
                  properties: {
                    query: { type: "string" },
                    analyzer: { type: "string" },
                    slop: { type: "integer", minimum: 0 },
                    zero_terms_query: { type: "string", enum: ["none", "all"] },
                  },
                  required: ["query"],
                  additionalProperties: false,
                },
              ],
            },
          },
        },
        required: ["match_phrase"],
        additionalProperties: false,
      },
      MatchPhrasePrefixQuery: {
        type: "object",
        properties: {
          match_phrase_prefix: {
            type: "object",
            propertyNames: mapping
              ? {
                  minProperties: 1,
                  enum: Object.keys(extractTextFields(mapping)),
                }
              : undefined,
            additionalProperties: {
              oneOf: [
                { type: "string" },
                {
                  type: "object",
                  properties: {
                    query: { type: "string" },
                    analyzer: { type: "string" },
                    max_expansions: { type: "integer", minimum: 0 },
                    slop: { type: "integer", minimum: 0 },
                    zero_terms_query: { type: "string", enum: ["none", "all"] },
                  },
                  required: ["query"],
                  additionalProperties: false,
                },
              ],
            },
          },
        },
        required: ["match_phrase_prefix"],
        additionalProperties: false,
      },
      MatchBoolPrefixQuery: {
        type: "object",
        properties: {
          match_bool_prefix: {
            type: "object",
            propertyNames: mapping
              ? {
                  minProperties: 1,
                  enum: Object.keys(extractTextFields(mapping)),
                }
              : undefined,
            additionalProperties: {
              oneOf: [
                { type: "string" },
                {
                  type: "object",
                  properties: {
                    query: { type: "string" },
                    analyzer: { type: "string" },
                    operator: { type: "string", enum: ["and", "or"] },
                    minimum_should_match: { oneOf: [{ type: "string" }, { type: "integer" }] },
                    fuzziness: { oneOf: [{ type: "string" }, { type: "number" }] },
                    prefix_length: { type: "integer", minimum: 0 },
                    max_expansions: { type: "integer", minimum: 0 },
                    fuzzy_transpositions: { type: "boolean" },
                    fuzzy_rewrite: { type: "string" },
                  },
                  required: ["query"],
                  additionalProperties: false,
                },
              ],
            },
          },
        },
        required: ["match_bool_prefix"],
        additionalProperties: false,
      },
      MultiMatchQuery: {
        type: "object",
        properties: {
          multi_match: {
            type: "object",
            properties: {
              query: { oneOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }] },
              fields: {
                type: "array",
                items: { type: "string" },
                minItems: 1,
              },
              type: {
                type: "string",
                enum: ["best_fields", "most_fields", "cross_fields", "phrase", "phrase_prefix", "bool_prefix"],
              },
              operator: { type: "string", enum: ["and", "or"] },
              minimum_should_match: { oneOf: [{ type: "string" }, { type: "integer" }] },
              analyzer: { type: "string" },
              boost: { type: "number", minimum: 0 },
              fuzziness: { oneOf: [{ type: "string" }, { type: "number" }] },
              prefix_length: { type: "integer", minimum: 0 },
              max_expansions: { type: "integer", minimum: 0 },
              fuzzy_transpositions: { type: "boolean" },
              fuzzy_rewrite: { type: "string" },
              lenient: { type: "boolean" },
              zero_terms_query: { type: "string", enum: ["none", "all"] },
              auto_generate_synonyms_phrase_query: { type: "boolean" },
              tie_breaker: { type: "number", minimum: 0, maximum: 1 },
              slop: { type: "integer", minimum: 0 },
            },
            required: ["query", "fields"],
            additionalProperties: false,
          },
        },
        required: ["multi_match"],
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
                  enum: Object.keys(extractTermFields(mapping)),
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
                  enum: Object.keys(extractTermFields(mapping)),
                }
              : undefined,
            additionalProperties: {
              oneOf: [
                {
                  type: "array",
                  items: { oneOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }] },
                  minItems: 1,
                },
                {
                  type: "object",
                  properties: {
                    index: { type: "string" },
                    id: { type: "string" },
                    path: { type: "string" },
                    routing: { type: "string" },
                  },
                  required: ["index", "id", "path"],
                  additionalProperties: false,
                },
              ],
            },
          },
        },
        required: ["terms"],
        additionalProperties: false,
      },
      RangeQuery: {
        type: "object",
        properties: {
          range: {
            type: "object",
            propertyNames: mapping
              ? {
                  minProperties: 1,
                  enum: Object.keys(extractRangeFields(mapping)),
                }
              : undefined,
            additionalProperties: {
              type: "object",
              properties: {
                gt: { oneOf: [{ type: "string" }, { type: "number" }] },
                gte: { oneOf: [{ type: "string" }, { type: "number" }] },
                lt: { oneOf: [{ type: "string" }, { type: "number" }] },
                lte: { oneOf: [{ type: "string" }, { type: "number" }] },
                format: { type: "string" },
                time_zone: { type: "string" },
                boost: { type: "number", minimum: 0 },
                relation: { type: "string", enum: ["INTERSECTS", "CONTAINS", "WITHIN"] },
              },
              additionalProperties: false,
            },
          },
        },
        required: ["range"],
        additionalProperties: false,
      },
      ExistsQuery: {
        type: "object",
        properties: {
          exists: {
            type: "object",
            properties: {
              field: mapping ? { type: "string", enum: Object.keys(extractIndexFields(mapping)) } : { type: "string" },
            },
            required: ["field"],
            additionalProperties: false,
          },
        },
        required: ["exists"],
        additionalProperties: false,
      },
      PrefixQuery: {
        type: "object",
        properties: {
          prefix: {
            type: "object",
            propertyNames: mapping
              ? {
                  minProperties: 1,
                  enum: Object.keys(extractTextFields(mapping)),
                }
              : undefined,
            additionalProperties: {
              oneOf: [
                { type: "string" },
                {
                  type: "object",
                  properties: {
                    value: { type: "string" },
                    rewrite: { type: "string" },
                    case_insensitive: { type: "boolean" },
                  },
                  required: ["value"],
                  additionalProperties: false,
                },
              ],
            },
          },
        },
        required: ["prefix"],
        additionalProperties: false,
      },
      WildcardQuery: {
        type: "object",
        properties: {
          wildcard: {
            type: "object",
            propertyNames: mapping
              ? {
                  minProperties: 1,
                  enum: Object.keys(extractTextFields(mapping)),
                }
              : undefined,
            additionalProperties: {
              oneOf: [
                { type: "string" },
                {
                  type: "object",
                  properties: {
                    value: { type: "string" },
                    boost: { type: "number", minimum: 0 },
                    rewrite: { type: "string" },
                    case_insensitive: { type: "boolean" },
                  },
                  required: ["value"],
                  additionalProperties: false,
                },
              ],
            },
          },
        },
        required: ["wildcard"],
        additionalProperties: false,
      },
      RegexpQuery: {
        type: "object",
        properties: {
          regexp: {
            type: "object",
            propertyNames: mapping
              ? {
                  minProperties: 1,
                  enum: Object.keys(extractTextFields(mapping)),
                }
              : undefined,
            additionalProperties: {
              oneOf: [
                { type: "string" },
                {
                  type: "object",
                  properties: {
                    value: { type: "string" },
                    flags: { type: "string" },
                    case_insensitive: { type: "boolean" },
                    max_determinized_states: { type: "integer", minimum: 0 },
                    rewrite: { type: "string" },
                  },
                  required: ["value"],
                  additionalProperties: false,
                },
              ],
            },
          },
        },
        required: ["regexp"],
        additionalProperties: false,
      },
      FuzzyQuery: {
        type: "object",
        properties: {
          fuzzy: {
            type: "object",
            propertyNames: mapping
              ? {
                  minProperties: 1,
                  enum: Object.keys(extractTextFields(mapping)),
                }
              : undefined,
            additionalProperties: {
              oneOf: [
                { type: "string" },
                { type: "number" },
                {
                  type: "object",
                  properties: {
                    value: { oneOf: [{ type: "string" }, { type: "number" }] },
                    fuzziness: { oneOf: [{ type: "string" }, { type: "number" }] },
                    max_expansions: { type: "integer", minimum: 0 },
                    prefix_length: { type: "integer", minimum: 0 },
                    transpositions: { type: "boolean" },
                    rewrite: { type: "string" },
                  },
                  required: ["value"],
                  additionalProperties: false,
                },
              ],
            },
          },
        },
        required: ["fuzzy"],
        additionalProperties: false,
      },
      IdsQuery: {
        type: "object",
        properties: {
          ids: {
            type: "object",
            properties: {
              values: {
                type: "array",
                items: { type: "string" },
                minItems: 1,
              },
            },
            required: ["values"],
            additionalProperties: false,
          },
        },
        required: ["ids"],
        additionalProperties: false,
      },
      QueryStringQuery: {
        type: "object",
        properties: {
          query_string: {
            type: "object",
            properties: {
              query: { type: "string" },
              default_field: { type: "string" },
              fields: {
                type: "array",
                items: { type: "string" },
              },
              default_operator: { type: "string", enum: ["AND", "OR"] },
              analyzer: { type: "string" },
              allow_leading_wildcard: { type: "boolean" },
              enable_position_increments: { type: "boolean" },
              fuzzy_max_expansions: { type: "integer", minimum: 0 },
              fuzziness: { oneOf: [{ type: "string" }, { type: "number" }] },
              fuzzy_prefix_length: { type: "integer", minimum: 0 },
              fuzzy_transpositions: { type: "boolean" },
              phrase_slop: { type: "integer", minimum: 0 },
              boost: { type: "number", minimum: 0 },
              auto_generate_synonyms_phrase_query: { type: "boolean" },
              analyze_wildcard: { type: "boolean" },
              max_determinized_states: { type: "integer", minimum: 0 },
              minimum_should_match: { oneOf: [{ type: "string" }, { type: "integer" }] },
              lenient: { type: "boolean" },
              time_zone: { type: "string" },
              quote_field_suffix: { type: "string" },
              quote_analyzer: { type: "string" },
              rewrite: { type: "string" },
            },
            required: ["query"],
            additionalProperties: false,
          },
        },
        required: ["query_string"],
        additionalProperties: false,
      },
      SimpleQueryStringQuery: {
        type: "object",
        properties: {
          simple_query_string: {
            type: "object",
            properties: {
              query: { type: "string" },
              fields: {
                type: "array",
                items: { type: "string" },
              },
              default_operator: { type: "string", enum: ["AND", "OR"] },
              analyzer: { type: "string" },
              flags: { type: "string" },
              fuzzy_max_expansions: { type: "integer", minimum: 0 },
              fuzzy_prefix_length: { type: "integer", minimum: 0 },
              fuzzy_transpositions: { type: "boolean" },
              lenient: { type: "boolean" },
              analyze_wildcard: { type: "boolean" },
              auto_generate_synonyms_phrase_query: { type: "boolean" },
              minimum_should_match: { oneOf: [{ type: "string" }, { type: "integer" }] },
              quote_field_suffix: { type: "string" },
            },
            required: ["query"],
            additionalProperties: false,
          },
        },
        required: ["simple_query_string"],
        additionalProperties: false,
      },
      NestedQuery: {
        type: "object",
        properties: {
          nested: {
            type: "object",
            properties: {
              path: { type: "string" },
              query: { $ref: "#/definitions/QueryContainer" },
              score_mode: { type: "string", enum: ["avg", "sum", "min", "max", "none"] },
              ignore_unmapped: { type: "boolean" },
            },
            required: ["path", "query"],
            additionalProperties: false,
          },
        },
        required: ["nested"],
        additionalProperties: false,
      },
      FunctionScoreQuery: {
        type: "object",
        properties: {
          function_score: {
            type: "object",
            properties: {
              query: { $ref: "#/definitions/QueryContainer" },
              boost: { type: "number" },
              functions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    filter: { $ref: "#/definitions/QueryContainer" },
                    weight: { type: "number" },
                    script_score: {
                      type: "object",
                      properties: {
                        script: { $ref: "#/definitions/Script" },
                      },
                      required: ["script"],
                      additionalProperties: false,
                    },
                    random_score: {
                      type: "object",
                      properties: {
                        seed: { oneOf: [{ type: "number" }, { type: "string" }] },
                        field: { type: "string" },
                      },
                      additionalProperties: false,
                    },
                    field_value_factor: {
                      type: "object",
                      properties: {
                        field: { type: "string" },
                        factor: { type: "number" },
                        modifier: {
                          type: "string",
                          enum: ["none", "log", "log1p", "log2p", "ln", "ln1p", "ln2p", "square", "sqrt", "reciprocal"],
                        },
                        missing: { type: "number" },
                      },
                      required: ["field"],
                      additionalProperties: false,
                    },
                    decay_function: {
                      type: "object",
                      properties: {
                        gauss: { $ref: "#/definitions/DecayFunction" },
                        exp: { $ref: "#/definitions/DecayFunction" },
                        linear: { $ref: "#/definitions/DecayFunction" },
                      },
                      additionalProperties: false,
                    },
                  },
                  additionalProperties: false,
                },
              },
              max_boost: { type: "number" },
              score_mode: { type: "string", enum: ["multiply", "sum", "avg", "first", "max", "min"] },
              boost_mode: { type: "string", enum: ["multiply", "replace", "sum", "avg", "max", "min"] },
              min_score: { type: "number" },
            },
            additionalProperties: false,
          },
        },
        required: ["function_score"],
        additionalProperties: false,
      },
      ScriptScoreQuery: {
        type: "object",
        properties: {
          script_score: {
            type: "object",
            properties: {
              query: { $ref: "#/definitions/QueryContainer" },
              script: { $ref: "#/definitions/Script" },
              min_score: { type: "number" },
            },
            required: ["query", "script"],
            additionalProperties: false,
          },
        },
        required: ["script_score"],
        additionalProperties: false,
      },
      MoreLikeThisQuery: {
        type: "object",
        properties: {
          more_like_this: {
            type: "object",
            properties: {
              fields: {
                type: "array",
                items: { type: "string" },
              },
              like: {
                type: "array",
                items: {
                  oneOf: [
                    { type: "string" },
                    {
                      type: "object",
                      properties: {
                        _index: { type: "string" },
                        _id: { type: "string" },
                        doc: { type: "object" },
                        routing: { type: "string" },
                      },
                      additionalProperties: false,
                    },
                  ],
                },
                minItems: 1,
              },
              unlike: {
                type: "array",
                items: {
                  oneOf: [
                    { type: "string" },
                    {
                      type: "object",
                      properties: {
                        _index: { type: "string" },
                        _id: { type: "string" },
                      },
                      additionalProperties: false,
                    },
                  ],
                },
              },
              max_query_terms: { type: "integer", minimum: 1 },
              min_term_freq: { type: "integer", minimum: 1 },
              min_doc_freq: { type: "integer", minimum: 1 },
              max_doc_freq: { type: "integer", minimum: 1 },
              min_word_length: { type: "integer", minimum: 1 },
              max_word_length: { type: "integer", minimum: 1 },
              stop_words: {
                type: "array",
                items: { type: "string" },
              },
              analyzer: { type: "string" },
              minimum_should_match: { oneOf: [{ type: "string" }, { type: "integer" }] },
              boost_terms: { type: "number" },
              include: { type: "boolean" },
              boost: { type: "number" },
            },
            required: ["like"],
            additionalProperties: false,
          },
        },
        required: ["more_like_this"],
        additionalProperties: false,
      },
      KnnQuery: {
        type: "object",
        properties: {
          field: mapping ? { type: "string", enum: Object.keys(extractVectorFields(mapping)) } : { type: "string" },
          query_vector: {
            type: "array",
            items: { type: "number" },
          },
          query_vector_builder: {
            type: "object",
            properties: {
              text_embedding: {
                type: "object",
                properties: {
                  model_id: { type: "string" },
                  model_text: { type: "string" },
                },
                required: ["model_id", "model_text"],
                additionalProperties: false,
              },
            },
            additionalProperties: false,
          },
          k: { type: "integer", minimum: 1 },
          num_candidates: { type: "integer", minimum: 1 },
          filter: { $ref: "#/definitions/QueryContainer" },
          similarity: { type: "number" },
          boost: { type: "number" },
        },
        required: ["field"],
        oneOf: [{ required: ["query_vector"] }, { required: ["query_vector_builder"] }],
        additionalProperties: false,
      },
      Script: {
        oneOf: [
          { type: "string" },
          {
            type: "object",
            properties: {
              source: { type: "string" },
              lang: { type: "string" },
              params: { type: "object" },
            },
            required: ["source"],
            additionalProperties: false,
          },
          {
            type: "object",
            properties: {
              id: { type: "string" },
              params: { type: "object" },
            },
            required: ["id"],
            additionalProperties: false,
          },
        ],
      },
      DecayFunction: {
        type: "object",
        additionalProperties: {
          type: "object",
          properties: {
            origin: { oneOf: [{ type: "string" }, { type: "number" }] },
            scale: { oneOf: [{ type: "string" }, { type: "number" }] },
            offset: { oneOf: [{ type: "string" }, { type: "number" }] },
            decay: { type: "number", minimum: 0, maximum: 1 },
          },
          required: ["origin", "scale"],
          additionalProperties: false,
        },
      },
      BoolQuery: {
        type: "object",
        properties: {
          bool: {
            type: "object",
            properties: {
              must: {
                oneOf: [{ $ref: "#/definitions/QueryContainer" }, { $ref: "#/definitions/QueryArray" }],
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
              minimum_should_match: { oneOf: [{ type: "string" }, { type: "integer", minimum: 0 }] },
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
      TextFields: {
        oneOf: [
          { type: "string", enum: mapping ? Object.keys(extractTextFields(mapping)) : undefined },
          { type: "string", pattern: "^[*].*" },
          { type: "string", pattern: ".*[*]$" },
        ],
      },
      KeywordFields: {
        oneOf: [
          { type: "string", enum: mapping ? Object.keys(extractKeywordFields(mapping)) : undefined },
          { type: "string", pattern: "^[*].*" },
          { type: "string", pattern: ".*[*]$" },
        ],
      },
      TermFields: {
        oneOf: [
          { type: "string", enum: mapping ? Object.keys(extractTermFields(mapping)) : undefined },
          { type: "string", pattern: "^[*].*" },
          { type: "string", pattern: ".*[*]$" },
        ],
      },
      NumericFields: {
        oneOf: [
          { type: "string", enum: mapping ? Object.keys(extractNumericFields(mapping)) : undefined },
          { type: "string", pattern: "^[*].*" },
          { type: "string", pattern: ".*[*]$" },
        ],
      },
      DateFields: {
        oneOf: [
          { type: "string", enum: mapping ? Object.keys(extractDateFields(mapping)) : undefined },
          { type: "string", pattern: "^[*].*" },
          { type: "string", pattern: ".*[*]$" },
        ],
      },
      RangeFields: {
        oneOf: [
          { type: "string", enum: mapping ? Object.keys(extractRangeFields(mapping)) : undefined },
          { type: "string", pattern: "^[*].*" },
          { type: "string", pattern: ".*[*]$" },
        ],
      },
      VectorFields: {
        oneOf: [
          { type: "string", enum: mapping ? Object.keys(extractVectorFields(mapping)) : undefined },
          { type: "string", pattern: "^[*].*" },
          { type: "string", pattern: ".*[*]$" },
        ],
      },
      SortField: {
        oneOf: [
          { type: "string" },
          {
            type: "object",
            additionalProperties: {
              oneOf: [
                { type: "string", enum: ["asc", "desc"] },
                {
                  type: "object",
                  properties: {
                    order: { type: "string", enum: ["asc", "desc"] },
                    mode: { type: "string", enum: ["min", "max", "sum", "avg", "median"] },
                    numeric_type: { type: "string", enum: ["long", "double", "date", "date_nanos"] },
                    missing: { oneOf: [{ type: "string" }, { type: "number" }] },
                    unmapped_type: { type: "string" },
                  },
                  additionalProperties: false,
                },
              ],
            },
          },
        ],
      },
      RuntimeMappings: {
        type: "object",
        additionalProperties: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["boolean", "date", "double", "geo_point", "ip", "keyword", "long", "lookup"],
            },
            script: { oneOf: [{ type: "string" }, { $ref: "#/definitions/Script" }] },
          },
          required: ["type"],
          additionalProperties: false,
        },
      },
      Highlight: {
        type: "object",
        properties: {
          fields: {
            type: "object",
            additionalProperties: {
              type: "object",
              properties: {
                fragment_size: { type: "integer", minimum: 0 },
                number_of_fragments: { type: "integer", minimum: 0 },
                fragment_offset: { type: "integer", minimum: 0 },
                pre_tags: { type: "array", items: { type: "string" } },
                post_tags: { type: "array", items: { type: "string" } },
                type: { type: "string", enum: ["unified", "plain", "fvh"] },
                boundary_scanner: { type: "string", enum: ["chars", "sentence", "word"] },
                boundary_chars: { type: "string" },
                boundary_max_scan: { type: "integer", minimum: 0 },
                order: { type: "string", enum: ["score", "none"] },
              },
              additionalProperties: false,
            },
          },
          pre_tags: { type: "array", items: { type: "string" } },
          post_tags: { type: "array", items: { type: "string" } },
          order: { type: "string", enum: ["score", "none"] },
          require_field_match: { type: "boolean" },
          boundary_scanner: { type: "string", enum: ["chars", "sentence", "word"] },
        },
        additionalProperties: false,
      },
      InnerHits: {
        type: "object",
        properties: {
          name: { type: "string" },
          from: { type: "integer", minimum: 0 },
          size: { type: "integer", minimum: 0 },
          sort: {
            oneOf: [{ $ref: "#/definitions/SortField" }, { type: "array", items: { $ref: "#/definitions/SortField" } }],
          },
          _source: {
            oneOf: [{ type: "boolean" }, { type: "string" }, { type: "array", items: { type: "string" } }],
          },
        },
        additionalProperties: false,
      },
      Aggregations: {
        type: "object",
        additionalProperties: {
          type: "object",
          properties: {
            aggs: { $ref: "#/definitions/Aggregations" },
            aggregations: { $ref: "#/definitions/Aggregations" },
            terms: { $ref: "#/definitions/TermsAggregation" },
            date_histogram: { $ref: "#/definitions/DateHistogramAggregation" },
            histogram: { $ref: "#/definitions/HistogramAggregation" },
            range: { $ref: "#/definitions/RangeAggregation" },
            date_range: { $ref: "#/definitions/DateRangeAggregation" },
            filters: { $ref: "#/definitions/FiltersAggregation" },
            filter: { $ref: "#/definitions/QueryContainer" },
            nested: {
              type: "object",
              properties: {
                path: { type: "string" },
              },
              required: ["path"],
              additionalProperties: false,
            },
            reverse_nested: {
              type: "object",
              properties: {
                path: { type: "string" },
              },
              additionalProperties: false,
            },
            avg: { $ref: "#/definitions/MetricAggregation" },
            sum: { $ref: "#/definitions/MetricAggregation" },
            min: { $ref: "#/definitions/MetricAggregation" },
            max: { $ref: "#/definitions/MetricAggregation" },
            stats: { $ref: "#/definitions/MetricAggregation" },
            extended_stats: { $ref: "#/definitions/MetricAggregation" },
            value_count: { $ref: "#/definitions/MetricAggregation" },
            cardinality: { $ref: "#/definitions/CardinalityAggregation" },
            percentiles: { $ref: "#/definitions/PercentilesAggregation" },
            percentile_ranks: { $ref: "#/definitions/PercentileRanksAggregation" },
            top_hits: { $ref: "#/definitions/TopHitsAggregation" },
          },
          additionalProperties: false,
        },
      },
      TermsAggregation: {
        type: "object",
        properties: {
          field: { type: "string" },
          size: { type: "integer", minimum: 0 },
          shard_size: { type: "integer", minimum: 0 },
          order: {
            oneOf: [
              { type: "object", additionalProperties: { type: "string", enum: ["asc", "desc"] } },
              {
                type: "array",
                items: { type: "object", additionalProperties: { type: "string", enum: ["asc", "desc"] } },
              },
            ],
          },
          min_doc_count: { type: "integer", minimum: 0 },
          shard_min_doc_count: { type: "integer", minimum: 0 },
          missing: { oneOf: [{ type: "string" }, { type: "number" }] },
          include: { oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] },
          exclude: { oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] },
        },
        additionalProperties: false,
      },
      DateHistogramAggregation: {
        type: "object",
        properties: {
          field: { type: "string" },
          calendar_interval: { type: "string" },
          fixed_interval: { type: "string" },
          format: { type: "string" },
          time_zone: { type: "string" },
          offset: { type: "string" },
          min_doc_count: { type: "integer", minimum: 0 },
          extended_bounds: {
            type: "object",
            properties: {
              min: { oneOf: [{ type: "string" }, { type: "number" }] },
              max: { oneOf: [{ type: "string" }, { type: "number" }] },
            },
            additionalProperties: false,
          },
          hard_bounds: {
            type: "object",
            properties: {
              min: { oneOf: [{ type: "string" }, { type: "number" }] },
              max: { oneOf: [{ type: "string" }, { type: "number" }] },
            },
            additionalProperties: false,
          },
          missing: { type: "string" },
        },
        additionalProperties: false,
      },
      HistogramAggregation: {
        type: "object",
        properties: {
          field: { type: "string" },
          interval: { type: "number", minimum: 0 },
          min_doc_count: { type: "integer", minimum: 0 },
          extended_bounds: {
            type: "object",
            properties: {
              min: { type: "number" },
              max: { type: "number" },
            },
            additionalProperties: false,
          },
          hard_bounds: {
            type: "object",
            properties: {
              min: { type: "number" },
              max: { type: "number" },
            },
            additionalProperties: false,
          },
          missing: { type: "number" },
        },
        required: ["field", "interval"],
        additionalProperties: false,
      },
      RangeAggregation: {
        type: "object",
        properties: {
          field: { type: "string" },
          ranges: {
            type: "array",
            items: {
              type: "object",
              properties: {
                key: { type: "string" },
                from: { type: "number" },
                to: { type: "number" },
              },
              additionalProperties: false,
            },
          },
          keyed: { type: "boolean" },
        },
        required: ["field"],
        additionalProperties: false,
      },
      DateRangeAggregation: {
        type: "object",
        properties: {
          field: { type: "string" },
          format: { type: "string" },
          time_zone: { type: "string" },
          ranges: {
            type: "array",
            items: {
              type: "object",
              properties: {
                key: { type: "string" },
                from: { oneOf: [{ type: "string" }, { type: "number" }] },
                to: { oneOf: [{ type: "string" }, { type: "number" }] },
              },
              additionalProperties: false,
            },
          },
          keyed: { type: "boolean" },
        },
        required: ["field"],
        additionalProperties: false,
      },
      FiltersAggregation: {
        type: "object",
        properties: {
          filters: {
            oneOf: [
              { type: "object", additionalProperties: { $ref: "#/definitions/QueryContainer" } },
              { type: "array", items: { $ref: "#/definitions/QueryContainer" } },
            ],
          },
          other_bucket: { type: "boolean" },
          other_bucket_key: { type: "string" },
        },
        required: ["filters"],
        additionalProperties: false,
      },
      MetricAggregation: {
        type: "object",
        properties: {
          field: { type: "string" },
          missing: { type: "number" },
          script: { $ref: "#/definitions/Script" },
        },
        additionalProperties: false,
      },
      CardinalityAggregation: {
        type: "object",
        properties: {
          field: { type: "string" },
          precision_threshold: { type: "integer", minimum: 0, maximum: 40000 },
          missing: { oneOf: [{ type: "string" }, { type: "number" }] },
        },
        additionalProperties: false,
      },
      PercentilesAggregation: {
        type: "object",
        properties: {
          field: { type: "string" },
          percents: { type: "array", items: { type: "number", minimum: 0, maximum: 100 } },
          keyed: { type: "boolean" },
          missing: { type: "number" },
        },
        additionalProperties: false,
      },
      PercentileRanksAggregation: {
        type: "object",
        properties: {
          field: { type: "string" },
          values: { type: "array", items: { type: "number" } },
          keyed: { type: "boolean" },
          missing: { type: "number" },
        },
        required: ["field", "values"],
        additionalProperties: false,
      },
      TopHitsAggregation: {
        type: "object",
        properties: {
          from: { type: "integer", minimum: 0 },
          size: { type: "integer", minimum: 0 },
          sort: {
            oneOf: [{ $ref: "#/definitions/SortField" }, { type: "array", items: { $ref: "#/definitions/SortField" } }],
          },
          _source: {
            oneOf: [{ type: "boolean" }, { type: "string" }, { type: "array", items: { type: "string" } }],
          },
        },
        additionalProperties: false,
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
    const fullPath = prefix ? `${prefix}.${field}` : field;
    const source = !excludes?.some((pattern) => minimatch(fullPath, pattern));
    fields[fullPath] = { type: props.type ?? "object", index, source };
    // Recursively extract nested fields for object and nested types
    if (props.properties) {
      fields = { ...fields, ...extractFields(props, fullPath, excludes) };
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
 * Extract text-searchable fields (text, match_only_text, search_as_you_type, keyword)
 * Suitable for: match, match_phrase, match_phrase_prefix, match_bool_prefix, more_like_this
 */
export function extractTextFields(
  mapping: ElasticsearchIndexMapping | ElasticsearchIndexMapping["properties"],
  prefix = "",
): Record<string, ElasticsearchField> {
  const textTypes = ["text", "match_only_text", "search_as_you_type", "keyword", "constant_keyword", "wildcard"];
  return Object.fromEntries(
    Object.entries(extractIndexFields(mapping, prefix)).filter(([_, config]) => textTypes.includes(config.type)),
  );
}

/**
 * Extract keyword fields (keyword, constant_keyword, wildcard)
 * Suitable for: prefix, wildcard, regexp queries on keyword fields
 */
export function extractKeywordFields(
  mapping: ElasticsearchIndexMapping | ElasticsearchIndexMapping["properties"],
  prefix = "",
): Record<string, ElasticsearchField> {
  const keywordTypes = ["keyword", "constant_keyword", "wildcard"];
  return Object.fromEntries(
    Object.entries(extractIndexFields(mapping, prefix)).filter(([_, config]) => keywordTypes.includes(config.type)),
  );
}

/**
 * Extract term-level query fields (keyword, numeric, boolean, date, ip)
 * Suitable for: term, terms queries
 */
export function extractTermFields(
  mapping: ElasticsearchIndexMapping | ElasticsearchIndexMapping["properties"],
  prefix = "",
): Record<string, ElasticsearchField> {
  const termTypes = [
    "keyword",
    "constant_keyword",
    "wildcard",
    "long",
    "integer",
    "short",
    "byte",
    "double",
    "float",
    "half_float",
    "scaled_float",
    "unsigned_long",
    "boolean",
    "date",
    "date_nanos",
    "ip",
  ];
  return Object.fromEntries(
    Object.entries(extractIndexFields(mapping, prefix)).filter(([_, config]) => termTypes.includes(config.type)),
  );
}

/**
 * Extract numeric fields (long, integer, short, byte, double, float, half_float, scaled_float, unsigned_long)
 * Suitable for: range queries, numeric aggregations
 */
export function extractNumericFields(
  mapping: ElasticsearchIndexMapping | ElasticsearchIndexMapping["properties"],
  prefix = "",
): Record<string, ElasticsearchField> {
  const numericTypes = [
    "long",
    "integer",
    "short",
    "byte",
    "double",
    "float",
    "half_float",
    "scaled_float",
    "unsigned_long",
  ];
  return Object.fromEntries(
    Object.entries(extractIndexFields(mapping, prefix)).filter(([_, config]) => numericTypes.includes(config.type)),
  );
}

/**
 * Extract date fields (date, date_nanos)
 * Suitable for: date range queries
 */
export function extractDateFields(
  mapping: ElasticsearchIndexMapping | ElasticsearchIndexMapping["properties"],
  prefix = "",
): Record<string, ElasticsearchField> {
  const dateTypes = ["date", "date_nanos"];
  return Object.fromEntries(
    Object.entries(extractIndexFields(mapping, prefix)).filter(([_, config]) => dateTypes.includes(config.type)),
  );
}

/**
 * Extract vector fields (dense_vector)
 * Suitable for: knn queries
 */
export function extractVectorFields(
  mapping: ElasticsearchIndexMapping | ElasticsearchIndexMapping["properties"],
  prefix = "",
): Record<string, ElasticsearchField> {
  return Object.fromEntries(
    Object.entries(extractFields(mapping, prefix)).filter(([_, config]) => config.type === "dense_vector"),
  );
}

/**
 * Extract fields suitable for range queries (numeric, date, ip)
 */
export function extractRangeFields(
  mapping: ElasticsearchIndexMapping | ElasticsearchIndexMapping["properties"],
  prefix = "",
): Record<string, ElasticsearchField> {
  const rangeTypes = [
    "long",
    "integer",
    "short",
    "byte",
    "double",
    "float",
    "half_float",
    "scaled_float",
    "unsigned_long",
    "date",
    "date_nanos",
    "ip",
  ];
  return Object.fromEntries(
    Object.entries(extractIndexFields(mapping, prefix)).filter(([_, config]) => rangeTypes.includes(config.type)),
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
