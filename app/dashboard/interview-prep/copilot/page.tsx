"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, MicOff, Zap, Sparkles, PictureInPicture, PictureInPicture2, BrainCircuit, MonitorPlay, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

declare global {
  interface Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
  }
}

// Canvas dimensions — 16:9 for best PiP appearance
const CW = 800
const CH = 450

export default function InterviewCopilotPage() {
  const { user } = useAuth()
  const [isListening, setIsListening]   = useState(false)
  const [transcript, setTranscript]     = useState("")
  const [suggestion, setSuggestion]     = useState("Waiting for question...")
  const [loading, setLoading]           = useState(false)
  const [autoMode, setAutoMode]         = useState(true)
  const [isPiP, setIsPiP]               = useState(false)

  // Refs — used inside RAF/recognition callbacks to avoid stale closures
  const recognitionRef  = useRef<any>(null)
  const canvasRef       = useRef<HTMLCanvasElement>(null)
  const videoRef        = useRef<HTMLVideoElement>(null)
  const silenceTimer    = useRef<NodeJS.Timeout | null>(null)
  const rafRef          = useRef<number>(0)
  const isListeningRef  = useRef(false)
  const loadingRef      = useRef(false)
  const autoModeRef     = useRef(true)
  const suggestionRef   = useRef("Waiting for question...")

  // Keep refs synced
  useEffect(() => { isListeningRef.current = isListening }, [isListening])
  useEffect(() => { loadingRef.current = loading }, [loading])
  useEffect(() => { autoModeRef.current = autoMode }, [autoMode])
  useEffect(() => { suggestionRef.current = suggestion }, [suggestion])

  // ── Canvas draw (called from RAF loop) ──────────────────────────────────
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const isLoad = loadingRef.current
    const text   = suggestionRef.current

    // Background
    ctx.fillStyle = "#0a0a0a"
    ctx.fillRect(0, 0, CW, CH)

    // Top accent bar (green when live, yellow when loading)
    ctx.fillStyle = isLoad ? "#eab308" : "#10b981"
    ctx.fillRect(0, 0, CW, 4)

    // Label
    ctx.fillStyle = isLoad ? "#eab308" : "#10b981"
    ctx.font = "bold 14px Arial"
    ctx.textAlign = "left"
    ctx.fillText(isLoad ? "GENERATING ANSWER..." : "AI SUGGESTED ANSWER", 24, 34)

    // Divider
    ctx.fillStyle = "#1f1f1f"
    ctx.fillRect(0, 48, CW, 1)

    // Main answer text — word-wrap
    ctx.fillStyle = "#f1f5f9"
    ctx.font = "500 26px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    const maxW = CW - 80
    const words = text.split(" ")
    const lines: string[] = []
    let line = ""

    for (const word of words) {
      const test = line ? `${line} ${word}` : word
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line)
        line = word
      } else {
        line = test
      }
    }
    if (line) lines.push(line)

    const lineH = 38
    const totalH = lines.length * lineH
    const startY = 48 + (CH - 48 - 40) / 2 - totalH / 2 + lineH / 2

    lines.forEach((l, i) => {
      // Dim old lines slightly for readability
      ctx.globalAlpha = i === lines.length - 1 ? 1 : 0.85
      ctx.fillText(l, CW / 2, startY + i * lineH)
    })
    ctx.globalAlpha = 1

    // Loading progress bar at bottom
    if (isLoad) {
      const progress = (Date.now() % 1400) / 1400
      ctx.fillStyle = "#1f1f1f"
      ctx.fillRect(0, CH - 6, CW, 6)
      ctx.fillStyle = "#eab308"
      ctx.fillRect(0, CH - 6, progress * CW, 6)
    } else {
      // Subtle green bottom bar
      ctx.fillStyle = "#10b981"
      ctx.fillRect(0, CH - 4, CW, 4)
    }
  }, [])

  // ── Continuous RAF loop ──────────────────────────────────────────────────
  useEffect(() => {
    const loop = () => {
      drawCanvas()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [drawCanvas])

  // ── Set up video stream from canvas ─────────────────────────────────────
  // Run once after first paint so refs are guaranteed to be attached
  useEffect(() => {
    const canvas = canvasRef.current
    const video  = videoRef.current
    if (!canvas || !video) return

    // captureStream at 25 fps — canvas must NOT be display:none for this to produce frames
    const stream = canvas.captureStream(25)
    video.srcObject = stream
    video.muted = true

    // Play silently so the stream is active and PiP can be requested later
    video.play().catch(() => {
      // Autoplay blocked — user interaction will trigger play on PiP click
    })

    // Track PiP exit (e.g. user closes the floating window manually)
    const onPiPExit = () => setIsPiP(false)
    video.addEventListener("leavepictureinpicture", onPiPExit)
    video.addEventListener("enterpictureinpicture", () => setIsPiP(true))

    return () => {
      video.removeEventListener("leavepictureinpicture", onPiPExit)
      stream.getTracks().forEach(t => t.stop())
    }
  }, [])

  // ── PiP toggle ───────────────────────────────────────────────────────────
  const togglePiP = async () => {
    const video = videoRef.current
    if (!video) return

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
        setIsPiP(false)
        return
      }

      // Ensure video is playing (needed before requestPictureInPicture)
      if (video.paused || video.readyState < 2) {
        await video.play()
      }

      await video.requestPictureInPicture()
      setIsPiP(true)
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        toast.error("Click anywhere on the page first, then try again.")
      } else if (err.name === "InvalidStateError") {
        toast.error("Video is not ready yet. Wait a moment and try again.")
      } else {
        toast.error("Could not open floating window: " + (err.message || "unknown error"))
      }
    }
  }

  // ── Speech recognition ───────────────────────────────────────────────────
  const startRecognition = () => {
    if (typeof window === "undefined") return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error("Speech recognition requires Chrome or Edge.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event: any) => {
      let current = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        current += event.results[i][0].transcript
      }
      if (!current.trim()) return

      setTranscript(current)

      if (autoModeRef.current) {
        if (silenceTimer.current) clearTimeout(silenceTimer.current)
        // 1000ms silence = fast enough for live interviews without false triggers
        silenceTimer.current = setTimeout(() => {
          if (!loadingRef.current) getAnswer(current)
        }, 1000)
      }
    }

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Allow mic permission and try again.")
        setIsListening(false)
      } else if (event.error !== "no-speech") {
        console.warn("Speech error:", event.error)
      }
    }

    recognition.onend = () => {
      if (isListeningRef.current) {
        try { recognition.start() } catch { /* already restarting */ }
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  const stopRecognition = () => {
    setIsListening(false)
    isListeningRef.current = false
    recognitionRef.current?.stop()
    recognitionRef.current = null
    if (silenceTimer.current) clearTimeout(silenceTimer.current)
  }

  // ── AI answer — streaming for instant first-token display ───────────────
  const getAnswer = async (textToProcess?: string) => {
    const query = (textToProcess || transcript).trim()
    if (!query || loadingRef.current) return

    setLoading(true)
    setSuggestion("")
    setTranscript("") // clear so next question is fresh

    try {
      const token = await user?.getIdToken()
      const res = await fetch("/api/interview-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ transcript: query }),
      })

      if (!res.ok || !res.body) {
        setSuggestion("Could not generate answer. Please try again.")
        toast.error("Answer generation failed.")
        return
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ""

      setLoading(false) // first token is on its way — stop the spinner

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setSuggestion(full)            // update UI token-by-token
        suggestionRef.current = full   // keep PiP canvas in sync
      }
    } catch (err: any) {
      setSuggestion("Could not generate answer. Please try again.")
      toast.error(err.message || "Answer generation failed.")
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-6xl py-8 min-h-[calc(100vh-100px)] flex flex-col gap-6">

      {/*
        Canvas and video MUST NOT be display:none.
        Position them off-screen so they are invisible but still rendered.
        canvas.captureStream() and requestPictureInPicture() both require
        the elements to be in the render tree.
      */}
      <canvas
        ref={canvasRef}
        width={CW}
        height={CH}
        style={{ position: "fixed", left: "-9999px", top: "-9999px", pointerEvents: "none" }}
        aria-hidden="true"
      />
      <video
        ref={videoRef}
        muted
        playsInline
        style={{ position: "fixed", left: "-9999px", top: "-9999px", width: "1px", height: "1px", pointerEvents: "none" }}
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 text-white p-6 rounded-2xl shadow-lg gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-yellow-400">
            <BrainCircuit className="h-8 w-8" /> Interview Copilot
          </h1>
          <p className="text-slate-400 text-sm">
            {autoMode
              ? "Auto-Answer is ON — AI answers after 1.8s of silence."
              : "Auto-Answer is OFF — click \"Get Answer\" manually."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Auto-Answer toggle */}
          <div className="flex items-center space-x-2 bg-slate-800 px-4 py-2.5 rounded-lg border border-slate-700">
            <Switch id="auto-mode" checked={autoMode} onCheckedChange={setAutoMode} />
            <Label htmlFor="auto-mode" className="text-white cursor-pointer flex items-center gap-2 text-sm">
              {autoMode
                ? <Zap className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                : <Zap className="h-4 w-4 text-slate-400" />}
              Auto-Answer
            </Label>
          </div>

          {/* Floating Window (PiP) */}
          <Button
            variant="outline"
            className={`gap-2 border-slate-600 ${isPiP ? "bg-emerald-900/40 text-emerald-400 border-emerald-700" : "bg-slate-800 text-white"}`}
            onClick={togglePiP}
            title={isPiP ? "Close floating window" : "Open floating window"}
          >
            {isPiP
              ? <><PictureInPicture2 className="h-4 w-4" /> Close Float</>
              : <><PictureInPicture className="h-4 w-4" /> Float Window</>}
          </Button>

          {/* Manual Get Answer (shown when auto-mode is off and there is a transcript) */}
          {!autoMode && transcript && (
            <Button
              className="bg-emerald-600 hover:bg-emerald-500 gap-2"
              onClick={() => getAnswer()}
              disabled={loading}
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                : <><Sparkles className="h-4 w-4" /> Get Answer</>}
            </Button>
          )}

          {/* Listen toggle */}
          <Button
            variant={isListening ? "destructive" : "default"}
            className={isListening ? "animate-pulse gap-2" : "bg-emerald-600 hover:bg-emerald-500 gap-2"}
            onClick={isListening ? stopRecognition : startRecognition}
          >
            {isListening
              ? <><MicOff className="h-4 w-4" /> Stop</>
              : <><Mic className="h-4 w-4" /> Start Listening</>}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        {/* LEFT: Transcript */}
        <Card className="p-6 flex flex-col h-full border-l-4 border-l-blue-500 shadow-md">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <MonitorPlay className="h-4 w-4" /> Live Transcript
          </h2>
          <div className="flex-1 p-4 bg-muted/30 rounded-xl border min-h-[200px] text-base font-medium leading-relaxed relative">
            {isListening && (
              <span className="absolute top-3 right-3 flex items-center gap-1.5 text-xs text-red-500 font-semibold">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                LIVE
              </span>
            )}
            {transcript
              ? <span>{transcript}</span>
              : <span className="text-muted-foreground italic opacity-50">
                  {isListening ? "Listening... speak clearly." : "Start listening to capture speech."}
                </span>}
          </div>
        </Card>

        {/* RIGHT: AI Suggestion */}
        <Card className="p-6 flex flex-col h-full bg-slate-950 text-white border-none shadow-2xl">
          <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Suggested Answer
          </h2>
          <div className="flex-1 p-6 bg-slate-900 rounded-xl border border-slate-800 text-xl leading-relaxed shadow-inner flex items-center justify-center text-center">
            {loading
              ? <div className="flex flex-col items-center gap-3">
                  <div className="flex gap-2">
                    <span className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <p className="text-sm text-slate-400">Generating answer...</p>
                </div>
              : <p className="whitespace-pre-wrap">{suggestion}</p>}
          </div>

          {/* PiP hint */}
          {!isPiP && (
            <p className="text-xs text-slate-500 text-center mt-3">
              Click <strong className="text-slate-400">Float Window</strong> to see this answer overlay on top of your video call.
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}
