/**
 * Professional Login Page - RSData Style
 * Exact match to RSData design with 50/50 split layout
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();
  const { refresh } = useAuth();

  const loginUrl = getLoginUrl();
  const loginMutation = trpc.auth.login.useMutation();

  const handleMausLogin = () => {
    window.location.href = loginUrl;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Validate inputs
      if (!email || !password) {
        setError("Email e senha são obrigatórios");
        return;
      }

      // Call the login mutation
      const response = await loginMutation.mutateAsync({
        email,
        password,
        rememberMe: rememberMe || false,
      });

      if (response.success) {
        toast.success("Login realizado com sucesso!");
        // Refresh auth state and redirect
        await refresh();
        setLocation("/app/dashboard");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao fazer login";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white">
      {/* LEFT SIDE - Background Image with Overlay (50%) */}
      <div
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://d2xsxph8kpxj0f.cloudfront.net/310519663664247459/TFxqQBo3WdqvWSTyiLDRQK/login-bg-professional-aKotjADqnRDNDLey448Vif.webp')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        {/* Dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/70 to-blue-950/50"></div>

        {/* Content on left side */}
        <div className="relative z-10 flex flex-col justify-between p-16 text-white h-full">
          {/* Logo and Tagline */}
          <div>
            <h1 className="text-7xl font-black mb-2 tracking-tighter">DataSESMT</h1>
            <p className="text-lg text-blue-50 font-medium mb-10">Inteligência estratégica em SST</p>
            <p className="text-gray-100 text-base leading-relaxed max-w-lg font-light">
              Plataforma enterprise para profissionais de Saúde e Segurança do Trabalho. Cobertura total das obrigações legais brasileiras com dashboards em tempo real.
            </p>
          </div>

          {/* Footer */}
          <div className="text-gray-400 text-xs space-y-1">
            <p className="font-semibold">© 2026 DataSESMT Pro</p>
            <p>Plataforma 100% Brasileira</p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Login Form (50%) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 lg:px-20 py-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile Header */}
          <div className="lg:hidden mb-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-1">DataSESMT</h1>
            <p className="text-gray-600 text-sm">Faça login na sua conta</p>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block mb-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-2xl">DS</span>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">DataSESMT</h2>
                <p className="text-blue-600 text-xs font-bold tracking-wide">Pro</p>
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-2">Bem-vindo</h3>
            <p className="text-gray-600 text-sm">Faça login na sua conta para continuar</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-800 font-bold text-xs uppercase tracking-wide">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loginMutation.isPending}
                className="h-12 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm bg-white placeholder:text-gray-400"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-800 font-bold text-xs uppercase tracking-wide">
                  Senha
                </Label>
                <a href="/forgot-password" className="text-blue-600 hover:text-blue-700 text-xs font-bold">
                  Esqueceu sua senha?
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loginMutation.isPending}
                  className="h-12 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm bg-white placeholder:text-gray-400 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loginMutation.isPending}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checkbox and reCAPTCHA */}
            <div className="space-y-4 my-6">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={loginMutation.isPending}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="remember" className="text-xs text-gray-700 cursor-pointer font-medium">
                  Manter-me conectado
                </label>
              </div>

              {/* reCAPTCHA Box */}
              <div className="border-2 border-gray-300 rounded-lg p-4 flex items-center space-x-3 bg-white hover:border-gray-400 transition">
                <Checkbox id="robot" disabled className="w-4 h-4 rounded" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">Não sou um robô</p>
                  <p className="text-xs text-gray-500">Proteção por reCAPTCHA</p>
                </div>
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-base rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending ? "Entrando..." : "ENTRAR"}
            </Button>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-gray-500 text-xs font-medium">ou</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleMausLogin}
                disabled={loginMutation.isPending}
                className="h-11 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm rounded-lg transition disabled:opacity-50"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleMausLogin}
                disabled={loginMutation.isPending}
                className="h-11 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm rounded-lg transition disabled:opacity-50"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
                Microsoft
              </Button>
            </div>
          </form>

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center space-y-3">
            <p className="text-xs text-gray-600">
              Não tem uma conta?{" "}
              <a href="#" className="text-blue-600 hover:text-blue-700 font-bold">
                Solicite acesso
              </a>
            </p>
            <div className="flex justify-center gap-3 text-xs text-gray-500">
              <a href="#" className="hover:text-gray-900 font-medium">
                Política de Privacidade
              </a>
              <span>•</span>
              <a href="#" className="hover:text-gray-900 font-medium">
                Termos de Uso
              </a>
              <span>•</span>
              <a href="#" className="hover:text-gray-900 font-medium">
                Suporte
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
