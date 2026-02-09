"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, MicOff, Zap, Sparkles, PictureInPicture, BrainCircuit, MonitorPlay } from "lucide-react"
import { toast } from "sonner"
import { getLiveInterviewHelp } from "@/actions/ai-interview"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function InterviewCopilotPage() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [suggestion, setSuggestion] = useState("Waiting for question...")
  const [loading, setLoading] = useState(false)
  const [autoMode, setAutoMode] = useState(true) // Default ON
  
  const recognitionRef = useRef<any>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const silenceTimer = useRef<NodeJS.Timeout | null>(null)
  const isVideoInitialized = useRef(false)
  
  // --- SPEECH RECOGNITION (Standard Mic) ---
  const startRecognition = () => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true 
        recognition.interimResults = true
        recognition.lang = "en-US"

        recognition.onstart = () => console.log("Listening started")

        recognition.onresult = (event: any) => {
          let currentTranscript = ""
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript
          }
          
          if (currentTranscript.trim()) {
              setTranscript(currentTranscript)
              
              // AUTO ANSWER LOGIC
              if (autoMode) {
                  if (silenceTimer.current) clearTimeout(silenceTimer.current)
                  // Wait 1.5s silence before answering
                  silenceTimer.current = setTimeout(() => {
                      handleAutoAnswer(currentTranscript)
                  }, 1500) 
              }
          }
        }

        recognition.onerror = (event: any) => {
             if (event.error !== 'no-speech') setIsListening(false)
        }
        
        // Auto-restart on end (Zombie mode)
        recognition.onend = () => {
            if (isListening) {
                try { recognition.start() } catch (e) {}
            }
        }

        recognitionRef.current = recognition
        recognition.start()
        setIsListening(true)
      } else {
        toast.error("Use Chrome Browser")
      }
    }
  }

  const stopRecognition = () => {
      setIsListening(false)
      if (recognitionRef.current) recognitionRef.current.stop()
      if (silenceTimer.current) clearTimeout(silenceTimer.current)
  }

  const handleAutoAnswer = async (text: string) => {
      if (!text || loading) return;
      toast.info("Generating Answer...", { duration: 1000 });
      await getAnswer(text);
  }

  // --- VIDEO STREAM SETUP (For PiP) ---
  useEffect(() => {
      if (isVideoInitialized.current) return;
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (canvas && video) {
          isVideoInitialized.current = true;
          const stream = canvas.captureStream(30); 
          video.srcObject = stream;
          video.muted = true;
          video.onloadedmetadata = () => {
              video.play().catch(e => console.warn("Autoplay prevented:", e));
          }
      }
  }, []); 

  // --- CANVAS DRAWING LOOP ---
  useEffect(() => {
     const drawCanvas = () => {
         const canvas = canvasRef.current;
         const ctx = canvas?.getContext('2d');
         if (!canvas || !ctx) return;

         ctx.fillStyle = "#000000"; 
         ctx.fillRect(0, 0, canvas.width, canvas.height);

         ctx.fillStyle = "#ffffff";
         ctx.font = "bold 28px Arial";
         ctx.textAlign = "center";
         ctx.textBaseline = "middle";

         const text = loading ? "Thinking..." : suggestion;
         const maxWidth = canvas.width - 40;
         const words = text.split(' ');
         let line = '';
         let lines = [];
         
         for(let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                lines.push(line);
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
         }
         lines.push(line);

         const lineHeight = 36;
         const startY = (canvas.height - (lines.length * lineHeight)) / 2;
         
         lines.forEach((l, i) => {
             ctx.fillText(l, canvas.width / 2, startY + (i * lineHeight));
         });
         
         if (loading) {
             ctx.fillStyle = "#eab308";
             ctx.fillRect(0, canvas.height - 10, (Date.now() % 1000) / 1000 * canvas.width, 10);
         }
     }
     drawCanvas();
  }, [suggestion, loading]); 


  const getAnswer = async (textToProcess?: string) => {
    const query = textToProcess || transcript;
    if (!query.trim()) return
    setLoading(true)
    const result = await getLiveInterviewHelp(query)
    if (result.success) {
        setSuggestion(result.answer!)
    }
    setLoading(false)
  }
  
  const enablePiP = async () => {
      try {
          if (document.pictureInPictureElement) {
              await document.exitPictureInPicture();
          } else if (videoRef.current) {
              if (videoRef.current.paused) await videoRef.current.play();
              await videoRef.current.requestPictureInPicture();
          }
      } catch (error) {
          toast.error("Click anywhere on page first.");
      }
  }

  return (
    <div className="container max-w-6xl py-8 min-h-[calc(100vh-100px)] flex flex-col gap-6">
      <canvas ref={canvasRef} width={600} height={300} className="hidden" />
      <video ref={videoRef} className="hidden" muted playsInline />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 text-white p-6 rounded-2xl shadow-lg gap-4">
        <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-yellow-400">
                <BrainCircuit className="h-8 w-8" /> Auto-Copilot
            </h1>
            <p className="text-slate-400">Enable 'Auto-Answer' & ensure audio is loud.</p>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
             <div className="flex items-center space-x-2 bg-slate-800 p-3 rounded-lg border border-slate-700">
                <Switch id="auto-mode" checked={autoMode} onCheckedChange={setAutoMode} />
                <Label htmlFor="auto-mode" className="text-white cursor-pointer flex items-center gap-2">
                    {autoMode ? <Zap className="h-4 w-4 text-yellow-400 fill-yellow-400"/> : <Zap className="h-4 w-4 text-slate-400"/>}
                    Auto-Answer
                </Label>
             </div>

             <div className="h-8 w-px bg-slate-700 hidden md:block"></div>

             <Button variant="outline" className="bg-slate-800 text-white border-slate-700" onClick={enablePiP}>
                <PictureInPicture className="mr-2 h-4 w-4" /> Floating Window
             </Button>

             <Button 
                variant={isListening ? "destructive" : "default"} 
                className={isListening ? "animate-pulse" : "bg-emerald-600 hover:bg-emerald-500"}
                onClick={isListening ? stopRecognition : startRecognition}
             >
                {isListening ? <><MicOff className="mr-2" /> Stop</> : <><Mic className="mr-2" /> Start Listening</>}
             </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        {/* LEFT: Transcript */}
        <Card className="p-6 flex flex-col h-full border-l-4 border-l-blue-500 shadow-md">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                <MonitorPlay className="h-4 w-4" /> Live Transcript:
            </h2>
            <div className="flex-1 p-4 bg-muted/30 rounded-xl border min-h-[200px] text-lg font-medium leading-relaxed">
                {transcript || <span className="text-muted-foreground italic opacity-50">Waiting for speech... (Ensure volume is UP)</span>}
            </div>
        </Card>

        {/* RIGHT: AI Suggestion */}
        <Card className="p-6 flex flex-col h-full bg-slate-950 text-white border-none shadow-2xl">
            <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Suggested Answer:
            </h2>
            <div className="flex-1 p-6 bg-slate-900 rounded-xl border border-slate-800 text-2xl leading-relaxed shadow-inner flex items-center justify-center text-center">
                {loading ? (
                    <div className="flex gap-2">
                        <span className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce"></span>
                        <span className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce delay-100"></span>
                        <span className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce delay-200"></span>
                    </div>
                ) : (
                    <p>{suggestion}</p>
                )}
            </div>
        </Card>
      </div>
    </div>
  )
}