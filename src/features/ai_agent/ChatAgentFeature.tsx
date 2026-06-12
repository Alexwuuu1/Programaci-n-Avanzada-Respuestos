import React, { useState, useEffect, useRef } from "react";
import { Bot, Send, Trash2, Cpu, Sparkles, Database } from "lucide-react";
import { toast } from "../../components/ui/Toast";

interface Message {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: Date;
}

const WORKFLOW_OPTIONS = [
  {
    id: "router",
    label: "Router",
    description: "Orquestador que elige automáticamente el agente correcto",
    url: "http://localhost:5678/webhook/repuestos-router",
    examples: ["Dónde está el filtro Hilux?", "Cómo está la caja?", "Dime ventas de hoy"],
  },
  {
    id: "inventory",
    label: "Inventario",
    description: "Stock, precios, ubicaciones, OEM y compatibilidad",
    url: "http://localhost:5678/webhook/repuestos-inventario",
    examples: ["¿Qué repuestos tenemos?", "Dónde está el filtro de aceite Hilux?", "Tienes bujía Bosch?"],
  },
  {
    id: "sales",
    label: "Ventas",
    description: "Ventas actuales, historial, boletas y métodos de pago",
    url: "http://localhost:5678/webhook/repuestos-ventas",
    examples: ["Dime nuestras ventas actuales", "Cuánto vendimos hoy?", "Últimas ventas registradas"],
  },
  {
    id: "finance",
    label: "Caja",
    description: "Caja, ingresos, egresos, utilidad y cuentas por cobrar",
    url: "http://localhost:5678/webhook/repuestos-finanzas",
    examples: ["Cómo está la caja?", "Cuáles son los egresos?", "Cuentas por cobrar"],
  },
  {
    id: "clients",
    label: "Clientes",
    description: "CRM, clientes premium, deudores y cartera",
    url: "http://localhost:5678/webhook/repuestos-clientes",
    examples: ["Clientes con deuda", "Clientes premium", "Resumen de CRM"],
  },
  {
    id: "purchases",
    label: "Compras",
    description: "Proveedores, pedidos pendientes y recepciones",
    url: "http://localhost:5678/webhook/repuestos-compras",
    examples: ["Compras pendientes", "Proveedores activos", "Pedidos recibidos"],
  },
  {
    id: "production",
    label: "Producción",
    description: "Órdenes, lotes, fábrica y responsables",
    url: "http://localhost:5678/webhook/repuestos-produccion",
    examples: ["Órdenes activas", "Producción pendiente", "Lotes finalizados"],
  },
  {
    id: "employees",
    label: "Empleados",
    description: "Personal, cargos, estado y operarios",
    url: "http://localhost:5678/webhook/repuestos-empleados",
    examples: ["Empleados activos", "Cargos del personal", "Resumen de empleados"],
  },
  {
    id: "users",
    label: "Usuarios",
    description: "Usuarios, roles, accesos y estado de cuentas",
    url: "http://localhost:5678/webhook/repuestos-usuarios",
    examples: ["Usuarios activos", "Roles del sistema", "Usuarios por rol"],
  },
  {
    id: "general",
    label: "Dashboard",
    description: "Estado general, KPIs y alertas del negocio",
    url: "http://localhost:5678/webhook/repuestos-chat-v2",
    examples: ["Estado general del sistema", "Cómo está el negocio?", "Resumen del dashboard"],
  },
];

const getWorkflowHistoryKey = (workflowId: string) => `ai_chat_history_${workflowId}`;

const parseStoredMessages = (saved: string | null): Message[] | null => {
  if (!saved) return null;
  try {
    return JSON.parse(saved).map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));
  } catch {
    return null;
  }
};

const createWorkflowWelcome = (workflowId: string): Message[] => {
  const workflow = WORKFLOW_OPTIONS.find((w) => w.id === workflowId) || WORKFLOW_OPTIONS[0];
  return [
    {
      id: `welcome-${workflow.id}`,
      sender: "agent",
      text: `Flujo activo: **${workflow.label}**.\n\nPuedes probar:\n- ${workflow.examples.join("\n- ")}`,
      timestamp: new Date(),
    },
  ];
};

