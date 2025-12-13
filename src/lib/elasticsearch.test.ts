import { describe, expect, it } from "vitest";
import type { Cluster } from "@/types/cluster";
import type { ElasticsearchIndexMapping } from "@/types/elasticsearch";
import {
  buildElasticsearchHeaders,
  buildIndexCacheKey,
  buildUrlWithParams,
  extractDateFields,
  extractExistsFields,
  extractFields,
  extractIndexFields,
  extractKeywordFields,
  extractNumericFields,
  extractRangeFields,
  extractSourceFields,
  extractTermFields,
  extractTextFields,
  extractVectorFields,
  generateElasticsearchQuerySchema,
} from "./elasticsearch";

describe("generateElasticsearchQuerySchema", () => {
  it("should generate basic schema without mapping", () => {
    const schema = generateElasticsearchQuerySchema();

    expect(schema.type).toBe("object");
    expect(schema.properties).toHaveProperty("query");
    expect(schema.properties).toHaveProperty("aggs");
    expect(schema.properties).toHaveProperty("from");
    expect(schema.properties).toHaveProperty("size");
    expect(schema.required).toContain("query");
  });

  it("should include all search parameters", () => {
    const schema = generateElasticsearchQuerySchema();

    expect(schema.properties).toHaveProperty("explain");
    expect(schema.properties).toHaveProperty("fields");
    expect(schema.properties).toHaveProperty("runtime_mappings");
    expect(schema.properties).toHaveProperty("highlight");
    expect(schema.properties).toHaveProperty("sort");
    expect(schema.properties).toHaveProperty("track_total_hits");
  });

  it("should include script_fields parameter", () => {
    const schema = generateElasticsearchQuerySchema();

    expect(schema.properties).toHaveProperty("script_fields");
    const scriptFields = schema.properties?.script_fields;

    if (scriptFields && typeof scriptFields === "object" && "type" in scriptFields) {
      expect(scriptFields.type).toBe("object");
      expect(scriptFields).toHaveProperty("additionalProperties");
    }
  });

  it("should include post_filter parameter", () => {
    const schema = generateElasticsearchQuerySchema();

    expect(schema.properties).toHaveProperty("post_filter");
    const postFilter = schema.properties?.post_filter;

    if (postFilter && typeof postFilter === "object" && "$ref" in postFilter) {
      expect(postFilter.$ref).toBe("#/definitions/QueryContainer");
    }
  });

  it("should include rescore parameter", () => {
    const schema = generateElasticsearchQuerySchema();

    expect(schema.properties).toHaveProperty("rescore");
    const rescore = schema.properties?.rescore;

    if (rescore && typeof rescore === "object" && "oneOf" in rescore && Array.isArray(rescore.oneOf)) {
      expect(rescore.oneOf).toHaveLength(2);
      const firstOption = rescore.oneOf[0];
      if (firstOption && typeof firstOption === "object" && "$ref" in firstOption) {
        expect(firstOption.$ref).toBe("#/definitions/Rescore");
      }
    }
  });

  it("should include suggest parameter", () => {
    const schema = generateElasticsearchQuerySchema();

    expect(schema.properties).toHaveProperty("suggest");
    const suggest = schema.properties?.suggest;

    if (suggest && typeof suggest === "object" && "$ref" in suggest) {
      expect(suggest.$ref).toBe("#/definitions/Suggest");
    }
  });

  it("should include all query types in QueryContainer", () => {
    const schema = generateElasticsearchQuerySchema();
    const queryContainer = schema.definitions?.QueryContainer;

    expect(queryContainer).toBeDefined();
    expect(queryContainer).toHaveProperty("oneOf");

    if (queryContainer && "oneOf" in queryContainer && Array.isArray(queryContainer.oneOf)) {
      const queryTypes = queryContainer.oneOf.map((q) => {
        if (typeof q === "object" && q !== null && "$ref" in q) {
          return q.$ref;
        }
        return undefined;
      });
      expect(queryTypes).toContain("#/definitions/MatchQuery");
      expect(queryTypes).toContain("#/definitions/TermQuery");
      expect(queryTypes).toContain("#/definitions/BoolQuery");
      expect(queryTypes).toContain("#/definitions/RangeQuery");
      expect(queryTypes).toContain("#/definitions/FunctionScoreQuery");
      expect(queryTypes).toContain("#/definitions/MoreLikeThisQuery");
    }
  });

  it("should include aggregations support", () => {
    const schema = generateElasticsearchQuerySchema();

    expect(schema.definitions).toHaveProperty("Aggregations");
    expect(schema.definitions).toHaveProperty("TermsAggregation");
    expect(schema.definitions).toHaveProperty("DateHistogramAggregation");
    expect(schema.definitions).toHaveProperty("MetricAggregation");
  });

  it("should have Rescore definition with required properties", () => {
    const schema = generateElasticsearchQuerySchema();

    expect(schema.definitions).toHaveProperty("Rescore");
    const rescore = schema.definitions?.Rescore;

    if (rescore && typeof rescore === "object" && "properties" in rescore) {
      expect(rescore.properties).toHaveProperty("window_size");
      expect(rescore.properties).toHaveProperty("query");

      if ("required" in rescore && Array.isArray(rescore.required)) {
        expect(rescore.required).toContain("query");
      }
    }
  });

  it("should have Suggest definition with suggester types", () => {
    const schema = generateElasticsearchQuerySchema();

    expect(schema.definitions).toHaveProperty("Suggest");
    expect(schema.definitions).toHaveProperty("TermSuggester");
    expect(schema.definitions).toHaveProperty("PhraseSuggester");
    expect(schema.definitions).toHaveProperty("CompletionSuggester");

    const suggest = schema.definitions?.Suggest;
    if (suggest && typeof suggest === "object" && "properties" in suggest) {
      expect(suggest.properties).toHaveProperty("text");
    }
  });

  it("should have TermSuggester with field property", () => {
    const schema = generateElasticsearchQuerySchema();
    const termSuggester = schema.definitions?.TermSuggester;

    if (termSuggester && typeof termSuggester === "object" && "properties" in termSuggester) {
      expect(termSuggester.properties).toHaveProperty("field");
      expect(termSuggester.properties).toHaveProperty("size");
      expect(termSuggester.properties).toHaveProperty("suggest_mode");

      if ("required" in termSuggester && Array.isArray(termSuggester.required)) {
        expect(termSuggester.required).toContain("field");
      }
    }
  });

  it("should have PhraseSuggester with field property", () => {
    const schema = generateElasticsearchQuerySchema();
    const phraseSuggester = schema.definitions?.PhraseSuggester;

    if (phraseSuggester && typeof phraseSuggester === "object" && "properties" in phraseSuggester) {
      expect(phraseSuggester.properties).toHaveProperty("field");
      expect(phraseSuggester.properties).toHaveProperty("gram_size");
      expect(phraseSuggester.properties).toHaveProperty("confidence");

      if ("required" in phraseSuggester && Array.isArray(phraseSuggester.required)) {
        expect(phraseSuggester.required).toContain("field");
      }
    }
  });

  it("should have CompletionSuggester with field and fuzzy properties", () => {
    const schema = generateElasticsearchQuerySchema();
    const completionSuggester = schema.definitions?.CompletionSuggester;

    if (completionSuggester && typeof completionSuggester === "object" && "properties" in completionSuggester) {
      expect(completionSuggester.properties).toHaveProperty("field");
      expect(completionSuggester.properties).toHaveProperty("fuzzy");
      expect(completionSuggester.properties).toHaveProperty("skip_duplicates");

      if ("required" in completionSuggester && Array.isArray(completionSuggester.required)) {
        expect(completionSuggester.required).toContain("field");
      }
    }
  });

  it("should have Script definition that supports string and object forms", () => {
    const schema = generateElasticsearchQuerySchema();
    const script = schema.definitions?.Script;

    expect(script).toBeDefined();
    if (script && typeof script === "object" && "oneOf" in script && Array.isArray(script.oneOf)) {
      expect(script.oneOf.length).toBeGreaterThanOrEqual(2);

      // Should support string form
      const hasStringForm = script.oneOf.some(
        (item) => typeof item === "object" && item !== null && "type" in item && item.type === "string",
      );
      expect(hasStringForm).toBe(true);

      // Should support object form with source
      const hasObjectForm = script.oneOf.some(
        (item) =>
          typeof item === "object" &&
          item !== null &&
          "properties" in item &&
          item.properties &&
          typeof item.properties === "object" &&
          "source" in item.properties,
      );
      expect(hasObjectForm).toBe(true);
    }
  });
});

