import { useState, useEffect } from "react";
import { Row, Col, Button, Form, Alert, Spinner, Modal } from "react-bootstrap";
import { CheckCircle2, Send, Paperclip, Download, Eye, Upload, Sparkles, Wand2, Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import RFPUpload from "../RFPUpload";
import { openFile, downloadFile } from "../../utils/fileUtils";
import { createPDF } from "../../utils/pdfConfig";
import QuestionsManagement from "./QuestionsManagement";
import ErrorBoundary from "./ErrorBoundary";

const ProposalBuilder: React.FC = () => {  
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [userId, setUserId] = useState<number | null>(null);
  const [creationType, setCreationType] = useState<"upload" | "ai" | "">("");
  const [fileData, setFileData] = useState<{ id: number; filePath: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({    
    title: "",
    description: "",
    category: "",
    aiPrompt: "",
  });
  const [aiMessages, setAiMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am your AI Assistant. How can I help you with your proposal today?",
    },
  ]);
  const [userMessage, setUserMessage] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedRFP, setGeneratedRFP] = useState<{ id: number; title: string; filePath: string } | null>(null);
  const [rfpQuestions, setRfpQuestions] = useState<Array<{
    id: number;
    questionText: string;
    aiSuggestedAnswer: string;
    userEditedAnswer: string;
    section: string | null;
  }>>([]);
  const [rfpSummary, setRfpSummary] = useState<string>("");

  // Get user ID on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserId(parsedUser.id);
    }
  }, []);

  const steps = [
    {
      id: 1,
      title: "Basic Information",
      description: "Enter RFP title, description, and category.",
      completed: currentStep > 1,
    },
    {
      id: 2,
      title: "Upload Document & AI Prompt",
      description: "Upload your document and/or provide AI requirements. Analysis will start automatically.",
      completed: currentStep > 2,
    },
    {
      id: 3,
      title: "Edit Questions & Answers",
      description: "Review, edit, and manage questions with human editing.",
      completed: currentStep > 3,
    },
    {
      id: 4,
      title: "Review & Generate PDF",
      description: "Review final RFP and generate PDF document.",
      completed: false,
    },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFileSelect = async (rfp: any) => {
    setFormData((prev) => ({
      ...prev,
      title: rfp.title || prev.title,
      description: rfp.description || prev.description,
      category: rfp.category || prev.category,
    }));
    setFileData({
      id: rfp.id,
      filePath: rfp.filePath,
    });
    setCreationType("upload");
    
    // Auto-analyze after file selection
    try {
      setLoading(true);
      setMessage("Analyzing document and generating questions...");
      
      // Update RFP with title, description, category
      await api.put(`/rfps/${rfp.id}`, {
        title: formData.title || rfp.title,
        description: formData.description || rfp.description,
        category: formData.category || rfp.category,
        status: "PENDING",
      });
      
      // Analyze with optional AI prompt enhancement
      await api.post(`/rfps/${rfp.id}/analyze`, {
        aiPrompt: formData.aiPrompt || undefined,
      });
      setGeneratedRFP({
        id: rfp.id,
        title: formData.title || rfp.title,
        filePath: rfp.filePath,
      });
      
      // Fetch questions and move to questions editing step
      await fetchRFPQuestions(rfp.id);
      setCurrentStep(3); // Move to "Edit Questions & Answers" step
      setMessage("✅ Analysis complete! Questions extracted and suggestions added. Now edit your questions.");
    } catch (err: any) {
      console.error("Auto-analyze error:", err);
      setError(err.response?.data?.error || "Failed to analyze document");
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.title) {
      setError("Please enter at least a title to save as draft.");
      return;
    }

    setError("");
    setLoading(true);
    setMessage("Saving draft...");

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required.");

      let rfpResponse;

      if (creationType === "upload" && fileData) {
        // Update existing RFP as draft
        rfpResponse = await api.put(`/rfps/${fileData.id}`, {
          title: formData.title,
          description: formData.description || "",
          category: formData.category || "",
          status: "DRAFT",
        });
        setGeneratedRFP({
          id: fileData.id,
          title: formData.title,
          filePath: fileData.filePath,
        });
      } else if (creationType === "ai") {
        // Create new RFP as draft (without generating PDF)
        rfpResponse = await api.post("/rfps/create-draft", {
          title: formData.title,
          description: formData.description || "",
          category: formData.category || "",
          aiPrompt: formData.aiPrompt || "",
        });
        setGeneratedRFP({
          id: rfpResponse.data.rfp.id,
          title: rfpResponse.data.rfp.title,
          filePath: rfpResponse.data.rfp.filePath || "",
        });
      } else {
        // No creation type selected, create minimal draft
        rfpResponse = await api.post("/rfps/create-draft", {
          title: formData.title,
          description: formData.description || "",
          category: formData.category || "",
        });
        setGeneratedRFP({
          id: rfpResponse.data.rfp.id,
          title: rfpResponse.data.rfp.title,
          filePath: rfpResponse.data.rfp.filePath || "",
        });
      }

      setMessage("✅ Draft saved successfully!");
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("Save draft error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Failed to save draft. Please try again.");
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Updated validation: either file or prompt or both
    if (!fileData && !formData.aiPrompt.trim()) {
      setError("Please upload a document and/or provide AI requirements.");
      return;
    }
    if (!formData.title || !formData.description) {
      setError("Please fill in title and description.");
      return;
    }

    setError("");
    setLoading(true);
    setMessage("Processing your RFP...");

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required.");

      let rfpResponse;

      if (fileData) {
        // Upload path: Update existing RFP and analyze
        await api.put(`/rfps/${fileData.id}`, {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          status: "PENDING",
        });
        
        // Analyze (with optional AI prompt enhancement)
        rfpResponse = await api.post(`/rfps/${fileData.id}/analyze`, {
          aiPrompt: formData.aiPrompt || undefined, // Optional enhancement
        });
        setGeneratedRFP({
          id: fileData.id,
          title: formData.title,
          filePath: fileData.filePath,
        });
      } else if (formData.aiPrompt) {
        // AI generation path
        rfpResponse = await api.post("/rfps/generate", {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          prompt: formData.aiPrompt,
        });
        setGeneratedRFP({
          id: rfpResponse.data.rfp.id,
          title: rfpResponse.data.rfp.title,
          filePath: rfpResponse.data.rfp.filePath,
        });
      }

      setMessage("✅ RFP analyzed successfully! Now edit your questions.");
      
      // Set generated RFP and move to questions editing step
      if (rfpResponse?.data?.rfp?.id) {
        setGeneratedRFP({
          id: rfpResponse.data.rfp.id,
          title: formData.title,
          filePath: rfpResponse.data.rfp.filePath || "",
        });
        
        // Wait a moment for questions to be saved to database
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Fetch questions and move to questions editing step
        try {
          await fetchRFPQuestions(rfpResponse.data.rfp.id);
          setCurrentStep(3); // Move to "Edit Questions & Answers" step
        } catch (err) {
          console.error("Failed to fetch questions:", err);
          setError("RFP created but failed to load questions. Please try again.");
        }
      } else {
        setShowSuccessModal(true);
      }
    } catch (err: any) {
      console.error("RFP submit error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Failed to create RFP. Please try again.");
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim() || aiLoading) return;

    const newUserMessage = {
      role: "user" as const,
      content: userMessage,
    };

    setAiMessages((prev) => [...prev, newUserMessage]);
    setUserMessage("");
    setAiLoading(true);

    try {
      // Prepare proposal context
      const proposalContext = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        aiPrompt: formData.aiPrompt,
      };

      // Call AI chat API
      const response = await api.post("/rfps/ai-chat", {
        messages: [
          ...aiMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          newUserMessage,
        ],
        proposalContext,
      });

      const aiResponse = {
        role: "assistant" as const,
        content: response.data.message,
      };

      setAiMessages((prev) => [...prev, aiResponse]);
    } catch (error: any) {
      console.error("AI Chat Error:", error);
      const errorMessage = {
        role: "assistant" as const,
        content: error.response?.data?.error || "Sorry, I encountered an error. Please try again.",
      };
      setAiMessages((prev) => [...prev, errorMessage]);
    } finally {
      setAiLoading(false);
    }
  };

  const generatePreview = () => {
    return {
      title: formData.title || "Your RFP Title",
      category: formData.category || "Not specified",
      description: formData.description || "Description will appear here...",
      introduction: "Introduction will appear here...",
      aiPrompt:
        creationType === "ai"
          ? formData.aiPrompt || "AI requirements will appear here..."
          : null,
      uploadStatus:
        creationType === "upload"
          ? fileData
            ? "Document uploaded and ready for analysis."
            : "No document uploaded."
          : null,
    };
  };

  const preview = generatePreview();  

  const handleFullPreview = async () => {
    if (!preview) {
      setError("No data available for preview.");
      return;
    }
    
    // Fetch questions if we have a generated RFP
    if (generatedRFP?.id) {
      await fetchRFPQuestions(generatedRFP.id);
    }
    
    try {
      const doc = createPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let y = margin;

      // Helper function to clean markdown and HTML from text
      const cleanText = (text: string): string => {
        if (!text) return "";
        let cleaned = text
          // Remove markdown horizontal rules FIRST (before other processing)
          .replace(/^---+$/gm, '')
          .replace(/^===+$/gm, '')
          .replace(/^---+$/gm, '')
          .replace(/---+/g, '') // Remove any remaining horizontal rules
          .replace(/===+/g, '') // Remove any remaining equals rules
          // Remove markdown bold/italic (multiple passes for nested)
          .replace(/\*\*\*([^*]+)\*\*\*/g, '$1') // Bold italic
          .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
          .replace(/\*([^*]+)\*/g, '$1') // Italic
          .replace(/___([^_]+)___/g, '$1') // Bold italic underscore
          .replace(/__([^_]+)__/g, '$1') // Bold underscore
          .replace(/_([^_]+)_/g, '$1') // Italic underscore
          // Remove markdown headers
          .replace(/^#{1,6}\s+/gm, '')
          // Remove markdown links [text](url) -> text
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          // Remove markdown code blocks
          .replace(/```[\s\S]*?```/g, '')
          .replace(/`([^`]+)`/g, '$1')
          // Clean up bullet points - remove markdown formatting from list items
          .replace(/^[\s]*[-*+]\s+\*\*([^*]+)\*\*:\s*/gm, '$1: ') // - **Bold:** -> Bold:
          .replace(/^[\s]*[-*+]\s+\*([^*]+)\*:\s*/gm, '$1: ') // - *Italic:* -> Italic:
          .replace(/^[\s]*[-*+]\s+\*\*([^*]+)\*\*\s*/gm, '$1') // - **Bold** -> Bold
          .replace(/^[\s]*[-*+]\s+\*([^*]+)\*\s*/gm, '$1') // - *Italic* -> Italic
          .replace(/^[\s]*[-*+]\s+/gm, '• ') // Convert to bullet, keep spacing
          .replace(/^[\s]*\d+\.\s+\*\*([^*]+)\*\*:\s*/gm, '$1: ') // 1. **Bold:** -> Bold:
          .replace(/^[\s]*\d+\.\s+\*([^*]+)\*:\s*/gm, '$1: ') // 1. *Italic:* -> Italic:
          .replace(/^[\s]*\d+\.\s+\*\*([^*]+)\*\*\s*/gm, '$1') // 1. **Bold** -> Bold
          .replace(/^[\s]*\d+\.\s+\*([^*]+)\*\s*/gm, '$1') // 1. *Italic* -> Italic
          .replace(/^[\s]*\d+\.\s+/gm, '') // Remove numbered list markers
          // Remove HTML tags
          .replace(/<[^>]+>/g, '')
          // Decode HTML entities
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&apos;/g, "'")
          // Remove placeholder text patterns
          .replace(/\[Insert[^\]]+\]/g, '')
          .replace(/\[Your[^\]]+\]/g, '')
          .replace(/\[Release[^\]]+\]/g, '')
          .replace(/\[Submission[^\]]+\]/g, '')
          .replace(/\[Selection[^\]]+\]/g, '')
          .replace(/\[Kickoff[^\]]+\]/g, '')
          // Clean up multiple spaces and newlines
          .replace(/\n{3,}/g, '\n\n')
          .replace(/[ \t]{2,}/g, ' ')
          // Remove leading/trailing whitespace from each line
          .split('\n')
          .map(line => line.trim())
          .filter(line => {
            const trimmed = line.trim();
            return trimmed.length > 0 
              && !trimmed.match(/^---+$/) 
              && !trimmed.match(/^===+$/)
              && trimmed !== '---'
              && trimmed !== '===';
          })
          .join('\n')
          .trim();
        
        // Final cleanup - remove any remaining markdown artifacts
        cleaned = cleaned
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/__/g, '')
          .replace(/_/g, '')
          .replace(/---+/g, '')
          .replace(/===+/g, '')
          .replace(/^---+$/gm, '')
          .replace(/^===+$/gm, '');
        
        return cleaned;
      };

      // Helper function to add new page if needed
      const checkPageBreak = (requiredSpace: number = 10) => {
        if (y + requiredSpace > pageHeight - margin) {
          doc.addPage();
          y = margin;
          return true;
        }
        return false;
      };

      // Helper function to add heading
      const addHeading = (text: string, fontSize: number = 16, isBold: boolean = true) => {
        checkPageBreak(20);
        y += 8; // Space before heading
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        const cleanHeading = cleanText(text);
        doc.text(cleanHeading, margin, y);
        y += 10; // Space after heading
      };

      // Helper function to add text with wrapping and proper paragraph spacing
      const addText = (text: string, fontSize: number = 11, isBold: boolean = false, indent: number = 0) => {
        const cleanedText = cleanText(text);
        if (!cleanedText) return;
        
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        
        // Split by paragraphs (double newlines) or single newlines if no double newlines exist
        let paragraphs: string[];
        if (cleanedText.includes('\n\n')) {
          paragraphs = cleanedText.split(/\n\n+/).filter(p => p.trim().length > 0);
        } else {
          // If no double newlines, split by single newlines but group related lines
          const lines = cleanedText.split('\n').filter(l => l.trim().length > 0);
          paragraphs = [];
          let currentPara = '';
          lines.forEach((line, idx) => {
            const trimmed = line.trim();
            // If line starts with bullet or number, it's a new paragraph
            if (trimmed.match(/^[•\d+\.]/) || (idx > 0 && currentPara && !trimmed.match(/^[a-z]/))) {
              if (currentPara) {
                paragraphs.push(currentPara.trim());
                currentPara = '';
              }
            }
            currentPara += (currentPara ? ' ' : '') + trimmed;
          });
          if (currentPara) paragraphs.push(currentPara.trim());
        }
        
        paragraphs.forEach((paragraph, paraIndex) => {
          // Check if this is a bullet point
          const isBulletPoint = paragraph.trim().startsWith('•') || paragraph.trim().match(/^[•\d+\.]/);
          
          if (isBulletPoint) {
            // Handle bullet points with proper indentation
            const lines = doc.splitTextToSize(paragraph.trim(), contentWidth - indent - 10);
            lines.forEach((line: string, lineIndex: number) => {
              checkPageBreak(7);
              doc.text(line, margin + indent + (lineIndex === 0 ? 0 : 10), y);
              y += 6;
            });
            y += 2; // Extra space after bullet point
          } else {
            // Regular paragraph
            const lines = doc.splitTextToSize(paragraph.trim(), contentWidth - indent);
            lines.forEach((line: string) => {
              checkPageBreak(7);
              doc.text(line, margin + indent, y);
              y += 6;
            });
            // Add spacing between paragraphs (but not after the last one)
            if (paraIndex < paragraphs.length - 1) {
              y += 4; // Space between paragraphs
            }
          }
        });
        y += 3; // Final spacing after all paragraphs
      };

      // ========== TITLE PAGE ==========
      // Title
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      const cleanTitle = cleanText(formData.title || "Request for Proposal");
      const titleLines = doc.splitTextToSize(cleanTitle, contentWidth);
      titleLines.forEach((line: string, index: number) => {
        doc.text(line, pageWidth / 2, y + (index * 10), { align: "center" });
      });
      y += titleLines.length * 10 + 15;

      // Category & Date
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      if (formData.category) {
        doc.text(`Category: ${cleanText(formData.category)}`, pageWidth / 2, y, { align: "center" });
        y += 8;
      }
      doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      })}`, pageWidth / 2, y, { align: "center" });
      y += 20;

      // Add page break before content
      doc.addPage();
      y = margin;

      // ========== TABLE OF CONTENTS ==========
      if (rfpQuestions.length > 0) {
        addHeading("Table of Contents", 16, true);
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        
        const tocItemsBase = ["1. Introduction", "2. Project Description"];
        const sections = new Set(rfpQuestions.map((q) => q.section).filter(Boolean) as string[]);
        let sectionNum = 3;
        const sectionItems: string[] = [];
        sections.forEach((section: string) => {
          sectionItems.push(`${sectionNum}. ${section}`);
          sectionNum++;
        });
        const tocItems = [...tocItemsBase, ...sectionItems, `${sectionNum}. Questions & Requirements`];

        tocItems.forEach((item: string) => {
          checkPageBreak(7);
          doc.text(item, margin + 5, y);
          y += 7;
        });
        y += 10;
      }

      // ========== INTRODUCTION ==========
      addHeading("1. Introduction", 16, true);
      addText(
        "This Request for Proposal (RFP) outlines the requirements and expectations for the project described below. We invite qualified vendors to submit comprehensive proposals that address all aspects of this RFP.",
        11,
        false
      );
      y += 5;

      // ========== PROJECT DESCRIPTION ==========
      addHeading("2. Project Description", 16, true);
      
      if (rfpSummary) {
        addText(rfpSummary, 11, false);
      } else if (formData.description) {
        addText(formData.description, 11, false);
      } else {
        addText("Project description will be provided here.", 11, false);
      }
      y += 5;

      // Additional details
      if (formData.category) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`Category: ${cleanText(formData.category)}`, margin, y);
        y += 8;
      }

      if (creationType === "ai" && formData.aiPrompt) {
        y += 3;
        addHeading("2.1. Detailed Requirements", 14, true);
        addText(formData.aiPrompt, 11, false);
        y += 3;
      }

      // ========== QUESTIONS BY SECTION ==========
      if (rfpQuestions.length > 0) {
        // Group questions by section
        const questionsBySection: { [key: string]: typeof rfpQuestions } = {};
        const questionsWithoutSection: typeof rfpQuestions = [];

        rfpQuestions.forEach((q) => {
          if (q.section) {
            if (!questionsBySection[q.section]) {
              questionsBySection[q.section] = [];
            }
            questionsBySection[q.section].push(q);
          } else {
            questionsWithoutSection.push(q);
          }
        });

        // Add sections with questions
        let sectionNumber = 3;
        Object.keys(questionsBySection).forEach((sectionName: string) => {
          y += 8;
          addHeading(`${sectionNumber}. ${cleanText(sectionName)}`, 16, true);
          y += 3;
          sectionNumber++;

          questionsBySection[sectionName].forEach((q, index: number) => {
            checkPageBreak(25);
            y += 5;
            
            // Question (clean markdown/HTML)
            const cleanQuestion = cleanText(q.questionText);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(`${index + 1}. ${cleanQuestion}`, margin, y);
            y += 8;
            
            // Suggested Answer (if available) - clean markdown/HTML
            if (q.userEditedAnswer || q.aiSuggestedAnswer) {
              const answer = q.userEditedAnswer || q.aiSuggestedAnswer;
              const cleanAnswer = cleanText(answer);
              if (cleanAnswer) {
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                const answerLines = doc.splitTextToSize(`Answer: ${cleanAnswer}`, contentWidth - 20);
                answerLines.forEach((line: string) => {
                  checkPageBreak(7);
                  doc.text(line, margin + 10, y);
                  y += 6;
                });
                y += 3;
              }
            } else {
              y += 3;
            }
          });
        });

        // Add questions without section
        if (questionsWithoutSection.length > 0) {
          y += 8;
          addHeading(`${sectionNumber}. Questions & Requirements`, 16, true);
          y += 3;

          questionsWithoutSection.forEach((q, index: number) => {
            checkPageBreak(25);
            y += 5;
            
            // Question (clean markdown/HTML)
            const cleanQuestion = cleanText(q.questionText);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(`${index + 1}. ${cleanQuestion}`, margin, y);
            y += 8;
            
            // Suggested Answer (if available) - clean markdown/HTML
            if (q.userEditedAnswer || q.aiSuggestedAnswer) {
              const answer = q.userEditedAnswer || q.aiSuggestedAnswer;
              const cleanAnswer = cleanText(answer);
              if (cleanAnswer) {
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                const answerLines = doc.splitTextToSize(`Answer: ${cleanAnswer}`, contentWidth - 20);
                answerLines.forEach((line: string) => {
                  checkPageBreak(7);
                  doc.text(line, margin + 10, y);
                  y += 6;
                });
                y += 3;
              }
            } else {
              y += 3;
            }
          });
        }
      } else {
        // No questions yet - show placeholder
        y += 5;
        addHeading("3. Questions & Requirements", 16, true);
        addText(
          "Questions and requirements will be generated after the RFP document is analyzed. Please complete the analysis process to view detailed questions.",
          11,
          false
        );
      }

      // ========== FOOTER ==========
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }

      // Generate blob for preview (more reliable than data URI for iframe rendering)
      const pdfBlob = doc.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);
      setPdfPreviewUrl(blobUrl);
      
      // Also store blob for download
      const fileName = `${(formData.title || "RFP").replace(/[^a-z0-9]/gi, "_")}-${Date.now()}.pdf`;
      setGeneratedPdfBlob(pdfBlob);
      setGeneratedPdfFileName(fileName);

      setShowPreviewModal(true);
    } catch {
      setError("Failed to generate preview.");
    }
  };

  const handleCopyMessage = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const fetchRFPQuestions = async (rfpId: number) => {
    try {
      const res = await api.get(`/rfps/${rfpId}/questions`);
      
      // Handle both array response and object with questions property
      let questionsData = [];
      if (Array.isArray(res.data)) {
        questionsData = res.data;
      } else if (res.data && res.data.questions) {
        questionsData = res.data.questions;
      }
      
      const questions = questionsData.map((q: {
        id: number;
        questionText?: string;
        question?: string;
        aiSuggestedAnswer?: string;
        userEditedAnswer?: string;
        section?: string | null;
      }) => ({
        id: q.id,
        questionText: q.questionText || q.question || "",
        aiSuggestedAnswer: q.aiSuggestedAnswer || "",
        userEditedAnswer: q.userEditedAnswer || "",
        section: q.section || null,
      }));
      
      setRfpQuestions(questions);
      
      // Clean the summary text to remove markdown
      const rawSummary = res.data.summary || formData.description || "";
      // Simple markdown cleaning for summary
      const cleanSummary = rawSummary
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/^---+$/gm, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\[Insert[^\]]+\]/g, '')
        .replace(/\[Your[^\]]+\]/g, '')
        .trim();
      
      setRfpSummary(cleanSummary || formData.description || "");
    } catch (err) {
      console.error("Failed to fetch questions:", err);
      setRfpQuestions([]);
      setRfpSummary(formData.description || "");
    }
  };

  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);
  const [generatedPdfFileName, setGeneratedPdfFileName] = useState<string>("");

  const handleDownloadPDF = async (autoDownload: boolean = true) => {
    if (!preview) {
      setError("No data available for PDF download.");
      return;
    }

    try {
      // Fetch questions if we have a generated RFP
      if (generatedRFP?.id) {
        await fetchRFPQuestions(generatedRFP.id);
      }

      const doc = createPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let y = margin;

      // Helper function to clean markdown and HTML from text
      const cleanText = (text: string): string => {
        if (!text) return "";
        let cleaned = text
          // Remove markdown horizontal rules FIRST (before other processing)
          .replace(/^---+$/gm, '')
          .replace(/^===+$/gm, '')
          .replace(/^---+$/gm, '')
          .replace(/---+/g, '') // Remove any remaining horizontal rules
          .replace(/===+/g, '') // Remove any remaining equals rules
          // Remove markdown bold/italic (multiple passes for nested)
          .replace(/\*\*\*([^*]+)\*\*\*/g, '$1') // Bold italic
          .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
          .replace(/\*([^*]+)\*/g, '$1') // Italic
          .replace(/___([^_]+)___/g, '$1') // Bold italic underscore
          .replace(/__([^_]+)__/g, '$1') // Bold underscore
          .replace(/_([^_]+)_/g, '$1') // Italic underscore
          // Remove markdown headers
          .replace(/^#{1,6}\s+/gm, '')
          // Remove markdown links [text](url) -> text
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          // Remove markdown code blocks
          .replace(/```[\s\S]*?```/g, '')
          .replace(/`([^`]+)`/g, '$1')
          // Clean up bullet points - remove markdown formatting from list items
          .replace(/^[\s]*[-*+]\s+\*\*([^*]+)\*\*:\s*/gm, '$1: ') // - **Bold:** -> Bold:
          .replace(/^[\s]*[-*+]\s+\*([^*]+)\*:\s*/gm, '$1: ') // - *Italic:* -> Italic:
          .replace(/^[\s]*[-*+]\s+\*\*([^*]+)\*\*\s*/gm, '$1') // - **Bold** -> Bold
          .replace(/^[\s]*[-*+]\s+\*([^*]+)\*\s*/gm, '$1') // - *Italic* -> Italic
          .replace(/^[\s]*[-*+]\s+/gm, '• ') // Convert to bullet, keep spacing
          .replace(/^[\s]*\d+\.\s+\*\*([^*]+)\*\*:\s*/gm, '$1: ') // 1. **Bold:** -> Bold:
          .replace(/^[\s]*\d+\.\s+\*([^*]+)\*:\s*/gm, '$1: ') // 1. *Italic:* -> Italic:
          .replace(/^[\s]*\d+\.\s+\*\*([^*]+)\*\*\s*/gm, '$1') // 1. **Bold** -> Bold
          .replace(/^[\s]*\d+\.\s+\*([^*]+)\*\s*/gm, '$1') // 1. *Italic* -> Italic
          .replace(/^[\s]*\d+\.\s+/gm, '') // Remove numbered list markers
          // Remove HTML tags
          .replace(/<[^>]+>/g, '')
          // Decode HTML entities
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&apos;/g, "'")
          // Remove placeholder text patterns
          .replace(/\[Insert[^\]]+\]/g, '')
          .replace(/\[Your[^\]]+\]/g, '')
          .replace(/\[Release[^\]]+\]/g, '')
          .replace(/\[Submission[^\]]+\]/g, '')
          .replace(/\[Selection[^\]]+\]/g, '')
          .replace(/\[Kickoff[^\]]+\]/g, '')
          // Clean up multiple spaces and newlines
          .replace(/\n{3,}/g, '\n\n')
          .replace(/[ \t]{2,}/g, ' ')
          // Remove leading/trailing whitespace from each line
          .split('\n')
          .map(line => line.trim())
          .filter(line => {
            const trimmed = line.trim();
            return trimmed.length > 0 
              && !trimmed.match(/^---+$/) 
              && !trimmed.match(/^===+$/)
              && trimmed !== '---'
              && trimmed !== '===';
          })
          .join('\n')
          .trim();
        
        // Final cleanup - remove any remaining markdown artifacts
        cleaned = cleaned
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/__/g, '')
          .replace(/_/g, '')
          .replace(/---+/g, '')
          .replace(/===+/g, '')
          .replace(/^---+$/gm, '')
          .replace(/^===+$/gm, '');
        
        return cleaned;
      };

      // Helper function to add new page if needed
      const checkPageBreak = (requiredSpace: number = 10) => {
        if (y + requiredSpace > pageHeight - margin) {
          doc.addPage();
          y = margin;
          return true;
        }
        return false;
      };

      // Helper function to add heading
      const addHeading = (text: string, fontSize: number = 16, isBold: boolean = true) => {
        checkPageBreak(20);
        y += 8; // Space before heading
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        const cleanHeading = cleanText(text);
        doc.text(cleanHeading, margin, y);
        y += 10; // Space after heading
      };

      // Helper function to add text with wrapping and proper paragraph spacing
      const addText = (text: string, fontSize: number = 11, isBold: boolean = false, indent: number = 0) => {
        const cleanedText = cleanText(text);
        if (!cleanedText) return;
        
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        
        // Split by paragraphs (double newlines) or single newlines if no double newlines exist
        let paragraphs: string[];
        if (cleanedText.includes('\n\n')) {
          paragraphs = cleanedText.split(/\n\n+/).filter(p => p.trim().length > 0);
        } else {
          // If no double newlines, split by single newlines but group related lines
          const lines = cleanedText.split('\n').filter(l => l.trim().length > 0);
          paragraphs = [];
          let currentPara = '';
          lines.forEach((line, idx) => {
            const trimmed = line.trim();
            // If line starts with bullet or number, it's a new paragraph
            if (trimmed.match(/^[•\d+\.]/) || (idx > 0 && currentPara && !trimmed.match(/^[a-z]/))) {
              if (currentPara) {
                paragraphs.push(currentPara.trim());
                currentPara = '';
              }
            }
            currentPara += (currentPara ? ' ' : '') + trimmed;
          });
          if (currentPara) paragraphs.push(currentPara.trim());
        }
        
        paragraphs.forEach((paragraph, paraIndex) => {
          // Check if this is a bullet point
          const isBulletPoint = paragraph.trim().startsWith('•') || paragraph.trim().match(/^[•\d+\.]/);
          
          if (isBulletPoint) {
            // Handle bullet points with proper indentation
            const lines = doc.splitTextToSize(paragraph.trim(), contentWidth - indent - 10);
            lines.forEach((line: string, lineIndex: number) => {
              checkPageBreak(7);
              doc.text(line, margin + indent + (lineIndex === 0 ? 0 : 10), y);
              y += 6;
            });
            y += 2; // Extra space after bullet point
          } else {
            // Regular paragraph
            const lines = doc.splitTextToSize(paragraph.trim(), contentWidth - indent);
            lines.forEach((line: string) => {
              checkPageBreak(7);
              doc.text(line, margin + indent, y);
              y += 6;
            });
            // Add spacing between paragraphs (but not after the last one)
            if (paraIndex < paragraphs.length - 1) {
              y += 4; // Space between paragraphs
            }
          }
        });
        y += 3; // Final spacing after all paragraphs
      };

      // ========== TITLE PAGE ==========
      // Title
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      const cleanTitle = cleanText(formData.title || "Request for Proposal");
      const titleLines = doc.splitTextToSize(cleanTitle, contentWidth);
      titleLines.forEach((line: string, index: number) => {
        doc.text(line, pageWidth / 2, y + (index * 10), { align: "center" });
      });
      y += titleLines.length * 10 + 15;

      // Category & Date
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      if (formData.category) {
        doc.text(`Category: ${cleanText(formData.category)}`, pageWidth / 2, y, { align: "center" });
        y += 8;
      }
      doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      })}`, pageWidth / 2, y, { align: "center" });
      y += 20;

      // Add page break before content
      doc.addPage();
      y = margin;

      // ========== TABLE OF CONTENTS ==========
      if (rfpQuestions.length > 0) {
        addHeading("Table of Contents", 16, true);
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        
        const tocItemsBase = ["1. Introduction", "2. Project Description"];
        const sections = new Set(rfpQuestions.map((q) => q.section).filter(Boolean) as string[]);
        let sectionNum = 3;
        const sectionItems: string[] = [];
        sections.forEach((section: string) => {
          sectionItems.push(`${sectionNum}. ${section}`);
          sectionNum++;
        });
        const tocItems = [...tocItemsBase, ...sectionItems, `${sectionNum}. Questions & Requirements`];

        tocItems.forEach((item: string) => {
          checkPageBreak(7);
          doc.text(item, margin + 5, y);
          y += 7;
        });
        y += 10;
      }

      // ========== INTRODUCTION ==========
      addHeading("1. Introduction", 16, true);
      addText(
        "This Request for Proposal (RFP) outlines the requirements and expectations for the project described below. We invite qualified vendors to submit comprehensive proposals that address all aspects of this RFP.",
        11,
        false
      );
      y += 5;

      // ========== PROJECT DESCRIPTION ==========
      addHeading("2. Project Description", 16, true);
      
      if (rfpSummary) {
        addText(rfpSummary, 11, false);
      } else if (formData.description) {
        addText(formData.description, 11, false);
      } else {
        addText("Project description will be provided here.", 11, false);
      }
      y += 5;

      // Additional details
      if (formData.category) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`Category: ${cleanText(formData.category)}`, margin, y);
        y += 8;
      }

      if (creationType === "ai" && formData.aiPrompt) {
        y += 3;
        addHeading("2.1. Detailed Requirements", 14, true);
        addText(formData.aiPrompt, 11, false);
        y += 3;
      }

      // ========== QUESTIONS BY SECTION ==========
      if (rfpQuestions.length > 0) {
        // Group questions by section
        const questionsBySection: { [key: string]: typeof rfpQuestions } = {};
        const questionsWithoutSection: typeof rfpQuestions = [];

        rfpQuestions.forEach((q) => {
          if (q.section) {
            if (!questionsBySection[q.section]) {
              questionsBySection[q.section] = [];
            }
            questionsBySection[q.section].push(q);
          } else {
            questionsWithoutSection.push(q);
          }
        });

        // Add sections with questions
        let sectionNumber = 3;
        Object.keys(questionsBySection).forEach((sectionName: string) => {
          y += 8;
          addHeading(`${sectionNumber}. ${cleanText(sectionName)}`, 16, true);
          y += 3;
          sectionNumber++;

          questionsBySection[sectionName].forEach((q, index: number) => {
            checkPageBreak(25);
            y += 5;
            
            // Question (clean markdown/HTML)
            const cleanQuestion = cleanText(q.questionText);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(`${index + 1}. ${cleanQuestion}`, margin, y);
            y += 8;
            
            // Suggested Answer (if available) - clean markdown/HTML
            if (q.userEditedAnswer || q.aiSuggestedAnswer) {
              const answer = q.userEditedAnswer || q.aiSuggestedAnswer;
              const cleanAnswer = cleanText(answer);
              if (cleanAnswer) {
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                const answerLines = doc.splitTextToSize(`Answer: ${cleanAnswer}`, contentWidth - 20);
                answerLines.forEach((line: string) => {
                  checkPageBreak(7);
                  doc.text(line, margin + 10, y);
                  y += 6;
                });
                y += 3;
              }
            } else {
              y += 3;
            }
          });
        });

        // Add questions without section
        if (questionsWithoutSection.length > 0) {
          y += 8;
          addHeading(`${sectionNumber}. Questions & Requirements`, 16, true);
          y += 3;

          questionsWithoutSection.forEach((q, index: number) => {
            checkPageBreak(25);
            y += 5;
            
            // Question (clean markdown/HTML)
            const cleanQuestion = cleanText(q.questionText);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(`${index + 1}. ${cleanQuestion}`, margin, y);
            y += 8;
            
            // Suggested Answer (if available) - clean markdown/HTML
            if (q.userEditedAnswer || q.aiSuggestedAnswer) {
              const answer = q.userEditedAnswer || q.aiSuggestedAnswer;
              const cleanAnswer = cleanText(answer);
              if (cleanAnswer) {
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                const answerLines = doc.splitTextToSize(`Answer: ${cleanAnswer}`, contentWidth - 20);
                answerLines.forEach((line: string) => {
                  checkPageBreak(7);
                  doc.text(line, margin + 10, y);
                  y += 6;
                });
                y += 3;
              }
            } else {
              y += 3;
            }
          });
        }
      } else {
        // No questions yet - show placeholder
        y += 5;
        addHeading("3. Questions & Requirements", 16, true);
        addText(
          "Questions and requirements will be generated after the RFP document is analyzed. Please complete the analysis process to view detailed questions.",
          11,
          false
        );
      }

      // ========== FOOTER ==========
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }

      const fileName = `${(formData.title || "RFP").replace(/[^a-z0-9]/gi, "_")}-${Date.now()}.pdf`;
      
      if (autoDownload) {
        doc.save(fileName);
      } else {
        // Generate blob for preview and modal download
        const pdfBlob = doc.output("blob");
        setGeneratedPdfBlob(pdfBlob);
        setGeneratedPdfFileName(fileName);
        
        // Create blob URL for iframe preview (more reliable than data URI)
        const blobUrl = URL.createObjectURL(pdfBlob);
        setPdfPreviewUrl(blobUrl);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="proposal-builder">      
      <Row className="g-0 h-100">    
        <Col xs={12} lg={9} className="proposal-builder__left">
        <div className="section-header">
        <div className="section-header__title">
          <Wand2 size={22} />
          <h1>Proposal Builder</h1>
        </div>
        <p className="section-header__subtitle">
          Create, edit, and generate AI-powered proposals.
        </p>
      </div>
          <div className="proposal-builder__content">
            <div className="proposal-progress">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`proposal-step ${currentStep === step.id ? "active" : ""} ${
                    step.completed ? "completed" : ""
                  }`}
                >
                  <div className="proposal-step__indicator">
                    {step.completed ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <span className="step-number">{step.id}</span>
                    )}
                  </div>
                  <div className="proposal-step__content">
                    <h4 className="proposal-step__title">{step.title}</h4>
                    <p className="proposal-step__description">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="proposal-details">
                <h3 className="proposal-details__title">
                  Enter basic information for your Request For Proposal.
                </h3>

                {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>RFP Title *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="e.g. CRM Software Development RFP"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Description *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Briefly describe your project requirements..."
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Select
                      value={formData.category}
                      onChange={(e) => handleInputChange("category", e.target.value)}
                    >
                      <option value="">Select Category</option>
                      <option value="Software">Software Development</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Construction">Construction</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Other">Other</option>
                    </Form.Select>
                  </Form.Group>
                </Form>

                <div className="proposal-actions">
                  <Button variant="primary" onClick={handleNextStep} disabled={!formData.title || !formData.description}>
                    Next Step
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Upload Document & AI Prompt (with auto-analyze) */}
            {currentStep === 2 && (
              <div className="proposal-details">
                <h3 className="proposal-details__title">
                  Upload your document and/or provide AI requirements
                </h3>
                <p className="mb-4">
                  You can upload an existing RFP document, provide AI requirements, or both. Analysis will start automatically.
                </p>

                {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
                {message && <Alert variant="success" className="mb-3">{message}</Alert>}

                {loading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" />
                    <p className="mt-3">{message || "Processing your RFP..."}</p>
                  </div>
                ) : (
                  <>
                    {/* Upload Section */}
                    <div className="mb-4">
                      <Form.Label className="mb-2">
                        <Upload size={18} className="me-2" />
                        Upload Existing RFP Document (Optional)
                      </Form.Label>
                      <RFPUpload onSuccess={handleFileSelect} hideTitle compact />
                      {fileData && (
                        <Alert variant="success" className="mt-2">
                          ✓ Document uploaded: {fileData.filePath.split('/').pop()}
                        </Alert>
                      )}
                    </div>

                    {/* AI Prompt Section */}
                    <div className="mb-4">
                      <Form.Label className="mb-2">
                        <Sparkles size={18} className="me-2" />
                        AI Requirements (Optional)
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={6}
                        value={formData.aiPrompt}
                        onChange={(e) => handleInputChange("aiPrompt", e.target.value)}
                        placeholder="Example: I need a proposal for redesigning our CRM system with modern UI/UX, cloud-based architecture, mobile app support, and integration with existing ERP systems..."
                      />
                      <Form.Text>
                        Be as detailed as possible. The AI will use this to generate your RFP.
                      </Form.Text>
                    </div>

                    <Alert variant="info" className="mb-4">
                      <strong>Note:</strong> You can provide both a document and AI requirements. The system will analyze the document and use your requirements to enhance the RFP.
                    </Alert>

                    <div className="proposal-actions">
                      <Button variant="outline-secondary" onClick={handlePreviousStep}>
                        Previous
                      </Button>
                      <Button 
                        variant="primary" 
                        onClick={handleSubmit}
                        disabled={loading || (!fileData && !formData.aiPrompt.trim())}
                      >
                        {loading ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            Analyzing...
                          </>
                        ) : (
                          "Analyze & Generate Questions"
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Edit Questions & Answers */}
            {currentStep === 3 && generatedRFP && userId && (
              <div className="proposal-details">
                <h3 className="proposal-details__title">
                  Edit Questions & Answers
                </h3>
                <p className="mb-4">
                  Review, edit, and manage your questions. Generate AI answers, edit them manually, assign editors/reviewers, and mark compliance status.
                </p>

                <ErrorBoundary>
                  <QuestionsManagement 
                    key={`questions-${generatedRFP.id}-${Date.now()}`}
                    rfpId={generatedRFP.id} 
                    userId={userId}
                  />
                </ErrorBoundary>

                <div className="proposal-actions mt-4">
                  <Button variant="outline-secondary" onClick={handlePreviousStep}>
                    Previous
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    onClick={async () => {
                      // Save as draft
                      try {
                        setLoading(true);
                        await api.put(`/rfps/${generatedRFP.id}`, {
                          status: "DRAFT",
                        });
                        setMessage("✅ Saved as draft!");
                        setShowSuccessModal(true);
                      } catch (err: any) {
                        setError(err.response?.data?.error || "Failed to save draft");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save as Draft"}
                  </Button>
                  <Button variant="primary" onClick={handleNextStep}>
                    Continue to Review & Generate PDF
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Review & Generate PDF */}
            {currentStep === 4 && (
              <div className="proposal-details">
                <h3 className="proposal-details__title">
                  Review and generate your final RFP PDF.
                </h3>

                {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
                {message && <Alert variant="success" className="mb-3">{message}</Alert>}

                <div className="review-summary">
                  <h4>RFP Summary</h4>
                  <div className="summary-item">
                    <strong>Title:</strong> {formData.title || "Not specified"}
                  </div>
                  <div className="summary-item">
                    <strong>Description:</strong> {formData.description || "Not specified"}
                  </div>
                  <div className="summary-item">
                    <strong>Category:</strong> {formData.category || "Not specified"}
                  </div>
                  <div className="summary-item">
                    <strong>Creation Method:</strong> {creationType === "upload" ? "Upload Document" : "AI Generation"}
                  </div>
                  {generatedRFP && (
                    <div className="summary-item">
                      <strong>Questions:</strong> {rfpQuestions.length} questions ready
                    </div>
                  )}
                </div>

                <div className="proposal-actions mt-4">
                  <Button variant="outline-secondary" onClick={handlePreviousStep} disabled={loading}>
                    Previous
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    onClick={handleSaveDraft} 
                    disabled={loading}
                    className="me-2"
                  >
                    {loading ? "Saving..." : "Save as Draft"}
                  </Button>
                  <Button 
                    variant="success" 
                    onClick={async () => {
                      // Generate final PDF
                      try {
                        setLoading(true);
                        setMessage("Generating final PDF...");
                        await handleDownloadPDF(false); // Don't auto-download
                        setMessage("✅ PDF generated successfully!");
                        setShowSuccessModal(true);
                      } catch (err: any) {
                        setError(err.response?.data?.error || "Failed to generate PDF");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Generating PDF...
                      </>
                    ) : (
                      "Generate Final PDF"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Live Preview */}
            <div className="proposal-preview">
              <h3 className="proposal-preview__title">
                A real-time draft of your proposal as you build it.
              </h3>
              <div className="proposal-preview__content">
                <h4>Draft: {preview.title}</h4>
                <div className="preview-section">
                  <h5>1. Introduction</h5>
                  <p>{preview.introduction}</p>
                </div>
                <div className="preview-section">
                  <h5>2. Description</h5>
                    <p>{preview.description}</p>

                    {preview.aiPrompt && (
                      <>
                        <h5>3. AI Generation Requirements</h5>
                        <p>{preview.aiPrompt}</p>
                      </>
                    )}

                    {preview.uploadStatus && (
                      <>
                        <h5>3. Document Status</h5>
                        <p>{preview.uploadStatus}</p>
                      </>
                    )}

                </div>
              </div>
              <div className="proposal-preview__actions">
                <Button variant="outline-secondary" onClick={handleFullPreview}>
                  <Eye size={16} className="me-2" />
                  Full Preview
                </Button>
              </div>
            </div>
          </div>
        </Col>

        {/* Right Pane - AI Assistant */}
        <Col xs={12} lg={3} className="proposal-builder__right">
          <div className="ai-assistant">
            <div className="ai-assistant__header">
              <h3>AI Assistant</h3>
            </div>
            <div className="ai-assistant__messages">
              {aiMessages.map((message, index) => (
                <div
                  key={index}
                  className={`ai-message ai-message--${message.role}`}
                >
                  <div className="ai-message__content">
                  <p>{message.content}</p>
                  </div>
                  {message.role === "assistant" && (
                    <button
                      className="ai-message__copy"
                      onClick={() => handleCopyMessage(message.content, index)}
                      title="Copy message"
                    >
                      {copiedIndex === index ? (
                        <Check size={14} />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="ai-assistant__input">
              <Button variant="link" className="ai-assistant__attach" disabled>
                <Paperclip size={18} />
              </Button>
              <input
                type="text"
                placeholder={aiLoading ? "AI is thinking..." : "Type your message..."}
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !aiLoading && handleSendMessage()}
                disabled={aiLoading}
              />
              <Button 
                variant="primary" 
                onClick={handleSendMessage}
                disabled={aiLoading || !userMessage.trim()}
              >
                {aiLoading ? (
                  <Spinner as="span" animation="border" size="sm" />
                ) : (
                <Send size={18} />
                )}
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* PDF Preview Modal */}
      <Modal show={showPreviewModal} onHide={() => {
        // Clean up blob URL when modal closes
        if (pdfPreviewUrl && pdfPreviewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(pdfPreviewUrl);
        }
        setShowPreviewModal(false);
      }} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Proposal PDF Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {pdfPreviewUrl ? (
            <iframe 
              src={pdfPreviewUrl} 
              width="100%" 
              height="600px" 
              style={{ border: "none" }}
              title="PDF Preview"
            />
          ) : (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <p className="mt-2">Generating PDF preview...</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            if (pdfPreviewUrl && pdfPreviewUrl.startsWith('blob:')) {
              URL.revokeObjectURL(pdfPreviewUrl);
            }
            setShowPreviewModal(false);
          }}>Close</Button>
          <Button variant="success" onClick={() => handleDownloadPDF(true)}>Download PDF</Button>
        </Modal.Footer>
      </Modal>

      {/* Success Modal */}
      <Modal 
        show={showSuccessModal} 
        onHide={() => {
          setShowSuccessModal(false);
          // Reset form when modal closes
          setCurrentStep(1);
          setCreationType("");
          setFileData(null);
          setFormData({
            title: "",
            description: "",
            category: "",
            aiPrompt: "",
          });
          setError("");
          setMessage("");
          setPdfPreviewUrl(null);
          setAiMessages([
            {
              role: "assistant",
              content: "Hello! I am your AI Assistant. How can I help you with your proposal today?",
            },
          ]);
          setUserMessage("");
        }} 
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <CheckCircle2 size={24} className="text-success me-2" />
            RFP Created Successfully!
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center py-3">
            <p className="mb-4">Your RFP <strong>"{generatedRFP?.title}"</strong> has been created and is ready to use.</p>
            <div className="d-flex flex-column gap-2">
              {generatedRFP && (
                <>
                  <Button 
                    variant="primary" 
                    onClick={() => {
                      if (generatedRFP?.filePath) {
                        openFile(generatedRFP.filePath);
                      }
                    }}
                  >
                    <Eye size={18} className="me-2" />
                    View Generated RFP
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    onClick={async () => {
                      if (generatedPdfBlob) {
                        // Download the generated PDF
                        const url = URL.createObjectURL(generatedPdfBlob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = generatedPdfFileName;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                      } else if (generatedRFP?.filePath) {
                        // Fallback to existing file
                        const fileName = `${generatedRFP.title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
                        await downloadFile(generatedRFP.filePath, fileName);
                      }
                    }}
                  >
                    <Download size={18} className="me-2" />
                    Download PDF
                  </Button>
                </>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowSuccessModal(false);
              // Reset form
              setCurrentStep(1);
              setCreationType("");
              setFileData(null);
              setFormData({
                title: "",
                description: "",
                category: "",
                aiPrompt: "",
              });
              setError("");
              setMessage("");
              setPdfPreviewUrl(null);
              setAiMessages([
                {
                  role: "assistant",
                  content: "Hello! I am your AI Assistant. How can I help you with your proposal today?",
                },
              ]);
              setUserMessage("");
            }}
          >
            Create Another RFP
          </Button>
          <Button 
            variant="success" 
            onClick={() => {
              setShowSuccessModal(false);
              // Reset form
              setCurrentStep(1);
              setCreationType("");
              setFileData(null);
              setFormData({
                title: "",
                description: "",
                category: "",
                aiPrompt: "",
              });
              setError("");
              setMessage("");
              setPdfPreviewUrl(null);
              setAiMessages([
                {
                  role: "assistant",
                  content: "Hello! I am your AI Assistant. How can I help you with your proposal today?",
                },
              ]);
              setUserMessage("");
              navigate("/dashboard");
            }}
          >
            Go to Dashboard
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ProposalBuilder;