export const ChatAgentFeature: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeWorkflowId, setActiveWorkflowId] = useState(() => localStorage.getItem("ai_active_workflow") || "inventory");
  const activeWorkflow = WORKFLOW_OPTIONS.find((w) => w.id === activeWorkflowId) || WORKFLOW_OPTIONS[0];
  const [n8nUrl, setN8nUrl] = useState(() => localStorage.getItem("ai_n8n_url") || activeWorkflow.url);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cargar historial de chat inicial
  useEffect(() => {
    const saved = localStorage.getItem("ai_chat_history");
    if (saved) {
      try {
        setMessages(JSON.parse(saved).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
      } catch (e) {
        localStorage.removeItem("ai_chat_history");
      }
    } else {
      // Mensaje de bienvenida inicial
      setMessages([
        {
          id: "welcome",
          sender: "agent",
          text: "¡Hola! Soy tu **Agente de Almacén Inteligente**. Puedo responder preguntas sobre el stock de repuestos, precios, OEM, ubicación en pasillos y marcas de inmediato leyendo la base de datos local. ¿En qué pieza o código estás interesado hoy?",
          timestamp: new Date()
        }
      ]);
    }
  }, []);

  // Guardar en localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("ai_chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(getWorkflowHistoryKey(activeWorkflowId), JSON.stringify(messages));
    }
  }, [activeWorkflowId, messages]);

  useEffect(() => {
    localStorage.setItem("ai_active_workflow", activeWorkflowId);
    localStorage.setItem("ai_n8n_url", n8nUrl);
  }, [activeWorkflowId, n8nUrl]);

  // Auto-scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: inputText.trim(),
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      // Petición al webhook del agente en n8n
      const response = await fetch(n8nUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatInput: userMsg.text,
          sessionId: `dashboard-${activeWorkflowId}`,
          module: activeWorkflowId
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo conectar con el Agente de n8n. Revisa si n8n está activo y si la URL del webhook es la correcta.");
      }

      const data = await response.json();
      
      // n8n Chat Trigger suele retornar { output: "texto" } o un array con { output: "texto" }
      let replyText = "";
      if (data && typeof data.output === "string") {
        replyText = data.output;
      } else if (Array.isArray(data) && data[0] && typeof data[0].output === "string") {
        replyText = data[0].output;
      } else if (data && typeof data.response === "string") {
        replyText = data.response;
      } else {
        replyText = typeof data === "string" ? data : JSON.stringify(data);
      }

      const agentMsg: Message = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: replyText || "El agente no devolvió ninguna respuesta estructurada.",
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al comunicarse con n8n.");
      
      setMessages((prev) => [...prev, {
        id: `agent-error-${Date.now()}`,
        sender: "agent",
        text: `⚠️ **Error de Conexión:** No se pudo establecer contacto con el webhook de n8n en \`${n8nUrl}\`.\n\nPor favor, verifica lo siguiente:\n1. Que tu servidor de **n8n** esté encendido y el flujo del agente activo.\n2. Si el flujo está en modo diseño en n8n, usa la URL de pruebas (*Test Webhook*).\n3. Revisa la consola o configuración de red.`,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (!confirm("¿Deseas vaciar el historial de conversación con el agente?")) return;
    localStorage.removeItem(getWorkflowHistoryKey(activeWorkflowId));
    setMessages([
      {
        id: "welcome",
        sender: "agent",
        text: `Historial limpiado. Flujo activo: **${activeWorkflow.label}**. ¿Qué quieres consultar?`,
        timestamp: new Date()
      }
    ]);
  };

  const handleWorkflowChange = (workflowId: string) => {
    const nextWorkflow = WORKFLOW_OPTIONS.find((w) => w.id === workflowId);
    if (!nextWorkflow) return;
    localStorage.setItem(getWorkflowHistoryKey(activeWorkflowId), JSON.stringify(messages));
    setActiveWorkflowId(nextWorkflow.id);
    setN8nUrl(nextWorkflow.url);
    const saved = parseStoredMessages(localStorage.getItem(getWorkflowHistoryKey(nextWorkflow.id)));
    setMessages(saved || createWorkflowWelcome(nextWorkflow.id));
  };

  // Formateador simple de markdown a elementos React
  const parseMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Tablas markdown simples
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        const cells = line.split("|").map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
        // Evitar líneas separadoras de tabla
        if (cells.every(c => c.startsWith("-"))) return null;
        return (
          <div key={idx} className="flex border-b border-border/40 py-1 font-mono text-[10px] md:text-xs">
            {cells.map((cell, cIdx) => (
              <span key={cIdx} className="flex-1 px-1.5 truncate border-r border-border/10 last:border-0 font-semibold">{cell}</span>
            ))}
          </div>
        );
      }

      // Reemplazo básico de **bold** y `code` en la línea
      let content: React.ReactNode = line;
      
      // Detectar viñeta
      const isBullet = line.trim().startsWith("-") || line.trim().startsWith("*");
      const cleanLine = isBullet ? line.trim().substring(1).trim() : line;

      // Buscar **
      if (cleanLine.includes("**")) {
        const parts = cleanLine.split("**");
        content = parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-primary font-extrabold">{part}</strong> : part);
      }

      // Buscar `
      if (cleanLine.includes("`")) {
        const parts = cleanLine.split("`");
        content = parts.map((part, pIdx) => pIdx % 2 === 1 ? <code key={pIdx} className="bg-background border border-border px-1 py-0.5 rounded font-mono text-cyan-400 text-xs">{part}</code> : part);
      }

      if (isBullet) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs md:text-sm text-foreground/90 my-0.5 leading-relaxed">
            {content}
          </li>
        );
      }

      return (
        <p key={idx} className="text-xs md:text-sm text-foreground/90 my-1 leading-relaxed">
          {content}
        </p>
      );
    });
  };

  return (
    <div className="p-6 space-y-6 flex flex-col h-[calc(100vh-20px)]">
      {/* Cabecera del Agente */}
      <div className="border-b border-border pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary animate-pulse" />
            Agente Inteligente de Almacén
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Asistente con IA que consulta stock crítico, ubicaciones y precios directamente en tu base de datos local.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-[10px] uppercase font-bold text-muted-foreground">
            <Database className="h-3.5 w-3.5 text-cyan-400" />
            Port: 3000
          </div>
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-wider transition-all"
            title="Limpiar chat"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Limpiar Chat
          </button>
        </div>
      </div>

      {/* Configuración del Endpoint n8n Webhook */}
      <div className="bg-card/75 border border-border/80 rounded-xl p-4 shrink-0 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Cpu className="h-5 w-5 text-primary" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Webhook de n8n (Chat Trigger)</span>
            <span className="text-[11px] font-mono text-foreground font-semibold">Configura el endpoint expuesto por n8n</span>
          </div>
        </div>
        <input
          type="text"
          value={n8nUrl}
          onChange={(e) => setN8nUrl(e.target.value)}
          className="flex-1 max-w-xl w-full rounded bg-input border border-border px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:border-primary"
          placeholder="http://localhost:5678/webhook/..."
        />
      </div>

      <div className="grid shrink-0 gap-2 md:grid-cols-2 xl:grid-cols-4">
        {WORKFLOW_OPTIONS.map((workflow) => (
          <button
            key={workflow.id}
            type="button"
            onClick={() => handleWorkflowChange(workflow.id)}
            className={`rounded-lg border p-3 text-left transition-all ${
              activeWorkflowId === workflow.id
                ? "border-primary bg-primary/10 text-foreground shadow-sm shadow-primary/10"
                : "border-border bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wider">{workflow.label}</span>
              <span className={`h-2 w-2 rounded-full ${activeWorkflowId === workflow.id ? "bg-primary" : "bg-muted-foreground/40"}`} />
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed">{workflow.description}</p>
          </button>
        ))}
      </div>

      {/* Ventana de Chat Principal */}
      <div className="flex-1 min-h-0 bg-card/45 rounded-2xl border border-border p-4 flex flex-col justify-between overflow-hidden shadow-inner relative group">
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 max-w-[85%] ${
                msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center border shrink-0 ${
                  msg.sender === "user"
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-cyan-500/20 border-cyan-400 text-cyan-400"
                }`}
              >
                {msg.sender === "user" ? <Sparkles className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div
                className={`p-3.5 rounded-2xl border ${
                  msg.sender === "user"
                    ? "bg-primary/10 border-primary/20 rounded-tr-none text-foreground"
                    : "bg-muted/30 border-border/60 rounded-tl-none text-foreground shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                }`}
              >
                <div className="space-y-1.5 select-text">
                  {parseMarkdown(msg.text)}
                </div>
                <span className="block text-[8px] text-muted-foreground/80 mt-2 text-right font-mono font-medium">
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-start gap-3 max-w-[80%] mr-auto">
              <div className="h-8 w-8 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-400 flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-4 bg-muted/20 border border-border/40 rounded-2xl rounded-tl-none text-foreground shadow-sm flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                <span className="text-[10px] text-muted-foreground font-mono uppercase font-bold tracking-wider ml-1">IA pensando...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <form onSubmit={handleSendMessage} className="border-t border-border/50 pt-4 flex gap-2.5 shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            placeholder={`Pregunta al flujo ${activeWorkflow.label}...`}
            className="flex-1 rounded-xl bg-input border border-border px-4 py-3 text-xs md:text-sm text-foreground focus:outline-none focus:border-primary disabled:opacity-50 transition-all font-semibold"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="bg-primary text-primary-foreground px-5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-accent disabled:opacity-50 transition-all active:scale-[0.96] flex items-center justify-center gap-1.5 shadow-lg shadow-primary/10"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