describe("extractFields", () => {
  it("should extract top-level fields", () => {
    const mapping: ElasticsearchIndexMapping = {
      properties: {
        title: { type: "text" },
        status: { type: "keyword" },
        count: { type: "integer" },
      },
    };

    const fields = extractFields(mapping);

    expect(fields).toHaveProperty("title");
    expect(fields).toHaveProperty("status");
    expect(fields).toHaveProperty("count");
    expect(fields.title.type).toBe("text");
    expect(fields.status.type).toBe("keyword");
    expect(fields.count.type).toBe("integer");
  });

  it("should extract nested fields", () => {
    const mapping: ElasticsearchIndexMapping = {
      properties: {
        user: {
          type: "object",
          properties: {
            name: { type: "text" },
            age: { type: "integer" },
          },
        },
      },
    };

    const fields = extractFields(mapping);

    expect(fields).toHaveProperty("user");
    expect(fields).toHaveProperty("user.name");
    expect(fields).toHaveProperty("user.age");
    expect(fields["user.name"].type).toBe("text");
    expect(fields["user.age"].type).toBe("integer");
  });

  it("should handle deeply nested fields", () => {
    const mapping: ElasticsearchIndexMapping = {
      properties: {
        company: {
          type: "object",
          properties: {
            address: {
              type: "object",
              properties: {
                street: { type: "text" },
                city: { type: "keyword" },
              },
            },
          },
        },
      },
    };

    const fields = extractFields(mapping);

    expect(fields).toHaveProperty("company.address.street");
    expect(fields).toHaveProperty("company.address.city");
    expect(fields["company.address.street"].type).toBe("text");
    expect(fields["company.address.city"].type).toBe("keyword");
  });

  it("should respect _source excludes", () => {
    const mapping: ElasticsearchIndexMapping = {
      _source: {
        excludes: ["secret_*"],
      },
      properties: {
        public_field: { type: "keyword" },
        secret_key: { type: "keyword" },
      },
    };

    const fields = extractFields(mapping);

    expect(fields.public_field.source).toBe(true);
    expect(fields.secret_key.source).toBe(false);
  });

  it("should mark non-indexed fields correctly", () => {
    const mapping: ElasticsearchIndexMapping = {
      properties: {
        indexed_field: { type: "keyword" },
        non_indexed_field: { type: "keyword", index: false },
      },
    };

    const fields = extractFields(mapping);

    expect(fields.indexed_field.index).toBe(true);
    expect(fields.non_indexed_field.index).toBe(false);
  });

  it("should handle object and nested types", () => {
    const mapping: ElasticsearchIndexMapping = {
      properties: {
        obj: { type: "object" },
        nested_obj: { type: "nested" },
      },
    };

    const fields = extractFields(mapping);

    expect(fields.obj.type).toBe("object");
    expect(fields.obj.index).toBe(false);
    expect(fields.nested_obj.type).toBe("nested");
    expect(fields.nested_obj.index).toBe(false);
  });
});

