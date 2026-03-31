import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiService from "@/services/apiService";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

interface UniversalSearchResult {
  id: string;
  type: 'shortcut' | 'message' | 'user' | 'group' | 'event' | 'job' | 'post';
  title: string;
  subtitle?: string;
  route: string;
}

const typeLabel: Record<UniversalSearchResult['type'], string> = {
  shortcut: 'Page',
  message: 'DM',
  user: 'Person',
  group: 'Group',
  event: 'Event',
  job: 'Job',
  post: 'Post',
};

export function GlobalSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UniversalSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const timeout = setTimeout(() => {
      void searchEverywhere(query);
    }, 250);

    return () => clearTimeout(timeout);
  }, [query, isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.search]);

  const searchEverywhere = async (nextQuery: string) => {
    const trimmed = nextQuery.trim();
    if (!trimmed) {
      const shortcutResponse = await apiService.universalSearch('', 8);
      if (shortcutResponse.success) {
        setResults((shortcutResponse.data || []) as UniversalSearchResult[]);
      }
      return;
    }

    setIsLoading(true);
    const response = await apiService.universalSearch(trimmed, 8);
    if (response.success) {
      setResults((response.data || []) as UniversalSearchResult[]);
    } else {
      setResults([]);
    }
    setIsLoading(false);
  };

  const openResult = (result: UniversalSearchResult) => {
    setIsOpen(false);
    navigate(result.route);
  };

  const submitSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) {
      navigate('/directory');
      setIsOpen(false);
      return;
    }

    if (results.length > 0) {
      openResult(results[0]);
      return;
    }

    navigate(`/directory?search=${encodeURIComponent(trimmed)}`);
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (!query.trim() && results.length === 0) {
      void searchEverywhere('');
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full max-w-md">
          <button
            type="button"
            aria-label="Search across app"
            onClick={submitSearch}
            className="absolute inset-y-0 left-0 z-10 flex items-center pl-3 text-muted-foreground hover:text-foreground"
          >
            <Search className="h-5 w-5" />
          </button>
          <Input
            placeholder="Search people, messages, events, posts, settings..."
            value={query}
            onFocus={handleInputFocus}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-10"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submitSearch();
              }
              if (event.key === 'Escape') {
                setIsOpen(false);
              }
            }}
          />
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList>
            {isLoading ? (
              <div className="py-4 text-sm text-muted-foreground text-center">Searching...</div>
            ) : (
              <>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Search Results">
                  {results.map((result) => (
                    <CommandItem
                      key={result.id}
                      value={`${result.title} ${result.subtitle || ''} ${result.type}`}
                      onSelect={() => openResult(result)}
                      className="items-start gap-3"
                    >
                      <span className="mt-0.5 inline-flex rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {typeLabel[result.type]}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default GlobalSearch;