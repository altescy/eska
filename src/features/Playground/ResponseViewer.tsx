import { Editor } from "@/components/Editor";

export interface ResponseViewerProps {
  response: string;
}

export const ResponseViewer = ({ response }: ResponseViewerProps) => {
  return <Editor language="json" value={response} readOnly lineNumbers="off" />;
};