describe("extractSourceFields", () => {
  it("should only return fields with source enabled", () => {
    const mapping: ElasticsearchIndexMapping = {
      _source: {
        excludes: ["internal_*"],
      },
      properties: {
        public_field: { type: "keyword" },
        internal_data: { type: "keyword" },
      },
    };

    const fields = extractSourceFields(mapping);

    expect(fields).toHaveProperty("public_field");
    expect(fields).not.toHaveProperty("internal_data");
  });
});

describe("extractIndexFields", () => {
  it("should only return indexed fields", () => {
    const mapping: ElasticsearchIndexMapping = {
      properties: {
        searchable: { type: "text" },
        not_searchable: { type: "text", index: false },
      },
    };

    const fields = extractIndexFields(mapping);

    expect(fields).toHaveProperty("searchable");
    expect(fields).not.toHaveProperty("not_searchable");
  });
});

describe("extractTextFields", () => {
  it("should extract text-searchable fields", () => {
    const mapping: ElasticsearchIndexMapping = {
      properties: {
        description: { type: "text" },
        title: { type: "match_only_text" },
        autocomplete: { type: "search_as_you_type" },
        status: { type: "keyword" },
        tag: { type: "constant_keyword" },
        count: { type: "integer" },
      },
    };

    const fields = extractTextFields(mapping);

    expect(fields).toHaveProperty("description");
    expect(fields).toHaveProperty("title");
    expect(fields).toHaveProperty("autocomplete");
    expect(fields).toHaveProperty("status"); // keyword is also text-searchable
    expect(fields).toHaveProperty("tag"); // constant_keyword is also text-searchable
    expect(fields).not.toHaveProperty("count");
  });
});

