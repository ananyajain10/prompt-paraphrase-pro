
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Lightbulb } from 'lucide-react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
}

const PROMPT_SUGGESTIONS = [
  "Summarize in bullet points for executives",
  "Extract key action items and deadlines",
  "Create a 100-word executive summary",
  "Highlight decisions made and next steps",
  "Identify risks and opportunities mentioned",
  "Generate meeting minutes format"
];

export const PromptInput: React.FC<PromptInputProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-4">
      <Textarea
        placeholder="Enter your custom summarization instructions..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[120px] resize-none"
      />
      
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
          <Lightbulb className="w-4 h-4" />
          <span>Quick prompts:</span>
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          {PROMPT_SUGGESTIONS.map((suggestion, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className="justify-start h-auto p-3 text-left text-sm hover:bg-muted/50"
              onClick={() => onChange(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
