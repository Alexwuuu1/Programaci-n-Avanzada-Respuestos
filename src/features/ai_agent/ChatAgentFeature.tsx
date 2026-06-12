import React, { useState, useEffect, useRef } from "react";
import { Bot, Send, Trash2, Cpu, Sparkles, Database, ChevronDown, ChevronUp, MessageSquare, Terminal, HelpCircle } from "lucide-react";
import { toast } from "../../components/ui/Toast";

export interface Message {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: Date;
}

export interface WorkflowOption {
  id: string;
  label: string;
  description: string;
  examples: string[];
}

const WORKFLOW_OPTIONS: WorkflowOption[] = [
  {
    id: "general",
    label: "Orquestador General",
    description: "Preguntas libres del ERP: stock, ventas, clientes, compras, etc.",
    examples: [
      "¿Qué productos están en stock crítico hoy?",
      "Dime un resumen de las ventas de hoy y métodos de pago",
      "¿Quiénes son nuestros clientes VIP o frecuentes?"
    ],
  },
  {
    id: "inventory",
    label: "Inventario y Almacén",
    description: "Stock, precios, ubicaciones de repuestos y marcas",
    examples: [
      "¿Dónde está ubicado el repuesto con OEM de Hilux?",
      "¿Cuántos amortiguadores Monroe tenemos disponibles?",
      "Busca pastillas de freno en la base de datos"
    ],
  },
  {
    id: "sales",
    label: "Ventas y Caja",
    description: "Historial de ventas, boletas e ingresos de caja",
    examples: [
      "¿Cuáles son las últimas ventas registradas hoy?",
      "¿Cuál es el saldo total de caja actual?",
      "¿Cuánto se ha descontado en total hoy?"
    ],
  },
  {
    id: "clients",
    label: "Clientes (CRM)",
    description: "CRM, deudas, vehículos y fidelidad de clientes",
    examples: [
      "¿Qué clientes tienen deudas o cuentas por cobrar?",
      "Busca clientes de tipo taller mecánico",
      "Detalle de fidelidad de los clientes nuevos"
    ],
  },
  {
    id: "purchases",
    label: "Compras y Proveedores",
    description: "Órdenes de compra, recepciones y marcas asociadas",
    examples: [
      "¿Qué pedidos de proveedores están pendientes de recibir?",
      "Lista de proveedores activos con mejor calificación",
      "¿Cuáles compras se recibieron esta semana?"
    ],
  },
  {
    id: "production",
    label: "Producción",
    description: "Órdenes de producción, lotes y operarios a cargo",
    examples: [
      "¿Qué órdenes de producción están activas en planta?",
      "Lotes finalizados ordenados por fecha",
      "Lista de órdenes de producción de alta prioridad"
    ],
  },
  {
    id: "employees",
    label: "Empleados y Roles",
    description: "Personal de la empresa, turnos y cargos",
    examples: [
      "Lista de empleados activos con su cargo y turno",
      "¿Cuál es el turno asignado a los operarios?",
      "Resumen de salarios y notas de personal"
    ],
  },
];

