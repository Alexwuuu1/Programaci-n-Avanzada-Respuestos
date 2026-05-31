import React, { useState } from "react";
import { Users, UserPlus, Phone, Briefcase } from "lucide-react";

import { useEffect } from "react";

interface Employee {
  id: number;
  name: string;
  phone: string;
  position: string;
  status: "Activo" | "Inactivo";
}

export const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [error, setError] = useState("");

  const fetchEmployees = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/empleados");
      if (!response.ok) throw new Error("Error al obtener la lista de empleados.");
      const data = await response.json();
      setEmployees(data);
    } catch (err: any) {
      setError(err.message || "Error al obtener empleados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim() || !newPosition.trim()) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    setError("");

    try {
      const response = await fetch("http://localhost:3000/api/empleados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          phone: newPhone.trim(),
          position: newPosition.trim(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Error al registrar el empleado.");
      }

      const createdEmp: Employee = await response.json();
      setEmployees([createdEmp, ...employees]);
      setNewName("");
      setNewPhone("");
      setNewPosition("");
    } catch (err: any) {
      setError(err.message || "Error de conexión.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-3xl font-bold text-foreground">Registro de Empleados</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Administración de fichas y cargos de personal en fábrica y administración.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Formulario Registro */}
        <div className="rounded-xl border border-border bg-card p-6 h-fit">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
            <UserPlus className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Registrar Empleado</h3>
          </div>

          <form onSubmit={handleAddEmployee} className="space-y-4">
            {error && <div className="text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">{error}</div>}

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Nombre Completo</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ej: Andrés Gómez"
                className="w-full rounded bg-input border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Teléfono</label>
              <div className="relative">
                <Phone className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="ej: 71234567"
                  className="w-full rounded bg-input border border-border pr-3 pl-9 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Cargo / Función</label>
              <div className="relative">
                <Briefcase className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  placeholder="ej: Operador de Fundición"
                  className="w-full rounded bg-input border border-border pr-3 pl-9 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-accent transition-all active:scale-[0.98]"
            >
              Registrar Personal
            </button>
          </form>
        </div>

        {/* Tabla Personal */}
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Fichas de Empleados</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="pb-3">Nombre</th>
                  <th className="pb-3">Cargo</th>
                  <th className="pb-3">Contacto</th>
                  <th className="pb-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground text-xs">
                      Cargando personal de la base de datos...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground text-xs">
                      No hay empleados registrados.
                    </td>
                  </tr>
                ) : (
                  employees.map((e) => (
                    <tr key={e.id} className="text-sm">
                      <td className="py-3 font-semibold text-foreground">{e.name}</td>
                      <td className="py-3 text-muted-foreground">{e.position}</td>
                      <td className="py-3 text-muted-foreground">{e.phone}</td>
                      <td className="py-3">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-500/10 border border-green-500/30 text-green-400">
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
