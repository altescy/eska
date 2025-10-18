import { BrushCleaning, Funnel, ListFilter, X } from "lucide-react";
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { getFieldTypeColor } from "@/lib/elasticsearch";
import type { ElasticsearchField } from "@/types/elasticsearch";

interface FilterCriteria {
  attributes: Set<string>; // @index, @source, @selected
  types: Set<string>; // :text, :keyword, etc.
  negativeAttributes: Set<string>; // -@index, etc.
  negativeTypes: Set<string>; // -:text, etc.
  textQuery: string; // remaining text for name matching
}

/**
 * Parse filter query string into structured criteria
 * Supports:
 * - @index, @source, @selected (attributes)
 * - :type (field types)
 * - - prefix for negation
 * - plain text for field name matching
 */
function parseFilterQuery(query: string): FilterCriteria {
  const tokens = query.trim().split(/\s+/);
  const criteria: FilterCriteria = {
    attributes: new Set(),
    types: new Set(),
    negativeAttributes: new Set(),
    negativeTypes: new Set(),
    textQuery: "",
  };

  const textParts: string[] = [];

  for (const token of tokens) {
    if (token.startsWith("-@")) {
      // Negative attribute
      criteria.negativeAttributes.add(token.slice(2));
    } else if (token.startsWith("@")) {
      // Positive attribute
      criteria.attributes.add(token.slice(1));
    } else if (token.startsWith("-:")) {
      // Negative type
      criteria.negativeTypes.add(token.slice(2));
    } else if (token.startsWith(":")) {
      // Positive type
      criteria.types.add(token.slice(1));
    } else {
      // Plain text
      textParts.push(token);
    }
  }

  criteria.textQuery = textParts.join(" ").toLowerCase();
  return criteria;
}

/**
 * Check if a field matches the filter criteria
 */
function matchesFilter(
  name: string,
  field: ElasticsearchField,
  isSelected: boolean,
  criteria: FilterCriteria,
): boolean {
  // Check negative attributes first (exclusions)
  if (criteria.negativeAttributes.has("index") && field.index) return false;
  if (criteria.negativeAttributes.has("source") && field.source) return false;
  if (criteria.negativeAttributes.has("selected") && isSelected) return false;

  // Check negative types (exclusions)
  if (criteria.negativeTypes.has(field.type.toLowerCase())) return false;

  // Check positive attributes
  if (criteria.attributes.size > 0) {
    let matchesAny = false;
    if (criteria.attributes.has("index") && field.index) matchesAny = true;
    if (criteria.attributes.has("source") && field.source) matchesAny = true;
    if (criteria.attributes.has("selected") && isSelected) matchesAny = true;
    if (!matchesAny) return false;
  }

  // Check positive types (OR logic)
  if (criteria.types.size > 0) {
    if (!criteria.types.has(field.type.toLowerCase())) return false;
  }

  // Check text query (field name matching)
  if (criteria.textQuery && !name.toLowerCase().includes(criteria.textQuery)) {
    return false;
  }

  return true;
}

interface FieldTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  name: string;
  field: ElasticsearchField;
  selected?: boolean;
  disabled?: boolean;
  onSelectionChange?: (selected: boolean) => void;
}

const FieldTableRow = React.memo(
  ({ name, field, selected = false, disabled = false, onClick, onSelectionChange, ...props }: FieldTableRowProps) => {
    const handleCheckboxChange = React.useCallback(
      (checked: boolean) => {
        if (!disabled) {
          onSelectionChange?.(checked);
        }
      },
      [disabled, onSelectionChange],
    );

    const handleRowClick = React.useCallback(
      (event: React.MouseEvent<HTMLTableRowElement>) => {
        if (!disabled && field.source) {
          onSelectionChange?.(!selected);
        }
        onClick?.(event);
      },
      [disabled, onClick, field.source, selected, onSelectionChange],
    );

    return (
      <tr {...props} onClick={handleRowClick}>
        <td className="p-1 border-b border-b-gray-700/10">
          {field.source && (
            <Checkbox
              className="block m-auto border-gray-700/20"
              checked={selected}
              onCheckedChange={handleCheckboxChange}
              disabled={disabled}
            />
          )}
        </td>
        <td className="pl-2 border-b border-b-gray-700/10">
          {field.index && <Funnel className="block text-muted-foreground" size={14} />}
        </td>
        <td className="pl-2 border-b border-b-gray-700/10">
          <span className={`${getFieldTypeColor(field.type)} text-gray-700 rounded px-1 py-0.5 font-mono text-xs whitespace-nowrap`}>
            {field.type}
          </span>
        </td>
        <td className="pl-2 border-b border-b-gray-700/10">
          <span className="font-mono text-xs whitespace-nowrap">{name}</span>
        </td>
      </tr>
    );
  },
);