export const ChatAgentFeature: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTopicId, setActiveTopicId] = useState(() => localStorage.getItem("ai_active_topic") || "general");
  const [n8nUrl, setN8nUrl] = useState(() => localStorage.getItem("ai_n8n_url") || "/api/telegram/chat-agent");
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTopic = WORKFLOW_OPTIONS.find((t) => t.id === activeTopicId) || WORKFLOW_OPTIONS[0];

  // Cargar historial de chat inicial
  useEffect(() => {
    const saved = localStorage.getItem("ai_chat_history_unified");
    if (saved) {
      try {
        setMessages(JSON.parse(saved).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
      } catch (e) {
        localStorage.removeItem("ai_chat_history_unified");
      }
    } else {
      setMessages([
        {
          id: "welcome",
          sender: "agent",
          text: "¡Hola! Soy tu **Asistente Virtual con IA**. Estoy conectado en tiempo real con la base de datos de **Repuestos La Paz**.\n\nPuedo ayudarte a buscar repuestos, comprobar stock, analizar ventas, revisar compras, gestionar clientes y mucho más en lenguaje natural. ¿Qué te gustaría consultar hoy?",
          timestamp: new Date()
        }
      ]);
    }
  }, []);

  // Guardar historial unificado
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("ai_chat_history_unified", JSON.stringify(messages));
    }
  }, [messages]);

  // Guardar configuración
  useEffect(() => {
    localStorage.setItem("ai_active_topic", activeTopicId);
    localStorage.setItem("ai_n8n_url", n8nUrl);
  }, [activeTopicId, n8nUrl]);

  // Auto-scroll al final del chat
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
      // Petición al endpoint intermedio del backend para evitar problemas de CORS
      const response = await fetch(n8nUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatInput: userMsg.text,
          sessionId: "web-session-general",
          module: activeTopicId
        }),
      });

      if (!response.ok) {
        throw new Error(`Error de conexión (Código ${response.status}): ${response.statusText}`);
      }

      const data = await response.json() as unknown;
      
      let replyText = "";
      if (data && typeof data === "object") {
        const obj = data as Record<string, unknown>;
        if (typeof obj.output === "string") {
          replyText = obj.output;
        } else if (typeof obj.response === "string") {
          replyText = obj.response;
        } else if (Array.isArray(data) && data[0] && typeof (data[0] as Record<string, unknown>).output === "string") {
          replyText = (data[0] as Record<string, unknown>).output as string;
        } else {
          replyText = JSON.stringify(data);
        }
      } else if (typeof data === "string") {
        replyText = data;
      } else {
        replyText = "El agente no devolvió ninguna respuesta estructurada.";
      }

      const agentMsg: Message = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: replyText,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al comunicarse con el orquestador.");
      
      setMessages((prev) => [...prev, {
        id: `agent-error-${Date.now()}`,
        sender: "agent",
        text: `⚠️ **Error de Conexión:** No se pudo establecer contacto con el agente de IA en \`${n8nUrl}\`.\n\nPor favor, verifica lo siguiente:\n1. Que el servidor de **n8n** esté activo y el webhook expuesto.\n2. Revisa que el backend del ERP esté corriendo correctamente.\n3. Si estás usando n8n localmente, comprueba el flujo de trabajo del enrutador.`,
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (!confirm("¿Deseas vaciar el historial de conversación con el agente?")) return;
    localStorage.removeItem("ai_chat_history_unified");
    setMessages([
      {
        id: "welcome",
        sender: "agent",
        text: "Historial limpiado. ¿Qué te gustaría consultar hoy?",
        timestamp: new Date()
      }
    ]);
  };

  const handleSuggestionClick = (example: string) => {
    setInputText(example);
    inputRef.current?.focus();
  };

  // Formateador simple de markdown
  const parseMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        const cells = line.split("|").map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
        if (cells.every(c => c.startsWith("-"))) return null;
        return (
          <div key={idx} className="flex border-b border-border/40 py-1 font-mono text-[10px] md:text-xs">
            {cells.map((cell, cIdx) => (
              <span key={cIdx} className="flex-1 px-1.5 truncate border-r border-border/10 last:border-0 font-semibold">{cell}</span>
            ))}
          </div>
        );
      }

      let content: React.ReactNode = line;
      const isBullet = line.trim().startsWith("-") || line.trim().startsWith("*");
      const cleanLine = isBullet ? line.trim().substring(1).trim() : line;

      if (cleanLine.includes("**")) {
        const parts = cleanLine.split("**");
        content = parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-primary font-extrabold">{part}</strong> : part);
      }

      if (cleanLine.includes("`")) {
        const parts = (cleanLine as string).split("`");
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
    <div className="p-6 space-y-6 flex flex-col h-[calc(100vh-20px)] bg-zinc-950/20">
      {/* Cabecera del Agente */}
      <div className="border-b border-border/80 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground flex items-center gap-3 tracking-tight">
            <Bot className="h-8 w-8 text-cyan-400 animate-pulse drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
            Asistente General con IA
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            Consúltame sobre stock, ubicaciones, finanzas, clientes o compras en lenguaje natural.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] uppercase font-bold text-cyan-400">
            <Database className="h-3.5 w-3.5" />
            Conectado a PostgreSQL
          </div>
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Limpiar chat"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Vaciar Chat
          </button>
        </div>
      </div>

      {/* Configuración Avanzada (Oculta por defecto) */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 shrink-0">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
        >
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-cyan-500" />
            <span>Configuración Avanzada del Agente</span>
          </div>
          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showAdvanced && (
          <div className="mt-3 pt-3 border-t border-zinc-800 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="text-left w-full md:w-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Ruta del Webhook / API Proxy</span>
              <span className="text-[11px] font-mono text-zinc-400">Las consultas se intermediarán por esta ruta local</span>
            </div>
            <input
              type="text"
              value={n8nUrl}
              onChange={(e) => setN8nUrl(e.target.value)}
              className="flex-1 max-w-xl w-full rounded bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:border-cyan-500"
              placeholder="/api/telegram/chat-agent"
            />
          </div>
        )}
      </div>

      {/* Cuerpo Principal del Chat y Sugerencias */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
        
        {/* Panel de Chat Principal */}
        <div className="flex-1 min-h-0 bg-zinc-900/40 rounded-2xl border border-zinc-800/80 p-4 flex flex-col justify-between overflow-hidden shadow-inner relative">
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
                      ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-400"
                      : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                  }`}
                >
                  {msg.sender === "user" ? <Sparkles className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div
                  className={`p-3.5 rounded-2xl border ${
                    msg.sender === "user"
                      ? "bg-cyan-950/10 border-cyan-500/10 rounded-tr-none text-foreground"
                      : "bg-zinc-900/80 border-zinc-800 rounded-tl-none text-foreground shadow-lg"
                  }`}
                >
                  <div className="space-y-1.5 select-text">
                    {parseMarkdown(msg.text)}
                  </div>
                  <span className="block text-[8px] text-muted-foreground/60 mt-2 text-right font-mono font-medium">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-start gap-3 max-w-[80%] mr-auto">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 animate-pulse">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl rounded-tl-none text-foreground shadow-sm flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  <span className="text-[10px] text-muted-foreground font-mono uppercase font-bold tracking-wider ml-1">Orquestando datos...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Caja de Input de Texto */}
          <form onSubmit={handleSendMessage} className="border-t border-zinc-800/60 pt-4 flex gap-2.5 shrink-0">
            <input
              type="text"
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={loading}
              placeholder="Escribe tu consulta en lenguaje natural al Asistente..."
              className="flex-1 rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-xs md:text-sm text-foreground focus:outline-none focus:border-cyan-500 disabled:opacity-50 transition-all font-medium"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="bg-cyan-500 hover:bg-cyan-600 text-zinc-950 px-5 rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50 transition-all active:scale-[0.96] flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/10"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Consultar</span>
            </button>
          </form>
        </div>

        {/* Panel Lateral: Atajos de Consulta y Categorías */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 border-b border-zinc-800 pb-2">
                <Terminal className="h-4 w-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider">Atajos de Consulta</h2>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Selecciona una sección del ERP para explorar y cargar ejemplos sugeridos de consultas con lenguaje natural:
              </p>

              {/* Lista de Categorías */}
              <div className="space-y-1.5 max-h-56 lg:max-h-none overflow-y-auto pr-1">
                {WORKFLOW_OPTIONS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTopicId(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left border transition-all hover:scale-[1.01] active:scale-[0.99] ${
                      activeTopicId === item.id
                        ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-sm shadow-cyan-500/5"
                        : "bg-zinc-950 border-zinc-800 text-muted-foreground hover:border-zinc-700 hover:text-foreground"
                    }`}
                  >
                    <div>
                      <span className="text-[11px] font-bold tracking-tight block">{item.label}</span>
                      <span className="text-[9px] opacity-75 font-normal line-clamp-1 mt-0.5">{item.description}</span>
                    </div>
                    <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${activeTopicId === item.id ? "rotate-90 text-cyan-400" : "opacity-40"}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Ejemplos de la Categoría Activa */}
            <div className="border-t border-zinc-800/80 pt-4 mt-4 space-y-2.5">
              <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
                <HelpCircle className="h-3 w-3 text-cyan-400" />
                Preguntas sugeridas ({activeTopic.label}):
              </span>
              <div className="space-y-2">
                {activeTopic.examples.map((example, eIdx) => (
                  <button
                    key={eIdx}
                    onClick={() => handleSuggestionClick(example)}
                    className="w-full text-left bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-cyan-500/30 p-2.5 rounded-lg text-[10px] text-zinc-300 hover:text-cyan-300 transition-all leading-snug cursor-pointer flex items-start gap-1.5 group active:scale-[0.98]"
                  >
                    <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5 group-hover:text-cyan-400 shrink-0" />
                    <span>{example}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
