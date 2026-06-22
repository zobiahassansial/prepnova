import { describe, it, expect } from "vitest"

/**
 * Unit tests for file upload validation logic.
 * Tests the same constraints enforced in the scan and generate API routes.
 */

const ALLOWED_MIME_TYPES_SCAN = ["application/pdf", "image/jpeg", "image/png", "image/webp"]
const ALLOWED_MIME_TYPES_NOTES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

function validateScanFile(mimeType: string, sizeBytes: number): { valid: boolean; error?: string } {
    if (!ALLOWED_MIME_TYPES_SCAN.includes(mimeType)) {
        return { valid: false, error: "Unsupported file type." }
    }
    if (sizeBytes > MAX_FILE_SIZE_BYTES) {
        return { valid: false, error: "File too large. Maximum size is 10 MB." }
    }
    return { valid: true }
}

function validateNoteFile(mimeType: string, sizeBytes: number): { valid: boolean; error?: string } {
    if (!ALLOWED_MIME_TYPES_NOTES.includes(mimeType)) {
        return { valid: false, error: "Unsupported file type. Use PDF, DOCX, or TXT." }
    }
    if (sizeBytes > MAX_FILE_SIZE_BYTES) {
        return { valid: false, error: "File too large. Maximum size is 10 MB." }
    }
    return { valid: true }
}

describe("validateScanFile", () => {
    it("accepts PDF", () => {
        expect(validateScanFile("application/pdf", 1024).valid).toBe(true)
    })

    it("accepts JPEG", () => {
        expect(validateScanFile("image/jpeg", 500_000).valid).toBe(true)
    })

    it("accepts PNG", () => {
        expect(validateScanFile("image/png", 200_000).valid).toBe(true)
    })

    it("rejects DOCX", () => {
        expect(validateScanFile("application/vnd.openxmlformats-officedocument.wordprocessingml.document", 1000).valid).toBe(false)
    })

    it("rejects executable", () => {
        expect(validateScanFile("application/octet-stream", 1000).valid).toBe(false)
    })

    it("rejects file over 10 MB", () => {
        const result = validateScanFile("image/jpeg", 11 * 1024 * 1024)
        expect(result.valid).toBe(false)
        expect(result.error).toContain("too large")
    })

    it("accepts file exactly at 10 MB", () => {
        expect(validateScanFile("image/png", 10 * 1024 * 1024).valid).toBe(true)
    })

    it("rejects empty mimeType", () => {
        expect(validateScanFile("", 1000).valid).toBe(false)
    })
})

describe("validateNoteFile", () => {
    it("accepts PDF", () => {
        expect(validateNoteFile("application/pdf", 1024).valid).toBe(true)
    })

    it("accepts DOCX", () => {
        expect(validateNoteFile("application/vnd.openxmlformats-officedocument.wordprocessingml.document", 5000).valid).toBe(true)
    })

    it("accepts plain text", () => {
        expect(validateNoteFile("text/plain", 300).valid).toBe(true)
    })

    it("rejects image files", () => {
        expect(validateNoteFile("image/png", 1000).valid).toBe(false)
    })

    it("rejects ZIP", () => {
        expect(validateNoteFile("application/zip", 1000).valid).toBe(false)
    })

    it("returns informative error for wrong type", () => {
        const result = validateNoteFile("application/zip", 1000)
        expect(result.error).toContain("PDF, DOCX, or TXT")
    })
})
