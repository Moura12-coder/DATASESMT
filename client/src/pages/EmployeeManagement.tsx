import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Search, Download } from 'lucide-react';

interface Employee {
  id: number;
  name: string;
  cpf: string;
  department: string;
  position: string;
  admissionDate: string;
  status: 'Ativo' | 'Afastado' | 'Inativo';
  ghe: string;
  examStatus: 'Atualizado' | 'Vencido' | 'Pendente';
  trainingStatus: 'Em Dia' | 'Atrasado';
}

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: 1,
      name: 'João Silva',
      cpf: '123.456.789-00',
      department: 'Produção',
      position: 'Operador de Máquina',
      admissionDate: '2020-01-15',
      status: 'Ativo',
      ghe: 'GHE-001',
      examStatus: 'Atualizado',
      trainingStatus: 'Em Dia',
    },
    {
      id: 2,
      name: 'Maria Santos',
      cpf: '987.654.321-00',
      department: 'Administrativo',
      position: 'Assistente Administrativo',
      admissionDate: '2021-03-20',
      status: 'Ativo',
      ghe: 'GHE-002',
      examStatus: 'Pendente',
      trainingStatus: 'Atrasado',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.cpf.includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo':
        return 'bg-green-100 text-green-800';
      case 'Afastado':
        return 'bg-yellow-100 text-yellow-800';
      case 'Inativo':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getExamStatusColor = (status: string) => {
    switch (status) {
      case 'Atualizado':
        return 'bg-green-100 text-green-800';
      case 'Vencido':
        return 'bg-red-100 text-red-800';
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Funcionários</h1>
          <p className="text-gray-600 mt-1">Cadastro e gerenciamento de colaboradores</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Novo Funcionário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Funcionário</DialogTitle>
                <DialogDescription>Preencha os dados do novo colaborador</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Nome completo" />
                <Input placeholder="CPF" />
                <Input placeholder="Departamento" />
                <Input placeholder="Cargo" />
                <Button className="w-full">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou CPF..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">Filtros</Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Funcionários</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{employees.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{employees.filter((e) => e.status === 'Ativo').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Exames Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{employees.filter((e) => e.examStatus === 'Pendente').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Treinamentos Atrasados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{employees.filter((e) => e.trainingStatus === 'Atrasado').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Funcionários</CardTitle>
          <CardDescription>Clique em um funcionário para editar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Exame</TableHead>
                  <TableHead>Treinamento</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.cpf}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(employee.status)}>{employee.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getExamStatusColor(employee.examStatus)}>{employee.examStatus}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={employee.trainingStatus === 'Em Dia' ? 'default' : 'destructive'}>
                        {employee.trainingStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Employee Details */}
      <Card>
        <CardHeader>
          <CardTitle>Documentação Obrigatória</CardTitle>
          <CardDescription>Checklist de conformidade por funcionário</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {['ASO Atualizado', 'Treinamento NR-06 (EPI)', 'Treinamento NR-10 (Eletricidade)', 'Avaliação de Risco'].map(
              (item) => (
                <div key={item} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <input type="checkbox" className="w-4 h-4" defaultChecked />
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