describe("extractKeywordFields", () => {
  it("should extract keyword fields", () => {
    const mapping: ElasticsearchIndexMapping = {
      properties: {
        status: { type: "keyword" },
        tag: { type: "constant_keyword" },
        pattern: { type: "wildcard" },
        description: { type: "text" },
        count: { type: "integer" },
      },
    };

    const fields = extractKeywordFields(mapping);

    expect(fields).toHaveProperty("status");
    expect(fields).toHaveProperty("tag");
    expect(fields).toHaveProperty("pattern");
    expect(fields).not.toHaveProperty("description");
    expect(fields).not.toHaveProperty("count");
  });
});

describe("extractTermFields", () => {
  it("should extract all term-level query compatible fields", () => {
    const mapping: ElasticsearchIndexMapping = {
      properties: {
        status: { type: "keyword" },
        active: { type: "boolean" },
        count: { type: "integer" },
        price: { type: "double" },
        created_at: { type: "date" },
        ip_address: { type: "ip" },
        description: { type: "text" },
      },
    };

    const fields = extractTermFields(mapping);

    expect(fields).toHaveProperty("status");
    expect(fields).toHaveProperty("active");
    expect(fields).toHaveProperty("count");
    expect(fields).toHaveProperty("price");
    expect(fields).toHaveProperty("created_at");
    expect(fields).toHaveProperty("ip_address");
    expect(fields).not.toHaveProperty("description");
  });
});

describe("extractNumericFields", () => {
  it("should extract numeric fields", () => {
    const mapping: ElasticsearchIndexMapping = {
      properties: {
        count: { type: "integer" },
        price: { type: "double" },
        quantity: { type: "long" },
        rating: { type: "float" },
        status: { type: "keyword" },
        created_at: { type: "date" },
      },
    };

    const fields = extractNumericFields(mapping);

    expect(fields).toHaveProperty("count");
    expect(fields).toHaveProperty("price");
    expect(fields).toHaveProperty("quantity");
    expect(fields).toHaveProperty("rating");
    expect(fields).not.toHaveProperty("status");
    expect(fields).not.toHaveProperty("created_at");
  });
});

describe("extractDateFields", () => {
  it("should extract date fields", () => {
    const mapping: ElasticsearchIndexMapping = {
      properties: {
        created_at: { type: "date" },
        updated_at: { type: "date_nanos" },
        count: { type: "integer" },
        status: { type: "keyword" },
      },
    };

    const fields = extractDateFields(mapping);

    expect(fields).toHaveProperty("created_at");
    expect(fields).toHaveProperty("updated_at");
    expect(fields).not.toHaveProperty("count");
    expect(fields).not.toHaveProperty("status");
  });
});

