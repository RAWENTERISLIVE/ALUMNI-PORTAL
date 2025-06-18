
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  CommandDialog, 
  CommandInput, 
  CommandList, 
  CommandEmpty, 
  CommandGroup, 
  CommandItem 
} from "@/components/ui/command";
import { Link, useNavigate } from "react-router-dom";
import { 
  Search, 
  User, 
  Users, 
  Briefcase, 
  GraduationCap, 
  MessageSquare,
  X,
  LayoutGrid
} from "lucide-react";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search results based on query from backend APIs
  const getSearchResults = () => {
    if (!searchQuery.trim()) return {
      alumni: [],
      groups: [],
      jobs: [],
      posts: []
    };

    // TODO: Replace with actual API calls when search backend is implemented
    // const searchResponse = await apiService.searchAll(searchQuery);
    
    return {
      alumni: [],
      groups: [],
      jobs: [],
      posts: []
    };
  };

  const handleNavigateToProfile = (alumniId: number) => {
    navigate(`/directory/profile/${alumniId}`);
    setOpen(false);
  };

  const handleNavigateToGroup = (groupId: number) => {
    navigate(`/groups/${groupId}`);
    setOpen(false);
  };

  const handleNavigateToJob = (jobId: number) => {
    navigate(`/jobs`);
    // We can add logic to open that specific job automatically
    sessionStorage.setItem('openJobId', jobId.toString());
    setOpen(false);
  };

  const handleNavigateToPost = (postId: number) => {
    navigate(`/posts/${postId}`);
    setOpen(false);
  };

  const results = getSearchResults();
  const hasResults = Object.values(results).some(arr => arr.length > 0);

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 sm:w-64 sm:justify-start sm:px-3 sm:py-2 md:w-80"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline-flex">Search AlumniConnect...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <CommandInput 
            placeholder="Search alumni, groups, jobs..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
            ref={inputRef}
            autoFocus
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 rounded-md"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          {results.alumni.length > 0 && (
            <CommandGroup heading="Alumni">
              {results.alumni.map(person => (
                <CommandItem key={person.id} onSelect={() => handleNavigateToProfile(person.id)}>
                  <User className="mr-2 h-4 w-4" />
                  <div className="flex justify-between w-full">
                    <span>{person.name}</span>
                    <span className="text-muted-foreground text-sm">{person.role}</span>
                  </div>
                </CommandItem>
              ))}
              {results.alumni.length > 0 && (
                <CommandItem onSelect={() => {
                  navigate('/directory');
                  setOpen(false);
                }} className="text-blue-600 italic">
                  <Users className="mr-2 h-4 w-4" />
                  View all matching alumni...
                </CommandItem>
              )}
            </CommandGroup>
          )}
          
          {results.groups.length > 0 && (
            <CommandGroup heading="Groups">
              {results.groups.map(group => (
                <CommandItem key={group.id} onSelect={() => handleNavigateToGroup(group.id)}>
                  <Users className="mr-2 h-4 w-4" />
                  <div className="flex justify-between w-full">
                    <span>{group.name}</span>
                    <span className="text-muted-foreground text-sm">{group.members} members</span>
                  </div>
                </CommandItem>
              ))}
              {results.groups.length > 0 && (
                <CommandItem onSelect={() => {
                  navigate('/groups');
                  setOpen(false);
                }} className="text-blue-600 italic">
                  <Users className="mr-2 h-4 w-4" />
                  View all matching groups...
                </CommandItem>
              )}
            </CommandGroup>
          )}
          
          {results.jobs.length > 0 && (
            <CommandGroup heading="Jobs">
              {results.jobs.map(job => (
                <CommandItem key={job.id} onSelect={() => handleNavigateToJob(job.id)}>
                  <Briefcase className="mr-2 h-4 w-4" />
                  <div className="flex justify-between w-full">
                    <span>{job.title}</span>
                    <span className="text-muted-foreground text-sm">{job.company}</span>
                  </div>
                </CommandItem>
              ))}
              {results.jobs.length > 0 && (
                <CommandItem onSelect={() => {
                  navigate('/jobs');
                  setOpen(false);
                }} className="text-blue-600 italic">
                  <Briefcase className="mr-2 h-4 w-4" />
                  View all matching jobs...
                </CommandItem>
              )}
            </CommandGroup>
          )}
          
          {results.posts.length > 0 && (
            <CommandGroup heading="Posts">
              {results.posts.map(post => (
                <CommandItem key={post.id} onSelect={() => handleNavigateToPost(post.id)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <div className="flex justify-between w-full">
                    <span className="truncate max-w-[300px]">{post.content}</span>
                    <span className="text-muted-foreground text-sm whitespace-nowrap ml-2">{post.author}</span>
                  </div>
                </CommandItem>
              ))}
              {results.posts.length > 0 && (
                <CommandItem onSelect={() => {
                  navigate('/posts');
                  setOpen(false);
                }} className="text-blue-600 italic">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  View all matching posts...
                </CommandItem>
              )}
            </CommandGroup>
          )}
          
          {!hasResults && searchQuery && (
            <div className="py-6 text-center text-sm">
              <LayoutGrid className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
            </div>
          )}
          
          {!searchQuery && (
            <div className="py-4 px-2">
              <p className="text-sm text-muted-foreground mb-2">Try searching for:</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setSearchQuery("product manager")}>
                  product manager
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSearchQuery("tech alumni")}>
                  tech alumni
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSearchQuery("new york")}>
                  new york
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSearchQuery("mentorship")}>
                  mentorship
                </Button>
              </div>
            </div>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
