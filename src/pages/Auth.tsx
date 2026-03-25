import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Resolve email from username via DB function
        const { data: resolvedEmail, error: rpcError } = await supabase.rpc(
          "get_email_by_username",
          { p_username: username.trim() }
        );
        if (rpcError) throw rpcError;
        if (!resolvedEmail) {
          throw new Error("Username not found");
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: resolvedEmail,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/the-bar");
      } else {
        if (!username.trim() || /\s/.test(username)) {
          throw new Error("Username is required and cannot contain spaces");
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: username.trim() },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email in the signup form to reset your password");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent to your email.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-block mb-6">
            <span className="text-3xl font-extrabold font-heading">
              Loc<span className="text-accent">us</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground font-heading">
            {isLogin ? "Sign in to The Bar" : "Join The Bar"}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {isLogin
              ? "Welcome back, counselor."
              : "Create an account to ask & answer questions."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username — shown in both login and signup */}
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={isLogin ? "Your username" : "Choose a username (no spaces)"}
              className="mt-1"
            />
          </div>

          {/* Email — signup only */}
          {!isLogin && (
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1"
            />
          </div>

          {!isLogin && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs text-accent hover:underline"
            >
              Forgot password?
            </button>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-accent hover:underline font-medium"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