describe("extractVectorFields", () => {
  it("should extract vector fields", () => {
    const mapping: ElasticsearchIndexMapping = {
      properties: {
        embedding: { type: "dense_vector" },
        title: { type: "text" },
        count: { type: "integer" },
      },
    };

    const fields = extractVectorFields(mapping);

    expect(fields).toHaveProperty("embedding");
    expect(fields).not.toHaveProperty("title");
    expect(fields).not.toHaveProperty("count");
  });
});

describe("extractRangeFields", () => {
  it("should extract range-compatible fields", () => {
    const mapping: ElasticsearchIndexMapping = {
      properties: {
        count: { type: "integer" },
        price: { type: "double" },
        created_at: { type: "date" },
        ip_address: { type: "ip" },
        status: { type: "keyword" },
        description: { type: "text" },
      },
    };

    const fields = extractRangeFields(mapping);

    expect(fields).toHaveProperty("count");
    expect(fields).toHaveProperty("price");
    expect(fields).toHaveProperty("created_at");
    expect(fields).toHaveProperty("ip_address");
    expect(fields).not.toHaveProperty("status");
    expect(fields).not.toHaveProperty("description");
  });
});

describe("Field type constraints in queries", () => {
  it("should use TextFields for match queries", () => {
    const mapping: ElasticsearchIndexMapping = {
      properties: {
        title: { type: "text" },
        status: { type: "keyword" },
      },
    };

    const schema = generateElasticsearchQuerySchema(mapping);
    const matchQuery = schema.definitions?.MatchQuery;

    if (
      matchQuery &&
      typeof matchQuery === "object" &&
      "properties" in matchQuery &&
      matchQuery.properties &&
      typeof matchQuery.properties === "object" &&
      "match" in matchQuery.properties
    ) {
      const matchProp = matchQuery.properties.match;
      if (
        matchProp &&
        typeof matchProp === "object" &&
        "propertyNames" in matchProp &&
        matchProp.propertyNames &&
        typeof matchProp.propertyNames === "object" &&
        "enum" in matchProp.propertyNames &&
        Array.isArray(matchProp.propertyNames.enum)
      ) {
        expect(matchProp.propertyNames.enum).toContain("title");
        expect(matchProp.propertyNames.enum).toContain("status");
      }
    }
  });

  it("should use TermFields for term queries", () => {
    const mapping: ElasticsearchIndexMapping = {
      properties: {
        status: { type: "keyword" },
        active: { type: "boolean" },
        count: { type: "integer" },
        description: { type: "text" },
      },
    };

    const schema = generateElasticsearchQuerySchema(mapping);
    const termQuery = schema.definitions?.TermQuery;

    if (
      termQuery &&
      typeof termQuery === "object" &&
      "properties" in termQuery &&
      termQuery.properties &&
      typeof termQuery.properties === "object" &&
      "term" in termQuery.properties
    ) {
      const termProp = termQuery.properties.term;
      if (
        termProp &&
        typeof termProp === "object" &&
        "propertyNames" in termProp &&
        termProp.propertyNames &&
        typeof termProp.propertyNames === "object" &&
        "enum" in termProp.propertyNames &&
        Array.isArray(termProp.propertyNames.enum)
      ) {
        expect(termProp.propertyNames.enum).toContain("status");
        expect(termProp.propertyNames.enum).toContain("active");
        expect(termProp.propertyNames.enum).toContain("count");
        expect(termProp.propertyNames.enum).not.toContain("description");
      }
    }
  });

  it("should use RangeFields for range queries", () => {
    const mapping: ElasticsearchIndexMapping = {
      properties: {
        count: { type: "integer" },
        created_at: { type: "date" },
        status: { type: "keyword" },
      },
    };

    const schema = generateElasticsearchQuerySchema(mapping);
    const rangeQuery = schema.definitions?.RangeQuery;

    if (
      rangeQuery &&
      typeof rangeQuery === "object" &&
      "properties" in rangeQuery &&
      rangeQuery.properties &&
      typeof rangeQuery.properties === "object" &&
      "range" in rangeQuery.properties
    ) {
      const rangeProp = rangeQuery.properties.range;
      if (
        rangeProp &&
        typeof rangeProp === "object" &&
        "propertyNames" in rangeProp &&
        rangeProp.propertyNames &&
        typeof rangeProp.propertyNames === "object" &&
        "enum" in rangeProp.propertyNames &&
        Array.isArray(rangeProp.propertyNames.enum)
      ) {
        expect(rangeProp.propertyNames.enum).toContain("count");
        expect(rangeProp.propertyNames.enum).toContain("created_at");
        expect(rangeProp.propertyNames.enum).not.toContain("status");
      }
    }
  });

  it("should use VectorFields for knn queries", () => {
    const mapping: ElasticsearchIndexMapping = {
      properties: {
        embedding: { type: "dense_vector" },
        title: { type: "text" },
      },
    };

    const schema = generateElasticsearchQuerySchema(mapping);
    const knnQuery = schema.definitions?.KnnQuery;

    if (
      knnQuery &&
      typeof knnQuery === "object" &&
      "properties" in knnQuery &&
      knnQuery.properties &&
      typeof knnQuery.properties === "object" &&
      "field" in knnQuery.properties
    ) {
      const fieldProp = knnQuery.properties.field;
      if (fieldProp && typeof fieldProp === "object" && "enum" in fieldProp && Array.isArray(fieldProp.enum)) {
        expect(fieldProp.enum).toContain("embedding");
        expect(fieldProp.enum).not.toContain("title");
      }
    }
  });
});

