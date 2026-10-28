/**
 * User Registration Page
 * Public page for new users to register
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function RegisterPage() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<"form" | "success">("form");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    companyName: "",
    cnpj: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const registerMutation = trpc.registration.register.useMutation({
    onSuccess: () => {
      toast.success("Registro realizado com sucesso!");
      setStep("success");
      setTimeout(() => navigate("/login"), 3000);
    },
    onError: error => {
      toast.error(error.message || "Erro ao registrar");
      setErrors({ submit: error.message || "Erro ao registrar usuário" });
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) newErrors.email = "Email é obrigatório";
    if (!formData.password) newErrors.password = "Senha é obrigatória";
    if (formData.password.length < 8)
      newErrors.password = "Senha deve ter pelo menos 8 caracteres";
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Senhas não conferem";
    }
    if (!formData.name) newErrors.name = "Nome é obrigatório";
    if (!formData.companyName)
      newErrors.companyName = "Nome da empresa é obrigatório";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    registerMutation.mutate({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      companyName: formData.companyName,
      cnpj: formData.cnpj || undefined,
      phone: formData.phone || undefined,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle>Registro Realizado com Sucesso!</CardTitle>
            <CardDescription>
              Seu registro foi recebido e está aguardando aprovação do
              administrador.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Entre em contato com o administrador para acompanhar a aprovação
              da sua conta.
            </p>
            <p className="text-xs text-gray-500">
              Redirecionando em alguns segundos...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Criar Conta</CardTitle>
          <CardDescription>
            Registre-se para acessar a plataforma DataSESMT Pro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.submit && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.submit}</AlertDescription>
              </Alert>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="João Silva"
                disabled={registerMutation.isPending}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="seu@email.com"
                disabled={registerMutation.isPending}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da Empresa *</Label>
              <Input
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="Sua Empresa LTDA"
                disabled={registerMutation.isPending}
              />
              {errors.companyName && (
                <p className="text-sm text-red-500">{errors.companyName}</p>
              )}
            </div>

            {/* CNPJ */}
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ (opcional)</Label>
              <Input
                id="cnpj"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleInputChange}
                placeholder="00.000.000/0000-00"
                disabled={registerMutation.isPending}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (opcional)</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="(11) 99999-9999"
                disabled={registerMutation.isPending}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                disabled={registerMutation.isPending}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                disabled={registerMutation.isPending}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Criar Conta"
              )}
            </Button>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-600">
              Já tem uma conta?{" "}
              <a href="/" className="text-blue-600 hover:underline">
                Fazer login
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
