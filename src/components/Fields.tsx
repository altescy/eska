import { Funnel, ListFilter, X } from "lucide-react";
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import type { ElasticsearchField } from "@/types/elasticsearch";

interface FieldTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  name: string;
  field: ElasticsearchField;
  disabled?: boolean;
  onSelectionChange?: (selected: boolean) => void;
}

const FieldTableRow = React.memo(
  ({ name, field, disabled = false, onClick, onSelectionChange, ...props }: FieldTableRowProps) => {
    const [selected, setSelected] = React.useState(false);

    const handleCheckboxChange = React.useCallback(
      (checked: boolean) => {
        if (!disabled) {
          setSelected(checked);
        }
      },
      [disabled],
    );

    const handleRowClick = React.useCallback(
      (event: React.MouseEvent<HTMLTableRowElement>) => {
        if (!disabled && field.source) {
          setSelected((prev) => !prev);
        }
        onClick?.(event);
      },
      [disabled, onClick, field.source],
    );

    // biome-ignore lint/correctness/useExhaustiveDependencies: onSelectionChange is intentionally excluded to prevent infinite loops
    React.useEffect(() => {
      onSelectionChange?.(selected);
    }, [selected]);

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
          <span className="bg-red-300 rounded px-1 py-0.5 font-mono text-xs whitespace-nowrap">{field.type}</span>
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
  disabled?: boolean;
  onSelectionChange?: (fields: string[]) => void;
}

export const FieldTable = ({ fields, disabled = false, onSelectionChange, ...props }: FieldTableProps) => {
  const [selectedFields, setSelectedFields] = React.useState<string[]>([]);

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
            disabled={disabled}
            onSelectionChange={(selected) => handleFieldSelectionChange(name, selected)}
            className="h-8 m-auto"
          />
        ))}
      </tbody>
    </table>
  );
};

export interface FieldsProps extends React.HTMLAttributes<HTMLDivElement> {
  fields: Record<string, ElasticsearchField>;
  disabled?: boolean;
  onSelectionChange?: (fields: string[]) => void;
}

export const Fields = ({ fields, disabled = false, onSelectionChange, ...props }: FieldsProps) => {
  const [query, setQuery] = React.useState("");
  const filteredFields = React.useMemo(() => {
    if (query.trim() === "") {
      return fields;
    }
    const lowerQuery = query.toLowerCase();
    const result: Record<string, ElasticsearchField> = {};
    for (const [name, field] of Object.entries(fields)) {
      if (name.toLowerCase().includes(lowerQuery) || field.type.toLowerCase().includes(lowerQuery)) {
        result[name] = field;
      }
    }
    return result;
  }, [fields, query]);
  return (
    <div {...props}>
      <div className="w-full h-full flex flex-col">
        <div className="shrink-0 p-2 border-b border-b-gray-700/10">
          <InputGroup className="border-none outline-none bg-white/15 rounded-md">
            <InputGroupAddon>
              <ListFilter className="text-muted-foreground" />
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
                className="hover:bg-white/20 mr-2"
              >
                <X />
              </InputGroupButton>
            )}
          </InputGroup>
        </div>
        <div className="flex-1 w-full overflow-auto">
          <FieldTable
            fields={filteredFields}
            disabled={disabled}
            onSelectionChange={onSelectionChange}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};
