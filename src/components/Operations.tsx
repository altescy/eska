import { FileText, Search } from "lucide-react";
import type { ElasticsearchOperation } from "@/types/elasticsearch";

export interface OperationIconProps extends React.HTMLAttributes<SVGSVGElement> {
  operation: ElasticsearchOperation;
}

export const OperationIcon = ({ operation, ...props }: OperationIconProps) => {
  if (operation === "search") {
    return <Search {...props} />;
  }
  if (operation === "get") {
    return <FileText {...props} />;
  }
  return null;
};
