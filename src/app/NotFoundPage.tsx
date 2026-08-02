import { ArrowLeft, FileQuestion } from "lucide-react";
import { Link } from "react-router";
import { useDocumentTitle } from "../hooks/use-document-title";

export function NotFoundPage() {
  useDocumentTitle("Page not found");
  return (
    <div className="page not-found">
      <FileQuestion aria-hidden="true" />
      <p className="page-header__eyebrow">404</p>
      <h1>Operational page not found</h1>
      <p>The requested route does not exist or the identifier was incomplete.</p>
      <Link className="button button--primary button--md" to="/">
        <ArrowLeft size={17} />
        Return to overview
      </Link>
    </div>
  );
}
