import { Link } from "react-router-dom";
import "./StatusScreen.css";

interface StatusScreenProps {
  message: string;
  showHomeLink?: boolean;
}

export default function StatusScreen({ message, showHomeLink = false }: StatusScreenProps) {
  return (
    <div className="status-screen">
      <p>{message}</p>
      {showHomeLink && <Link to="/">Back to home</Link>}
    </div>
  );
}
