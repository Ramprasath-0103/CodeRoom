import { useParams } from "react-router-dom";
import CodeEditor from "../components/CodeEditor";

function Workspace() {
  const { workspaceId } = useParams();

  return (
    <div>
      <h1>Workspace : {workspaceId}</h1>
      <CodeEditor />
    </div>
  );
}

export default Workspace;