export interface FieldTableProps extends React.HTMLAttributes<HTMLTableElement> {
  fields: Record<string, ElasticsearchField>;
  selectedFields?: string[];
  disabled?: boolean;
  onSelectionChange?: (fields: string[]) => void;
}

export interface FieldTableHandler {
  getSelectedFields: () => string[];
  clearSelection: () => void;
}

export const FieldTable = React.forwardRef<FieldTableHandler, FieldTableProps>(
  ({ fields, selectedFields: externalSelectedFields, disabled = false, onSelectionChange, ...props }, ref) => {
    const [selectedFields, setSelectedFields] = React.useState<string[]>(externalSelectedFields ?? []);

    React.useImperativeHandle(
      ref,
      () => ({
        getSelectedFields: () => selectedFields,
        clearSelection: () => setSelectedFields([]),
      }),
      [selectedFields],
    );

    const handleFieldSelectionChange = React.useCallback((field: string, selected: boolean) => {
      setSelectedFields((prev) => {
        return selected ? [...prev, field] : prev.filter((f) => f !== field);
      });
    }, []);

    // biome-ignore lint/correctness/useExhaustiveDependencies: onSelectionChange is intentionally excluded to prevent infinite loops
    React.useEffect(() => {
      onSelectionChange?.(selectedFields);
    }, [selectedFields]);

    return (
      <table {...props}>
        <tbody>
          {Object.entries(fields).map(([name, field]) => (
            <FieldTableRow
              key={name}
              name={name}
              field={field}
              selected={selectedFields.includes(name)}
              disabled={disabled}
              onSelectionChange={(selected) => handleFieldSelectionChange(name, selected)}
              className="h-8 m-auto"
            />
          ))}
        </tbody>
      </table>
    );
  },
);

export interface FieldsProps extends React.HTMLAttributes<HTMLDivElement> {
  fields: Record<string, ElasticsearchField>;
  disabled?: boolean;
  onSelectionChange?: (fields: string[]) => void;
}

export const Fields = ({ fields, disabled = false, onSelectionChange, ...props }: FieldsProps) => {
  const [query, setQuery] = React.useState("");
  const [selectedFields, setSelectedFields] = React.useState<string[]>([]);
  const tableRef = React.useRef<FieldTableHandler>(null);
  const selectedFieldCount = React.useMemo(() => selectedFields.length, [selectedFields]);

  const filteredFields = React.useMemo(() => {
    if (query.trim() === "") {
      return fields;
    }

    const criteria = parseFilterQuery(query);
    const result: Record<string, ElasticsearchField> = {};

    for (const [name, field] of Object.entries(fields)) {
      const isSelected = selectedFields.includes(name);
      if (matchesFilter(name, field, isSelected, criteria)) {
        result[name] = field;
      }
    }

    return result;
  }, [fields, query, selectedFields]);
  const handleSelectionChange = React.useCallback(
    (selectedFields: string[]) => {
      setSelectedFields(selectedFields);
      onSelectionChange?.(selectedFields);
    },
    [onSelectionChange],
  );
  return (
    <div {...props}>
      <div className="w-full h-full flex flex-col">
        <div className="shrink-0 p-2 border-b border-b-gray-700/10">
          <InputGroup className="border-none outline-none bg-white/15 rounded-md">
            <InputGroupAddon className="w-10 h-10">
              {selectedFieldCount > 0 ? (
                <InputGroupText className="bg-gray-400/10 rounded-md text-xs w-full h-full flex items-center justify-center">
                  {selectedFieldCount}
                </InputGroupText>
              ) : (
                <ListFilter className="text-muted-foreground" />
              )}
            </InputGroupAddon>
            <InputGroupInput
              type="text"
              placeholder="Filter fields..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full"
            />
            {query && (
              <InputGroupButton
                onClick={() => setQuery("")}
                disabled={query.trim() === ""}
                className="hover:bg-white/20 "
              >
                <X />
              </InputGroupButton>
            )}
            {selectedFieldCount > 0 && (
              <>

                <InputGroupButton
                  onClick={() => tableRef.current?.clearSelection()}
                  disabled={disabled}
                  className="hover:bg-gray-300/40 mr-1 text-gray-600"
                >
                  <BrushCleaning />
                </InputGroupButton>
              </>
            )}
          </InputGroup>
        </div>
        <div className="flex-1 w-full overflow-auto">
          <FieldTable
            ref={tableRef}
            fields={filteredFields}
            selectedFields={selectedFields}
            disabled={disabled}
            onSelectionChange={handleSelectionChange}
            className="w-full text-gray-700"
          />
        </div>
      </div>
    </div>
  );
};
