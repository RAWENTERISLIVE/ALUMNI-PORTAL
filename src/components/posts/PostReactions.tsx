import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Heart,
  ThumbsUp,
  LightbulbIcon,
  Laugh,
  PartyPopper as HandsClapping,
  HandMetal
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import apiService from '@/services/apiService';

const REACTIONS = {
  LIKE: 'like',
  CELEBRATE: 'celebrate',
  SUPPORT: 'support',
  FUNNY: 'funny',
  LOVE: 'love',
  INSIGHTFUL: 'insightful'
};

type ReactionType = 'like' | 'love' | 'celebrate' | 'support' | 'insightful' | 'funny';

interface PostReactionsProps {
  postId: string;
  userReaction: ReactionType | null;
  reactionsCount: {
    [key: string]: number;
  };
  onReactionUpdated: (reactionType: ReactionType | null, reactionData?: any) => void;
}

export function PostReactions({ postId, userReaction, reactionsCount, onReactionUpdated }: PostReactionsProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const totalReactions = Object.values(reactionsCount).reduce((sum, count) => sum + count, 0);

  const handleReaction = async (reactionType: ReactionType | null) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      let response;
      
      // If the user is clicking the same reaction again, remove it
      if (userReaction === reactionType) {
        response = await apiService.removePostReaction(postId);
        if (response.success) {
          onReactionUpdated(null, response.data);
          toast({
            title: 'Reaction removed',
            description: `Your reaction has been removed`,
          });
        }
      } else {
        // Add or update reaction
        response = await apiService.reactToPost(postId, reactionType || 'like');
        if (response.success) {
          onReactionUpdated(reactionType, response.data);
          toast({
            title: 'Reaction added',
            description: `You ${reactionType}d this post`,
          });
        }
      }
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update reaction');
      }
      
      setOpen(false);
    } catch (error: any) {
      console.error('Reaction error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update reaction',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getReactionIcon = (reactionType: ReactionType | null) => {
    switch(reactionType) {
      case REACTIONS.LIKE:
        return <ThumbsUp className={`h-4 w-4 ${userReaction === REACTIONS.LIKE ? 'text-blue-500 fill-blue-500' : ''}`} />;
      case REACTIONS.LOVE:
        return <Heart className={`h-4 w-4 ${userReaction === REACTIONS.LOVE ? 'text-red-500 fill-red-500' : ''}`} />;
      case REACTIONS.CELEBRATE:
        return <HandsClapping className={`h-4 w-4 ${userReaction === REACTIONS.CELEBRATE ? 'text-yellow-500 fill-yellow-500' : ''}`} />;
      case REACTIONS.SUPPORT:
        return <HandMetal className={`h-4 w-4 ${userReaction === REACTIONS.SUPPORT ? 'text-purple-500 fill-purple-500' : ''}`} />;
      case REACTIONS.FUNNY:
        return <Laugh className={`h-4 w-4 ${userReaction === REACTIONS.FUNNY ? 'text-green-500 fill-green-500' : ''}`} />;
      case REACTIONS.INSIGHTFUL:
        return <LightbulbIcon className={`h-4 w-4 ${userReaction === REACTIONS.INSIGHTFUL ? 'text-orange-500 fill-orange-500' : ''}`} />;
      default:
        return <ThumbsUp className="h-4 w-4" />;
    }
  };
  
  // Get top 2 reactions for the reaction summary display
  const getTopReactions = () => {
    return Object.entries(reactionsCount)
      .filter(([_, count]) => count > 0)
      .sort(([_, countA], [__, countB]) => countB - countA)
      .slice(0, 2)
      .map(([type]) => type);
  };
  
  const topReactions = getTopReactions();

  // Get reaction color
  const getReactionColor = (type: string) => {
    switch(type) {
      case REACTIONS.LIKE: return 'text-blue-500 bg-blue-50';
      case REACTIONS.LOVE: return 'text-red-500 bg-red-50';
      case REACTIONS.CELEBRATE: return 'text-yellow-500 bg-yellow-50';
      case REACTIONS.SUPPORT: return 'text-purple-500 bg-purple-50';
      case REACTIONS.FUNNY: return 'text-green-500 bg-green-50';
      case REACTIONS.INSIGHTFUL: return 'text-orange-500 bg-orange-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center gap-2 transition-colors duration-200 hover:bg-gray-100 ${
              userReaction ? getReactionColor(userReaction) : ''
            }`}
            disabled={isSubmitting}
          >
            {getReactionIcon(userReaction)}
            <span className={userReaction ? 'font-medium' : 'text-gray-600'}>
              {userReaction ? userReaction.charAt(0).toUpperCase() + userReaction.slice(1) : 'Like'}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-1 w-auto rounded-full border shadow-lg" align="start" side="top">
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 hover:bg-blue-50 rounded-full"
                    onClick={() => handleReaction(REACTIONS.LIKE as ReactionType)}
                  >
                    <ThumbsUp className="h-6 w-6 text-blue-500 hover:scale-125 transition-transform" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Like</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 hover:bg-red-50 rounded-full"
                    onClick={() => handleReaction(REACTIONS.LOVE as ReactionType)}
                  >
                    <Heart className="h-6 w-6 text-red-500 hover:scale-125 transition-transform" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Love</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 hover:bg-yellow-50 rounded-full"
                    onClick={() => handleReaction(REACTIONS.CELEBRATE as ReactionType)}
                  >
                    <HandsClapping className="h-6 w-6 text-yellow-500 hover:scale-125 transition-transform" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Celebrate</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm" 
                    className="p-2 hover:bg-purple-50 rounded-full"
                    onClick={() => handleReaction(REACTIONS.SUPPORT as ReactionType)}
                  >
                    <HandMetal className="h-6 w-6 text-purple-500 hover:scale-125 transition-transform" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Support</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 hover:bg-green-50 rounded-full"
                    onClick={() => handleReaction(REACTIONS.FUNNY as ReactionType)}
                  >
                    <Laugh className="h-6 w-6 text-green-500 hover:scale-125 transition-transform" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Funny</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 hover:bg-orange-50 rounded-full"
                    onClick={() => handleReaction(REACTIONS.INSIGHTFUL as ReactionType)}
                  >
                    <LightbulbIcon className="h-6 w-6 text-orange-500 hover:scale-125 transition-transform" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Insightful</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </PopoverContent>
      </Popover>
      
      {totalReactions > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center space-x-1">
                <div className="flex -space-x-1">
                  {topReactions.map((type, i) => (
                    <div 
                      key={type}
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${getReactionColor(type)} border border-white z-${10 - i}`}
                    >
                      {getReactionIcon(type as ReactionType)}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  {totalReactions}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {Object.entries(reactionsCount)
                .filter(([_, count]) => count > 0)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center space-x-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${getReactionColor(type)}`}>
                      {getReactionIcon(type as ReactionType)}
                    </div>
                    <span>{count}</span>
                  </div>
                ))}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
