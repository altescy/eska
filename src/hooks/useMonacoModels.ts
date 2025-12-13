import type { Monaco } from "@monaco-editor/react";
import { useAtom } from "jotai";
import type * as MonacoAPI from "monaco-editor/esm/vs/editor/editor.api";
import { useCallback, useEffect, useRef } from "react";
import { schemaCacheAtom } from "@/atoms/schemaCache";
import { generateElasticsearchQuerySchema } from "@/lib/elasticsearch";
import type { ElasticsearchIndexMapping } from "@/types/elasticsearch";

export interface ModelInfo {
  model: MonacoAPI.editor.ITextModel;
  uri: string;
}

export const useMonacoModels = (monaco: Monaco | null) => {
  const modelsRef = useRef<Map<string, MonacoAPI.editor.ITextModel>>(new Map());
  const [schemaCache, setSchemaCache] = useAtom(schemaCacheAtom);
  const schemasRegisteredRef = useRef(false);

  // Generate or retrieve cached schema
  const getOrCreateSchema = useCallback(
    (indexName: string, mapping: ElasticsearchIndexMapping) => {
      if (schemaCache[indexName]) {
        return schemaCache[indexName].schema;
      }

      const schema = generateElasticsearchQuerySchema(mapping);
      setSchemaCache((prev) => ({
        ...prev,
        [indexName]: { schema, mapping, timestamp: Date.now() },
      }));

      return schema;
    },
    [schemaCache, setSchemaCache],
  );

  // Update Monaco's global schema configuration
  const updateMonacoSchemas = useCallback(() => {
    if (!monaco) return;

    const schemas = Object.entries(schemaCache).map(([indexName, { schema }]) => ({
      uri: `http://eska/schema-${indexName}.json`,
      fileMatch: [`**/tabs/*-${indexName}.json`],
      schema,
    }));

    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: true,
      trailingCommas: "ignore",
      schemas,
    });

    schemasRegisteredRef.current = true;
  }, [monaco, schemaCache]);

  // Update schemas whenever cache changes
  useEffect(() => {
    if (monaco && Object.keys(schemaCache).length > 0) {
      updateMonacoSchemas();
    }
  }, [monaco, schemaCache, updateMonacoSchemas]);

  // Create or update a model for a specific tab
  const getOrCreateModel = useCallback(
    (tabId: string, indexName: string, value: string, mapping: ElasticsearchIndexMapping): ModelInfo | null => {
      if (!monaco) return null;

      const modelKey = `${tabId}-${indexName}`;
      const uri = monaco.Uri.parse(`file:///tabs/${tabId}-${indexName}.json`);

      let model = modelsRef.current.get(modelKey);

      if (!model) {
        // Ensure schema is cached before creating model
        getOrCreateSchema(indexName, mapping);

        // Create new model
        model = monaco.editor.createModel(value, "json", uri);
        modelsRef.current.set(modelKey, model);
      } else {
        // Update existing model if value changed
        if (model.getValue() !== value) {
          model.setValue(value);
        }
      }

      return { model, uri: uri.toString() };
    },
    [monaco, getOrCreateSchema],
  );

  // Dispose a model when tab is closed or index changes
  const disposeModel = useCallback((tabId: string, indexName: string) => {
    const modelKey = `${tabId}-${indexName}`;
    const model = modelsRef.current.get(modelKey);

    if (model) {
      model.dispose();
      modelsRef.current.delete(modelKey);
    }
  }, []);

  // Dispose all models (cleanup on unmount)
  const disposeAllModels = useCallback(() => {
    modelsRef.current.forEach((model) => {
      model.dispose();
    });
    modelsRef.current.clear();
  }, []);

  return {
    getOrCreateModel,
    disposeModel,
    disposeAllModels,
    updateMonacoSchemas,
  };
};