describe("buildElasticsearchHeaders", () => {
  it("should return default headers for no auth", () => {
    const cluster: Cluster = {
      id: "test-id",
      name: "Test Cluster",
      auth: { type: "noauth", host: "http://localhost:9200" },
      tunnel: { type: "none" },
    };

    const headers = buildElasticsearchHeaders(cluster);

    expect(headers).toEqual({
      "Content-Type": "application/json",
    });
  });

  it("should return headers with Basic auth", () => {
    const cluster: Cluster = {
      id: "test-id",
      name: "Test Cluster",
      auth: { type: "basic", host: "http://localhost:9200", username: "user", password: "pass" },
      tunnel: { type: "none" },
    };

    const headers = buildElasticsearchHeaders(cluster);

    expect(headers).toEqual({
      "Content-Type": "application/json",
      Authorization: `Basic ${btoa("user:pass")}`,
    });
  });
});

describe("buildUrlWithParams", () => {
  it("should build URL without params", () => {
    const url = buildUrlWithParams("http://localhost:9200", "/_search");
    expect(url).toBe("http://localhost:9200/_search");
  });

  it("should build URL with params", () => {
    const url = buildUrlWithParams("http://localhost:9200", "/_search", {
      size: 10,
      from: 0,
      pretty: true,
    });

    const parsedUrl = new URL(url);
    expect(parsedUrl.origin).toBe("http://localhost:9200");
    expect(parsedUrl.pathname).toBe("/_search");
    expect(parsedUrl.searchParams.get("size")).toBe("10");
    expect(parsedUrl.searchParams.get("from")).toBe("0");
    expect(parsedUrl.searchParams.get("pretty")).toBe("true");
  });

  it("should handle empty params", () => {
    const url = buildUrlWithParams("http://localhost:9200", "/_search", {});
    expect(url).toBe("http://localhost:9200/_search");
  });
});

describe("buildIndexCacheKey", () => {
  it("should generate cache key", () => {
    const key = buildIndexCacheKey("cluster-123", "my-index");
    expect(key).toBe("cluster-123::my-index");
  });

  it("should generate cache key for wildcard", () => {
    const key = buildIndexCacheKey("cluster-456", "*");
    expect(key).toBe("cluster-456::*");
  });
});

