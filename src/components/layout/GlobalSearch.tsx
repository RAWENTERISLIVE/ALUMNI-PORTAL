import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function GlobalSearch() {
  return (
    <div className="relative w-full max-w-md">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3">
        <Search className="h-5 w-5 text-muted-foreground" />
      </span>
      <Input placeholder="Search..." />
    </div>
  );
}
export default GlobalSearch;