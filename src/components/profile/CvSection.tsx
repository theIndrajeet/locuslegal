import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Download, Loader2, FileText } from "lucide-react";

const CV_MAX_BYTES = 5 * 1024 * 1024;

interface Props {
  userId: string;
  cvUrl: string | null;
  cvUploadedAt: string | null;
  setCvUrl: (v: string | null) => void;
  setCvUploadedAt: (v: string | null) => void;
}

export default function CvSection({ userId, cvUrl, cvUploadedAt, setCvUrl, setCvUploadedAt }: Props) {
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = () => fileRef.current?.click();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") { toast.error("CV must be a PDF"); return; }
    if (file.size > CV_MAX_BYTES) { toast.error("CV must be 5 MB or smaller"); return; }

    setUploading(true);
    const path = `${userId}/cv.pdf`;
    const { error: upErr } = await supabase.storage.from("cvs").upload(path, file, { upsert: true, contentType: "application/pdf" });
    if (upErr) { setUploading(false); toast.error(upErr.message); return; }

    const uploadedAt = new Date().toISOString();
    const { error: updErr } = await supabase.from("profiles").update({ cv_url: path, cv_uploaded_at: uploadedAt }).eq("id", userId);
    setUploading(false);
    if (updErr) { toast.error(updErr.message); return; }
    setCvUrl(path);
    setCvUploadedAt(uploadedAt);
    toast.success("CV uploaded");
  };

  const download = async () => {
    if (!cvUrl) return;
    setDownloading(true);
    const { data, error } = await supabase.storage.from("cvs").createSignedUrl(cvUrl, 60);
    setDownloading(false);
    if (error || !data?.signedUrl) { toast.error(error?.message || "Couldn't generate download link"); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">CV</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleChange} />

        {cvUrl ? (
          <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card/50">
            <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">CV on file</p>
              {cvUploadedAt && (
                <p className="text-xs text-muted-foreground">Uploaded {new Date(cvUploadedAt).toLocaleString()}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={download} disabled={downloading}>
                  {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  <span className="ml-2">Download</span>
                </Button>
                <Button size="sm" onClick={pick} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span className="ml-2">Replace</span>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Upload your CV as a PDF (max 5 MB). Only you can access it.</p>
            <Button size="sm" onClick={pick} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              <span className="ml-2">Upload CV</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