describe("extractExistsFields", () => {
  it("should include object and nested types with indexed children", () => {
    const mapping: ElasticsearchIndexMapping = {
      properties: {
        user: {
          type: "object",
          properties: {
            name: { type: "text" },
            age: { type: "integer" },
          },
        },
        metadata: {
          type: "nested",
          properties: {
            key: { type: "keyword" },
            value: { type: "text" },
          },
        },
        title: { type: "text" },
      },
    };

    const fields = extractExistsFields(mapping);

    // Should include object and nested parent fields
    expect(fields).toHaveProperty("user");
    expect(fields.user.type).toBe("object");
    expect(fields).toHaveProperty("metadata");
    expect(fields.metadata.type).toBe("nested");

    // Should include child fields
    expect(fields).toHaveProperty("user.name");
    expect(fields).toHaveProperty("user.age");
    expect(fields).toHaveProperty("metadata.key");
    expect(fields).toHaveProperty("metadata.value");

    // Should include regular fields
    expect(fields).toHaveProperty("title");
  });

  it("should exclude fields with index: false", () => {
    const mapping: ElasticsearchIndexMapping = {
      properties: {
        indexed_field: { type: "text" },
        not_indexed: { type: "text", index: false },
      },
    };

    const fields = extractExistsFields(mapping);

    expect(fields).toHaveProperty("indexed_field");
    expect(fields).not.toHaveProperty("not_indexed");
  });

  it("should exclude object/nested with no indexed children", () => {
    const mapping: ElasticsearchIndexMapping = {
      properties: {
        disabled_object: {
          type: "object",
          properties: {
            field1: { type: "text", index: false },
            field2: { type: "keyword", index: false },
          },
        },
        enabled_object: {
          type: "object",
          properties: {
            field1: { type: "text" },
            field2: { type: "keyword", index: false },
          },
        },
      },
    };

    const fields = extractExistsFields(mapping);

    // disabled_object has no indexed children, should be excluded
    expect(fields).not.toHaveProperty("disabled_object");
    expect(fields).not.toHaveProperty("disabled_object.field1");
    expect(fields).not.toHaveProperty("disabled_object.field2");

    // enabled_object has at least one indexed child, should be included
    expect(fields).toHaveProperty("enabled_object");
    expect(fields).toHaveProperty("enabled_object.field1");
    expect(fields).not.toHaveProperty("enabled_object.field2");
  });

  it("should handle deeply nested structures", () => {
    const mapping: ElasticsearchIndexMapping = {
      properties: {
        level1: {
          type: "object",
          properties: {
            level2: {
              type: "object",
              properties: {
                level3: { type: "keyword" },
              },
            },
          },
        },
      },
    };

    const fields = extractExistsFields(mapping);

    expect(fields).toHaveProperty("level1");
    expect(fields).toHaveProperty("level1.level2");
    expect(fields).toHaveProperty("level1.level2.level3");
  });

  it("should work with nested objects containing both indexed and non-indexed fields", () => {
    const mapping: ElasticsearchIndexMapping = {
      properties: {
        product: {
          type: "object",
          properties: {
            id: { type: "keyword" },
            name: { type: "text" },
            internal_notes: { type: "text", index: false },
            metadata: {
              type: "object",
              properties: {
                created: { type: "date" },
                debug_info: { type: "text", index: false },
              },
            },
          },
        },
      },
    };

    const fields = extractExistsFields(mapping);

    expect(fields).toHaveProperty("product");
    expect(fields).toHaveProperty("product.id");
    expect(fields).toHaveProperty("product.name");
    expect(fields).not.toHaveProperty("product.internal_notes");
    expect(fields).toHaveProperty("product.metadata");
    expect(fields).toHaveProperty("product.metadata.created");
    expect(fields).not.toHaveProperty("product.metadata.debug_info");
  });
});
