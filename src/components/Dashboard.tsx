import React, { useState } from "react";
import {
  Upload,
  FileText,
  Wand2,
  Send,
  Download,
  Type,
  Image,
  File as FileIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "./FileUpload";
import { PromptInput } from "./PromptInput";
import { SummaryEditor } from "./SummaryEditor";
import { EmailShare } from "./EmailShare";
import { toast } from "sonner";
import { analyzePitchDeckWithGemini } from "@/lib/geminiClient";

// ---------------------- File Processing Utilities ----------------------
class FileProcessor {
  static async extractTextFromDoc(file: File): Promise<string> {
    const mammoth = await import("mammoth");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  static async extractTextFromImage(file: File): Promise<string> {
    const Tesseract = await import("tesseract.js");
    const {
      data: { text },
    } = await Tesseract.recognize(file, "eng");
    return text;
  }

  static async processFile(file: File): Promise<string> {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    if (fileType === "application/pdf") {
      const formData = new FormData();
      formData.append("file", file);
      const BASE_URL = import.meta.env.VITE_API_URL;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/extract-pdf-text`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to extract text from PDF");
      return data.text;
    } else if (fileType.includes("image/")) {
      return await this.extractTextFromImage(file);
    } else if (
      fileType.includes("document") ||
      fileType.includes("msword") ||
      fileName.endsWith(".docx") ||
      fileName.endsWith(".doc")
    ) {
      return await this.extractTextFromDoc(file);
    } else if (fileType === "text/plain" || fileName.endsWith(".txt")) {
      return await file.text();
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  static getSupportedFileTypes(): string[] {
    return [
      "pdf",
      "doc",
      "docx",
      "txt",
      "png",
      "jpg",
      "jpeg",
      "gif",
      "bmp",
      "tiff",
    ];
  }

  static getFileIcon(fileType: string) {
    if (fileType.includes("pdf")) return FileText;
    if (fileType.includes("image")) return Image;
    if (fileType.includes("document") || fileType.includes("msword"))
      return FileIcon;
    return FileIcon;
  }
}

// ---------------------- Main Dashboard ----------------------
export const Dashboard = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState<string>("");
  const [extractedText, setExtractedText] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [inputMethod, setInputMethod] = useState<"file" | "text">("file");

  // File type check
  const isSupportedFileType = (filename: string): boolean => {
    const extension = filename.split(".").pop()?.toLowerCase() || "";
    return FileProcessor.getSupportedFileTypes().includes(extension);
  };

  const handleFileUpload = async (file: File) => {
    try {
      if (!isSupportedFileType(file.name)) {
        toast.error(
          "Unsupported file type. Please upload PDF, DOCX, TXT, or an Image."
        );
        return;
      }

      setUploadedFile(file);
      setCurrentStep(2);
      toast.success(`Successfully uploaded ${file.name}`);
    } catch (error) {
      toast.error("Error uploading file");
      console.error(error);
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    try {
      return await FileProcessor.processFile(file);
    } catch (error) {
      console.error("Error extracting text:", error);
      throw error;
    }
  };

  const generateSummary = async () => {
    if (inputMethod === "file" && !uploadedFile) {
      toast.error("Please upload a file");
      return;
    }
    if (inputMethod === "text" && !textInput.trim()) {
      toast.error("Please enter some text to summarize");
      return;
    }
    if (!customPrompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    try {
      setIsGenerating(true);
      setCurrentStep(3);

      let textToSummarize = "";

      if (inputMethod === "file" && uploadedFile) {
        textToSummarize = await extractTextFromFile(uploadedFile);
        setExtractedText(textToSummarize);

        if (!textToSummarize.trim())
          throw new Error("No text could be extracted from the file");
      } else {
        textToSummarize = textInput.trim();
      }

      const summaryResult = await analyzePitchDeckWithGemini(
        textToSummarize,
        customPrompt
      );
      
      setSummary(summaryResult);

      setIsGenerating(false);
      setCurrentStep(4);
      toast.success("Summary generated successfully!");
    } catch (error: any) {
      setIsGenerating(false);
      toast.error(error.message || "Error generating summary");
      console.error(error);
    }
  };
  const getFileExtension = (filename: string): string => {
    return filename.split(".").pop()?.toLowerCase() || "";
  };

  const exportSummary = () => {
    const blob = new Blob([summary], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "summary.txt";
    link.click();
  };

  const resetWorkflow = () => {
    setUploadedFile(null);
    setTextInput("");
    setExtractedText("");
    setCustomPrompt("");
    setSummary("");
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <h1 className="text-4xl font-bold gradient-text">
            AI Transcript Summarizer
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Upload your transcripts (PDF, DOCX, TXT) or paste text directly,
            customize your summarization prompt, and get AI-powered insights in
            seconds.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-4">
            {[
              {
                num: 1,
                label: "Input",
                icon: inputMethod === "file" ? Upload : Type,
              },
              { num: 2, label: "Prompt", icon: Wand2 },
              { num: 3, label: "Generate", icon: FileText },
              { num: 4, label: "Share", icon: Send },
            ].map(({ num, label, icon: Icon }) => (
              <div key={num} className="flex items-center space-x-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    currentStep >= num
                      ? "bg-primary text-primary-foreground animate-pulse-glow"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-sm font-medium ${
                    currentStep >= num
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Input Method Selection */}
            <Card className="glass-card animate-fade-in">
              <CardHeader>
                <CardTitle>Choose Input Method</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={inputMethod}
                  onValueChange={(value) =>
                    setInputMethod(value as "file" | "text")
                  }
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="file">Upload File</TabsTrigger>
                    <TabsTrigger value="text">Paste Text</TabsTrigger>
                  </TabsList>

                  <TabsContent value="file" className="space-y-4">
                    <FileUpload onFileUpload={handleFileUpload} />
                    {uploadedFile && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">
                          {uploadedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(uploadedFile.size / 1024).toFixed(1)} KB •{" "}
                          {getFileExtension(uploadedFile.name).toUpperCase()}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Supported formats: PDF, DOCX, TXT
                    </p>
                  </TabsContent>

                  <TabsContent value="text" className="space-y-4">
                    <Textarea
                      placeholder="Paste your text here to summarize..."
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      className="min-h-[200px] resize-y"
                    />
                    <p className="text-xs text-muted-foreground">
                      {textInput.length} characters
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Prompt Input */}
            <Card className="glass-card animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wand2 className="w-5 h-5" />
                  <span>Customization Prompt</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PromptInput value={customPrompt} onChange={setCustomPrompt} />
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={generateSummary}
              disabled={
                (inputMethod === "file" && !uploadedFile) ||
                (inputMethod === "text" && !textInput.trim()) ||
                !customPrompt.trim() ||
                isGenerating
              }
              className="w-full gradient-button py-6 text-lg font-semibold"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Generating Summary...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  Generate AI Summary
                </>
              )}
            </Button>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Extracted Text Preview */}
            {extractedText && (
              <Card className="glass-card animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Extracted Text Preview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-40 overflow-y-auto text-sm text-muted-foreground bg-muted p-3 rounded">
                    {extractedText.substring(0, 500)}
                    {extractedText.length > 500 && "..."}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {extractedText.length} characters extracted
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Summary Editor */}
            <Card className="glass-card animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Generated Summary</span>
                  </div>
                  {summary && (
                    <Button variant="outline" size="sm" onClick={exportSummary}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SummaryEditor
                  value={summary}
                  onChange={setSummary}
                  placeholder="Your AI-generated summary will appear here..."
                />
              </CardContent>
            </Card>

            {/* Email Share */}
            {summary && (
              <Card className="glass-card animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Send className="w-5 h-5" />
                    <span>Share Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EmailShare summary={summary} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        
        {currentStep > 1 && (
          <div className="text-center">
            <Button variant="outline" onClick={resetWorkflow} className="mt-6">
              Start New Summary
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
