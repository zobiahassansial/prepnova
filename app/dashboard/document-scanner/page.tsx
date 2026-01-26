"use client"

import { useState, useRef, useCallback } from "react"
import Webcam from "react-webcam"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Camera, Upload, Scissors, FileType, Check } from "lucide-react"

export default function DocumentScannerPage() {
    const webcamRef = useRef<Webcam>(null)
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [isCameraActive, setIsCameraActive] = useState(false)

    const capture = useCallback(() => {
        if (webcamRef.current) {
            const image = webcamRef.current.getScreenshot();
            setImageSrc(image);
            setIsCameraActive(false);
        }
    }, [webcamRef]);

    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
            <h1 className="text-2xl font-bold tracking-tight">Document Scanner & Toolkit</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                {/* Capture / Upload Area */}
                <div className="space-y-6">
                    <Card className="h-fit">
                        <CardHeader>
                            <CardTitle>Capture Document</CardTitle>
                            <CardDescription>Use your webcam to scan notes or receipts.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center gap-4 min-h-[300px] justify-center bg-black/5 rounded-lg m-6 mt-0">
                            {isCameraActive ? (
                                <div className="relative w-full h-full flex flex-col items-center">
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        className="rounded-lg w-full"
                                    />
                                    <Button onClick={capture} className="absolute bottom-4 bg-red-500 hover:bg-red-600 rounded-full h-12 w-12 p-0">
                                        <Camera className="h-6 w-6 text-white" />
                                    </Button>
                                </div>
                            ) : imageSrc ? (
                                <div className="relative w-full">
                                    <img src={imageSrc} alt="Scanned" className="rounded-lg w-full" />
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="absolute top-2 right-2"
                                        onClick={() => setImageSrc(null)}
                                    >
                                        Retake
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center p-8">
                                    <div className="bg-background p-4 rounded-full inline-flex mb-4">
                                        <Camera className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <p className="mb-4 text-sm text-muted-foreground">Camera permission required</p>
                                    <Button onClick={() => setIsCameraActive(true)}>Start Camera</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" className="h-24 flex flex-col gap-2">
                            <Upload className="h-6 w-6" />
                            <span>Upload File</span>
                        </Button>
                        <Button variant="outline" className="h-24 flex flex-col gap-2">
                            <FileType className="h-6 w-6" />
                            <span>Merge PDFs</span>
                        </Button>
                    </div>
                </div>

                {/* Editing / Tools Area */}
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Edit & Export</CardTitle>
                        <CardDescription>Enhance your scanned documents.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {imageSrc ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="p-4 border rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Scissors className="h-5 w-5 text-muted-foreground" />
                                            <span>Auto-Crop Borders</span>
                                        </div>
                                        <Button size="sm" variant="outline">Apply</Button>
                                    </div>
                                    <div className="p-4 border rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <FileType className="h-5 w-5 text-muted-foreground" />
                                            <span>OCR (Extract Text)</span>
                                        </div>
                                        <Button size="sm">Extract</Button>
                                    </div>
                                </div>

                                <div className="bg-muted p-4 rounded-lg">
                                    <h3 className="font-medium mb-2">Export As</h3>
                                    <div className="flex gap-2">
                                        <Button className="flex-1" variant="default">PDF</Button>
                                        <Button className="flex-1" variant="secondary">JPG</Button>
                                        <Button className="flex-1" variant="secondary">DOCX</Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                Scan or upload a document to enable editing tools.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
