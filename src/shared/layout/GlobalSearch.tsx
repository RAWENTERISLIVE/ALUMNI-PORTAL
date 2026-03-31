import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

export function GlobalSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (location.pathname === '/directory') {
      setQuery(searchParams.get('search') || '');
    }
  }, [location.pathname, searchParams]);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed && location.pathname !== '/directory') {
      return;
    }

    const timer = setTimeout(() => {
      const nextPath = trimmed ? `/directory?search=${encodeURIComponent(trimmed)}` : '/directory';
      const currentPath = `${location.pathname}${location.search}`;
      if (currentPath !== nextPath) {
        navigate(nextPath, { replace: location.pathname === '/directory' });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, location.pathname, location.search, navigate]);

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
      <button
        type="button"
        aria-label="Search alumni"
        onClick={submitSearch}
        className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground hover:text-foreground"
      >
        <Search className="h-5 w-5" />
      </button>
      <Input
        placeholder="Search alumni..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="pl-10"
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            submitSearch();
          }
        }}
      />
    </div>
  );
}
export default GlobalSearch;