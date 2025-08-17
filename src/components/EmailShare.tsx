
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Send, Mail, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { marked } from "marked";

interface EmailShareProps {
  summary: string;
}

export const EmailShare: React.FC<EmailShareProps> = ({ summary }) => {
  const [recipients, setRecipients] = useState<string[]>(['']);
  const [subject, setSubject] = useState('AI Generated Summary');
  const [message, setMessage] = useState('Please find the AI-generated summary attached below:\n\n');
  const [isSending, setIsSending] = useState(false);
  
  const htmlContent = `<pre>${marked.parse(summary)}</pre>`;


  const addRecipient = () => {
    setRecipients([...recipients, '']);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const updateRecipient = (index: number, value: string) => {
    const updated = [...recipients];
    updated[index] = value;
    setRecipients(updated);
  };

  const handleSend = async () => {
  const validRecipients = recipients.filter(email => 
    email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  );

  if (validRecipients.length === 0) {
    toast.error('Please enter at least one valid email address');
    return;
  }

  setIsSending(true);

  try {
   
    const response = await fetch("http://localhost:5000/send-mail", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    to: validRecipients,    
    subject,
    text: message,
    html: htmlContent
  }),
    });

    if (!response.ok) throw new Error("Failed to send email");

    toast.success(`Summary sent to ${validRecipients.length} recipient(s)!`);
  } catch (error) {
    toast.error("Error sending email");
    console.error(error);
  } finally {
    setIsSending(false);
  }
};



  return (
    <div className="space-y-6">
      {/* Recipients */}
      <div className="space-y-3">
        <Label htmlFor="recipients">Recipients</Label>
        {recipients.map((recipient, index) => (
          <div key={index} className="flex space-x-2">
            <Input
              type="email"
              placeholder="Enter email address"
              value={recipient}
              onChange={(e) => updateRecipient(index, e.target.value)}
              className="flex-1"
            />
            {recipients.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeRecipient(index)}
                className="px-3"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        
        <Button
          variant="outline"
          size="sm"
          onClick={addRecipient}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Recipient
        </Button>
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject"
        />
      </div>

      {/* Message */}
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Optional message to include with the summary"
          className="min-h-[100px]"
        />
      </div>

      {/* Preview */}
      <div className="p-4 bg-muted rounded-lg">
        <div className="text-sm font-medium mb-2 flex items-center space-x-2">
          <Mail className="w-4 h-4" />
          <span>Email Preview</span>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>To:</strong> {recipients.filter(r => r.trim()).join(', ') || 'No recipients'}</p>
          <p><strong>Subject:</strong> {subject}</p>
          <p><strong>Content:</strong> Message + AI Summary ({summary.length} chars)</p>
        </div>
      </div>

      {/* Send Button */}
      <Button
        onClick={handleSend}
        disabled={isSending || !recipients.some(r => r.trim())}
        className="w-full gradient-button"
      >
        {isSending ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Sending Email...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Send Summary
          </>
        )}
      </Button>
    </div>
  );
};
