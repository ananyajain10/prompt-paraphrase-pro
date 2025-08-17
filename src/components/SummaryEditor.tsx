
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Copy, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

interface SummaryEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SummaryEditor: React.FC<SummaryEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = "Your summary will appear here..." 
}) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Summary copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy summary');
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[400px] resize-none pr-12"
        />
        
        {value && (
          <div className="absolute top-3 right-3 space-y-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="w-8 h-8 p-0"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {value && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Edit3 className="w-4 h-4" />
          <span>You can edit the summary above before sharing</span>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        {value ? `${value.length} characters` : 'Waiting for AI generation...'}
      </div>
    </div>
  );
};
