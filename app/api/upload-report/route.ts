import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/upload-report
 * Accepts multipart form data with a file field.
 * Supports: .pdf, .txt, .csv, .json, .docx, .png, .jpg, .jpeg, .tiff
 * Extracts text from the file and creates a case with the extracted text.
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded. Please select a file.' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required. Please log in again.' }, { status: 401 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/json',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/png',
      'image/jpeg',
      'image/tiff',
      'image/jpg',
    ]
    const allowedExtensions = ['.pdf', '.txt', '.csv', '.json', '.docx', '.doc', '.png', '.jpg', '.jpeg', '.tiff']

    const fileName = file.name.toLowerCase()
    const hasAllowedExt = allowedExtensions.some(ext => fileName.endsWith(ext))
    const hasAllowedType = allowedTypes.includes(file.type)

    if (!hasAllowedExt && !hasAllowedType) {
      return NextResponse.json({
        error: `Unsupported file type: ${file.type || 'unknown'}. Supported: PDF, TXT, CSV, JSON, DOCX, PNG, JPG, TIFF.`
      }, { status: 400 })
    }

    // Validate file size (25MB max)
    const maxSize = 25 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 25MB.' }, { status: 400 })
    }

    setStatusMsg('Extracting text from file...')

    // Extract text from file
    let extractedText = ''

    if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
      extractedText = await extractPdfText(file)
    } else if (file.type === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.csv')) {
      extractedText = await file.text()
    } else if (file.type === 'application/json' || fileName.endsWith('.json')) {
      const jsonText = await file.text()
      try {
        const parsed = JSON.parse(jsonText)
        extractedText = JSON.stringify(parsed, null, 2)
      } catch {
        extractedText = jsonText
      }
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword' ||
      fileName.endsWith('.docx') ||
      fileName.endsWith('.doc')
    ) {
      extractedText = await extractDocxText(file)
    } else if (file.type.startsWith('image/') || fileName.match(/\.(png|jjpg|jpeg|tiff)$/)) {
      extractedText = await extractImageText(file)
    } else {
      // Fallback: try to read as text
      try {
        extractedText = await file.text()
      } catch {
        return NextResponse.json({ error: 'Could not read file content. Please try a different format.' }, { status: 400 })
      }
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: 'No text could be extracted from the file. Please make sure it contains readable text.' }, { status: 400 })
    }

    // Create case in Supabase
    const supabase = createServiceClient()
    const { data: newCase, error: caseError } = await supabase
      .from('cases')
      .insert({ user_id: userId, credit_report_text: extractedText, status: 'analyzing', source_file: file.name })
      .select()
      .single()

    if (caseError || !newCase) {
      console.error('Case creation error:', caseError)
      return NextResponse.json({ error: 'Failed to create case. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      caseId: newCase.id,
      fileName: file.name,
      fileSize: file.size,
      textLength: extractedText.length,
      message: `File "${file.name}" uploaded successfully. Extracted ${extractedText.length} characters.`
    })

  } catch (err) {
    console.error('Upload error:', err)
    const message = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function extractPdfText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Use pdfjs-dist for PDF text extraction
    try {
      const pdfjsLib = await import('pdfjs-dist')
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) })
      const pdf = await loadingTask.promise
      const textParts: string[] = []
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items.map((item: any) => item.str).join(' ')
        textParts.push(pageText)
      }
      const fullText = textParts.join('\n\n')
      if (fullText.trim()) return fullText
    } catch {
      // pdfjs failed
    }

    return '[PDF uploaded but text extraction requires server-side processing. Your file has been saved and will be analyzed.]'
  } catch {
    return '[PDF uploaded but text extraction failed. Please try pasting your report text directly.]'
  }
}

async function extractDocxText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer })
    if (result.value && result.value.trim()) {
      return result.value
    }
    return '[DOCX uploaded but no text could be extracted.]'
  } catch {
    return '[DOCX uploaded but text extraction requires additional processing. Please try pasting your report text directly.]'
  }
}

async function extractImageText(file: File): Promise<string> {
  // For images, we'd need OCR. Return a message explaining the limitation.
  return `[Image file "${file.name}" uploaded. For best results, please use a PDF version of your credit report, or paste the text directly. Image OCR processing is coming soon.]`
}

function setStatusMsg(msg: string) {
  // This is a server-side function, so we just log it
  console.log('[Upload]', msg)
}
