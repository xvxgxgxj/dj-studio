"use client"

import { useState, useCallback } from "react"
import { Upload, X, FileAudio, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { createClient, requireSession } from "@/lib/supabase/client"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { isAudioFile, getFileExtension, getMimeType, formatFileSize } from "@/lib/utils"
import { MAX_FILE_SIZE, SUPPORTED_AUDIO_FORMATS, STORAGE_BUCKETS } from "@/lib/constants"

interface UploadDialogProps {
  open: boolean
  onClose: () => void
  onUploadComplete: () => void
}

let fileIdCounter = 0
function nextFileId() {
  return ++fileIdCounter
}

interface UploadFile {
  id: number
  file: File
  name: string
  progress: number
  status: "pending" | "uploading" | "done" | "error"
  error?: string
}

export function UploadDialog({ open, onClose, onUploadComplete }: UploadDialogProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles
      .filter((f) => isAudioFile(f.name))
      .map((file) => ({
        id: nextFileId(),
        file,
        name: file.name,
        progress: 0,
        status: "pending" as const,
      }))
    setUploadFiles((prev) => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": SUPPORTED_AUDIO_FORMATS.map((ext) => `.${ext}`),
    },
    maxSize: MAX_FILE_SIZE,
  })

  const removeFile = (id: number) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const updateFile = (id: number, update: Partial<UploadFile>) => {
    setUploadFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...update } : f)))
  }

  const uploadAll = async () => {
    setUploading(true)

    const session = await requireSession()
    if (!session) { setUploading(false); return }

    const { data: existing } = await supabase.from("users").select("id").eq("id", session.user.id).maybeSingle()
    if (!existing) {
      await supabase.from("users").insert({
        id: session.user.id,
        email: session.user.email || "",
        username: session.user.user_metadata?.username || session.user.email?.split("@")[0] || "مستخدم",
      })
    }

    const pending = uploadFiles.filter((f) => f.status === "pending")

    for (const file of pending) {
      const ext = getFileExtension(file.name)
      const filePath = `${session.user.id}/${crypto.randomUUID()}.${ext}`

      updateFile(file.id, { status: "uploading" })

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.SONGS)
        .upload(filePath, file.file, {
          contentType: getMimeType(ext),
          upsert: false,
          duplex: "half",
        })

      if (uploadError) {
        const msg = uploadError.message.includes("bucket")
          ? "حاوية التخزين غير موجودة. الرجاء إنشاء حاوية 'songs' في Supabase"
          : uploadError.message
        updateFile(file.id, { status: "error", error: msg })
        continue
      }

      const title = file.name.replace(`.${ext}`, "")

      const { data: { session: currentSession } } = await supabase.auth.getSession()
      const userId = currentSession?.user?.id
      if (!userId) {
        updateFile(file.id, { status: "error", error: "يجب تسجيل الدخول لرفع الأغاني" })
        continue
      }

      const songRecord = {
        user_id: userId,
        title,
        file_path: filePath,
        file_size: file.file.size,
        file_type: ext,
        duration: 0,
      }

      const { error: dbError } = await supabase.from("songs").insert(songRecord)

      if (dbError) {
        updateFile(file.id, { status: "error", error: dbError.message })
      } else {
        updateFile(file.id, { status: "done", progress: 100 })
      }
    }

    setUploading(false)
    onUploadComplete()
  }

  const handleClose = () => {
    if (!uploading) {
      setUploadFiles([])
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} title="رفع الأغاني" className="max-w-lg">
      <div className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
            isDragActive
              ? "border-blue-400 bg-blue-500/10"
              : "border-white/20 hover:border-white/40"
          }`}
        >
          <input {...getInputProps()} />
          <Upload size={32} className="mx-auto mb-3 text-white/40" />
          <p className="text-sm text-white/60">
            {isDragActive
              ? "أفلت الملفات هنا..."
              : "اسحب وأفلت الأغاني هنا، أو انقر للاختيار"}
          </p>
          <p className="text-xs text-white/30 mt-2">
            MP3, WAV, FLAC, M4A, AAC - حد أقصى 50MB
          </p>
        </div>

        {uploadFiles.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {uploadFiles.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
              >
                <FileAudio size={20} className="text-white/40 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{f.name}</p>
                  <p className="text-xs text-white/40">{formatFileSize(f.file.size)}</p>
                </div>
                {f.status === "uploading" && (
                  <Loader2 size={18} className="animate-spin text-blue-400" />
                )}
                {f.status === "done" && (
                  <CheckCircle size={18} className="text-green-400" />
                )}
                {f.status === "error" && (
                  <div className="flex items-center gap-1 text-red-400">
                    <AlertCircle size={18} />
                    <span className="text-xs">{f.error}</span>
                  </div>
                )}
                {f.status === "pending" && !uploading && (
                  <button
                    onClick={() => removeFile(f.id)}
                    className="text-white/30 hover:text-red-400"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {uploadFiles.length > 0 && (
          <Button
            onClick={uploadAll}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? "جاري الرفع..." : `رفع ${uploadFiles.length} أغنية`}
          </Button>
        )}
      </div>
    </Dialog>
  )
}
