import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ArrowLeft, ChevronUp, MessageSquare, Plus, Search, User, Trash2, Reply, Minus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { User as SupaUser } from "@supabase/supabase-js";

type Audience = "student" | "firm" | "institution";
type SortMode = "hot" | "new" | "top";

interface Question {
  id: string;
  user_id: string;
  title: string;
  body: string;
  audience: Audience;
  tags: string[];
  votes: number;
  created_at: string;
  profiles?: { display_name: string };
  answer_count?: number;
}

interface Answer {
  id: string;
  question_id: string;
  user_id: string;
  body: string;
  votes: number;
  is_top: boolean;
  created_at: string;
  parent_id: string | null;
  profiles?: { display_name: string };
}

interface AnswerNode extends Answer {
  children: AnswerNode[];
}

const AUDIENCE_LABELS: Record<string, string> = {
  all: "All",
  student: "Students",
  firm: "Firms",
  institution: "Institutions",
};

const TAG_OPTIONS = ["Contract", "Litigation", "IP", "Employment", "Compliance", "Tax", "M&A", "Real Estate", "Criminal", "Family"];

function buildTree(answers: Answer[]): AnswerNode[] {
  const map = new Map<string, AnswerNode>();
  answers.forEach((a) => map.set(a.id, { ...a, children: [] }));
  const roots: AnswerNode[] = [];
  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  // Sort children by votes desc
  const sortChildren = (nodes: AnswerNode[]) => {
    nodes.sort((a, b) => b.votes - a.votes);
    nodes.forEach((n) => sortChildren(n.children));
  };
  sortChildren(roots);
  return roots;
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// --- AnswerThread component ---
function AnswerThread({
  node, depth, opUserId, user, collapsedIds, toggleCollapse, replyingTo, setReplyingTo,
  replyBody, setReplyBody, onSubmitReply, onVote, onDelete, loading,
}: {
  node: AnswerNode;
  depth: number;
  opUserId: string;
  user: SupaUser | null;
  collapsedIds: Set<string>;
  toggleCollapse: (id: string) => void;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  replyBody: string;
  setReplyBody: (v: string) => void;
  onSubmitReply: (parentId: string) => void;
  onVote: (id: string, current: number) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}) {
  const isCollapsed = collapsedIds.has(node.id);
  const hasChildren = node.children.length > 0;
  const isOP = node.user_id === opUserId;
  const isOwner = user?.id === node.user_id;
  const effectiveDepth = Math.min(depth, 5);

  return (
    <div className={effectiveDepth > 0 ? "ml-4 border-l-2 border-accent/20 pl-3" : ""}>
      <div className="py-2">
        <div className="flex gap-2">
          {/* Collapse toggle */}
          <div className="flex flex-col items-center gap-0.5 min-w-[24px]">
            {hasChildren && (
              <button onClick={() => toggleCollapse(node.id)} className="text-muted-foreground hover:text-foreground text-xs font-mono">
                {isCollapsed ? "[+]" : "[-]"}
              </button>
            )}
            <button onClick={() => onVote(node.id, node.votes)} className="text-muted-foreground hover:text-accent">
              <ChevronUp size={14} />
            </button>
            <span className="text-xs font-bold text-foreground">{node.votes}</span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Author line */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <User size={10} />
              <span className="font-medium text-foreground">{node.profiles?.display_name || "Anon"}</span>
              {isOP && <Badge className="text-[9px] px-1 py-0 bg-accent text-accent-foreground">OP</Badge>}
              {node.is_top && <Badge className="text-[9px] px-1 py-0 bg-accent text-accent-foreground">Top</Badge>}
              <span>· {timeAgo(node.created_at)}</span>
            </div>

            <p className="text-sm text-foreground whitespace-pre-wrap">{node.body}</p>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-1.5">
              {user && (
                <button
                  onClick={() => setReplyingTo(replyingTo === node.id ? null : node.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent"
                >
                  <Reply size={12} /> Reply
                </button>
              )}
              {isOwner && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
                      <Trash2 size={12} /> Delete
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this answer?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Any replies underneath will also be removed. This can't be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(node.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {/* Inline reply box */}
            {replyingTo === node.id && (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Write a reply..."
                  className="min-h-[60px] text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => onSubmitReply(node.id)} disabled={loading || !replyBody.trim()}>
                    Post Reply
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {!isCollapsed && node.children.map((child) => (
        <AnswerThread
          key={child.id} node={child} depth={depth + 1} opUserId={opUserId}
          user={user} collapsedIds={collapsedIds} toggleCollapse={toggleCollapse}
          replyingTo={replyingTo} setReplyingTo={setReplyingTo}
          replyBody={replyBody} setReplyBody={setReplyBody}
          onSubmitReply={onSubmitReply} onVote={onVote} onDelete={onDelete} loading={loading}
        />
      ))}
    </div>
  );
}

// --- Main component ---
export default function TheBar() {
  const [user, setUser] = useState<SupaUser | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("hot");
  const [askOpen, setAskOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newAudience, setNewAudience] = useState<Audience>("student");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [answerBody, setAnswerBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [authReady, setAuthReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const [questionsLoaded, setQuestionsLoaded] = useState(false);

  const refreshQuestions = async () => {
    try {
      let data: any[] | null = null;
      const { data: joined, error } = await supabase
        .from("bar_questions")
        .select("*, profiles(display_name)")
        .order(sort === "new" ? "created_at" : "votes", { ascending: false });

      if (error) {
        const { data: plain, error: plainErr } = await supabase
          .from("bar_questions")
          .select("*")
          .order(sort === "new" ? "created_at" : "votes", { ascending: false });
        if (plainErr) { toast.error("Failed to load questions"); return; }
        data = plain;
      } else {
        data = joined;
      }

      const { data: countData } = await supabase.from("bar_answers").select("question_id");
      const counts: Record<string, number> = {};
      countData?.forEach((a: any) => { counts[a.question_id] = (counts[a.question_id] || 0) + 1; });

      setQuestions((data || []).map((q: any) => ({ ...q, answer_count: counts[q.id] || 0 })));
      setQuestionsLoaded(true);
    } catch (err) {
      toast.error("Failed to load questions");
      setQuestionsLoaded(true);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        let data: any[] | null = null;
        const { data: joined, error } = await supabase
          .from("bar_questions")
          .select("*, profiles(display_name)")
          .order(sort === "new" ? "created_at" : "votes", { ascending: false });

        if (error) {
          const { data: plain, error: plainErr } = await supabase
            .from("bar_questions")
            .select("*")
            .order(sort === "new" ? "created_at" : "votes", { ascending: false });
          if (plainErr) { if (!cancelled) toast.error("Failed to load questions"); return; }
          data = plain;
        } else {
          data = joined;
        }

        const { data: countData } = await supabase.from("bar_answers").select("question_id");
        const counts: Record<string, number> = {};
        countData?.forEach((a: any) => { counts[a.question_id] = (counts[a.question_id] || 0) + 1; });

        if (!cancelled) {
          setQuestions((data || []).map((q: any) => ({ ...q, answer_count: counts[q.id] || 0 })));
          setQuestionsLoaded(true);
        }
      } catch (err) {
        if (!cancelled) {
          toast.error("Failed to load questions");
          setQuestionsLoaded(true);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [sort]);

  const fetchAnswers = async (qId: string) => {
    try {
      const { data, error } = await supabase
        .from("bar_answers")
        .select("*, profiles(display_name)")
        .eq("question_id", qId)
        .order("is_top", { ascending: false })
        .order("votes", { ascending: false });
      if (error) {
        const { data: plain, error: plainErr } = await supabase
          .from("bar_answers")
          .select("*")
          .eq("question_id", qId)
          .order("is_top", { ascending: false })
          .order("votes", { ascending: false });
        if (plainErr) { toast.error("Failed to load answers"); return; }
        setAnswers(plain || []);
      } else {
        setAnswers(data || []);
      }
    } catch {
      toast.error("Failed to load answers");
    }
  };

  const openQuestion = (q: Question) => {
    setSelectedQuestion(q);
    fetchAnswers(q.id);
    setCollapsedIds(new Set());
    setReplyingTo(null);
    setReplyBody("");
  };

  const requireAuth = (action: () => void) => {
    if (!authReady) return; // session still loading
    if (!user) { navigate("/auth"); return; }
    action();
  };

  const submitQuestion = async () => {
    if (!user || !newTitle.trim() || !newBody.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("bar_questions").insert({
      user_id: user.id, title: newTitle.trim(), body: newBody.trim(), audience: newAudience, tags: newTags,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Question posted!");
      setAskOpen(false); setNewTitle(""); setNewBody(""); setNewTags([]);
      fetchQuestions();
    }
    setLoading(false);
  };

  const submitAnswer = async () => {
    if (!user || !selectedQuestion || !answerBody.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("bar_answers").insert({
      question_id: selectedQuestion.id, user_id: user.id, body: answerBody.trim(),
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Answer posted!"); setAnswerBody("");
      fetchAnswers(selectedQuestion.id); fetchQuestions();
    }
    setLoading(false);
  };

  const submitReply = async (parentId: string) => {
    if (!user || !selectedQuestion || !replyBody.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("bar_answers").insert({
      question_id: selectedQuestion.id, user_id: user.id, body: replyBody.trim(), parent_id: parentId,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Reply posted!"); setReplyBody(""); setReplyingTo(null);
      fetchAnswers(selectedQuestion.id); fetchQuestions();
    }
    setLoading(false);
  };

  const vote = async (table: "bar_questions" | "bar_answers", id: string, current: number) => {
    requireAuth(async () => {
      await supabase.from(table).update({ votes: current + 1 }).eq("id", id);
      if (table === "bar_questions") fetchQuestions();
      else if (selectedQuestion) fetchAnswers(selectedQuestion.id);
    });
  };

  const deleteQuestion = async (id: string) => {
    const { error } = await supabase.from("bar_questions").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Question deleted");
      setSelectedQuestion(null);
      fetchQuestions();
    }
  };

  const deleteAnswer = async (id: string) => {
    const { error } = await supabase.from("bar_answers").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Answer deleted");
      if (selectedQuestion) fetchAnswers(selectedQuestion.id);
      fetchQuestions();
    }
  };

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filtered = questions.filter((q) => {
    if (audienceFilter !== "all" && q.audience !== audienceFilter) return false;
    if (tagFilter && !q.tags.includes(tagFilter)) return false;
    if (search && !q.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const allTags = Array.from(new Set(questions.flatMap((q) => q.tags)));
  const answerTree = buildTree(answers);

  // Detail view
  if (selectedQuestion) {
    return (
      <section className="min-h-screen pt-24 pb-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <button onClick={() => setSelectedQuestion(null)} className="flex items-center gap-2 text-muted-foreground hover:text-accent mb-6 text-sm">
            <ArrowLeft size={16} /> Back to feed
          </button>

          <div className="border border-border rounded-lg p-6 bg-card mb-6">
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-1">
                <button onClick={() => vote("bar_questions", selectedQuestion.id, selectedQuestion.votes)} className="text-muted-foreground hover:text-accent">
                  <ChevronUp size={20} />
                </button>
                <span className="text-lg font-bold text-foreground">{selectedQuestion.votes}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h1 className="text-xl font-bold text-foreground font-heading mb-2">{selectedQuestion.title}</h1>
                  {user?.id === selectedQuestion.user_id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="text-muted-foreground hover:text-destructive shrink-0 mt-1">
                          <Trash2 size={16} />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this question?</AlertDialogTitle>
                          <AlertDialogDescription>
                            All answers will be permanently removed. This can't be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteQuestion(selectedQuestion.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">{selectedQuestion.body}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline" className="text-xs">{AUDIENCE_LABELS[selectedQuestion.audience]}</Badge>
                  {selectedQuestion.tags.map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <User size={12} /> {selectedQuestion.profiles?.display_name || "Anon"} · {timeAgo(selectedQuestion.created_at)}
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-bold text-foreground mb-4">{answers.length} Answer{answers.length !== 1 ? "s" : ""}</h2>

          {/* Threaded answers */}
          <div className="mb-8 space-y-1">
            {answerTree.map((node) => (
              <AnswerThread
                key={node.id} node={node} depth={0} opUserId={selectedQuestion.user_id}
                user={user} collapsedIds={collapsedIds} toggleCollapse={toggleCollapse}
                replyingTo={replyingTo} setReplyingTo={setReplyingTo}
                replyBody={replyBody} setReplyBody={setReplyBody}
                onSubmitReply={submitReply}
                onVote={(id, current) => vote("bar_answers", id, current)}
                onDelete={deleteAnswer} loading={loading}
              />
            ))}
          </div>

          {/* Top-level answer box */}
          {user ? (
            <div className="border border-border rounded-lg p-4 bg-card">
              <Label className="text-sm font-medium text-foreground">Your Answer</Label>
              <Textarea
                value={answerBody}
                onChange={(e) => setAnswerBody(e.target.value)}
                placeholder="Share your knowledge..."
                className="mt-2 min-h-[100px]"
              />
              <Button onClick={submitAnswer} disabled={loading || !answerBody.trim()} className="mt-3">
                Post Answer
              </Button>
            </div>
          ) : (
            <div className="text-center py-6 border border-border rounded-lg bg-card">
              <p className="text-muted-foreground text-sm mb-3">Sign in to answer this question</p>
              <Link to="/auth"><Button variant="outline">Sign In</Button></Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Feed view
  return (
    <section className="min-h-screen pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground font-heading">
              The B<span className="text-accent">a</span>r
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Ask. Answer. Argue. — The legal community board.</p>
          </div>
          <Dialog open={askOpen} onOpenChange={setAskOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => requireAuth(() => setAskOpen(true))} className="gap-2">
                <Plus size={16} /> Ask a Question
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading">Ask a Question</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="What's your question?" className="mt-1" />
                </div>
                <div>
                  <Label>Details</Label>
                  <Textarea value={newBody} onChange={(e) => setNewBody(e.target.value)} placeholder="Provide context..." className="mt-1 min-h-[100px]" />
                </div>
                <div>
                  <Label>Audience</Label>
                  <Select value={newAudience} onValueChange={(v) => setNewAudience(v as Audience)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Students</SelectItem>
                      <SelectItem value="firm">Firms</SelectItem>
                      <SelectItem value="institution">Institutions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {TAG_OPTIONS.map((t) => (
                      <Badge
                        key={t}
                        variant={newTags.includes(t) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => setNewTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])}
                      >
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button onClick={submitQuestion} disabled={loading || !newTitle.trim() || !newBody.trim()} className="w-full">
                  Post Question
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <aside className="w-full md:w-56 shrink-0 space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-wider">Audience</h3>
              <div className="space-y-1">
                {Object.entries(AUDIENCE_LABELS).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => setAudienceFilter(k)}
                    className={`block w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                      audienceFilter === k ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            {allTags.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 tracking-wider">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map((t) => (
                    <Badge
                      key={t}
                      variant={tagFilter === t ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => setTagFilter(tagFilter === t ? null : t)}
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {user && (
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Signed in as <span className="text-foreground font-medium">{user.email}</span>
                </p>
                <button
                  onClick={async () => { await supabase.auth.signOut(); toast.success("Signed out"); }}
                  className="text-xs text-accent hover:underline mt-1"
                >
                  Sign out
                </button>
              </div>
            )}
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions..." className="pl-9" />
              </div>
              <div className="flex gap-1">
                {(["hot", "new", "top"] as SortMode[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={`px-3 py-1.5 text-sm rounded font-medium capitalize transition-colors ${
                      sort === s ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <MessageSquare size={32} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">No questions yet. Be the first to ask!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => openQuestion(q)}
                    className="w-full text-left border border-border rounded-lg p-4 bg-card hover:border-accent/50 transition-colors group"
                  >
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-0.5 text-muted-foreground min-w-[40px]">
                        <ChevronUp size={14} />
                        <span className="text-sm font-bold text-foreground">{q.votes}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors text-sm line-clamp-2">
                          {q.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-[10px]">{AUDIENCE_LABELS[q.audience]}</Badge>
                          {q.tags.slice(0, 3).map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                          <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                            <MessageSquare size={12} /> {q.answer_count}
                          </span>
                          <span className="text-xs text-muted-foreground">{timeAgo(q.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
