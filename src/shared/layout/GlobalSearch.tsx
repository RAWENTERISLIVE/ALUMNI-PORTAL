import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function GlobalSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");

  const submitSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) {
      navigate('/directory');
      return;
    }
    navigate(`/directory?search=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="relative w-full max-w-md">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3">
        <Search className="h-5 w-5 text-muted-foreground" />
      </span>
      <Input
        placeholder="Search alumni..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            submitSearch();
          }
        }}
        onFocus={() => {
          if (location.pathname !== '/directory' && query.trim().length > 0) {
            navigate(`/directory?search=${encodeURIComponent(query.trim())}`);
          }
        }}
      />
    </div>
  );
}
export default GlobalSearch;