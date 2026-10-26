import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  Car,
  DollarSign,
  AlertCircle,
  Sparkles,
  MessageSquare,
  FileSpreadsheet,
  HelpCircle,
  Send,
  Eye,
  ExternalLink
} from 'lucide-react';

interface CoberturasObligatorias {
  colision: boolean;
  robo: boolean;
  asistenciaVial: boolean;
  fenomenosNaturales: boolean;
  vehiculoSustituto: boolean;
}

interface ClientProfile {
  nombre: string;
  vehiculoUso: string;
  presupuestoMaximo: number;
  coberturasObligatorias: CoberturasObligatorias;
  prioridades: string;
  formaPago: string;
}

interface ProposalFile {
  id: string;
  name: string;
  base64: string;
  size?: number;
  isSample?: boolean;
}

interface AnalyzedProposal {
  aseguradora: string;
  plan: string;
  primaAnual: string;
  primaAnualMonto: number;
  cabeEnPresupuesto: 'Sí' | 'No';
  deducibleColision: string;
  deducibleRobo: string;
  rcDanosTerceros: string;
  rcLesiones: string;
  asistenciaVial: string;
  grua: string;
  vehiculoSustituto: string;
  fenomenosNaturales: string;
  roturaCristales: string;
  exclusionesDestacadas: string;
  cumpleObligatorias: 'Sí' | 'No';
  coberturasFaltantes?: string[];
  semaforo: 'verde' | 'amarillo' | 'rojo';
  semaforoMotivo?: string;
}

interface ComparisonResult {
  proposals: AnalyzedProposal[];
  recomendacionPreliminar: string;
  mensajeWhatsApp: string;
}

export default function App() {
  // Client profile state
  const [profile, setProfile] = useState<ClientProfile>({
    nombre: 'Laura Solís Vargas',
    vehiculoUso: 'Toyota Corolla XEi 2022, Particular',
    presupuestoMaximo: 400000,
    coberturasObligatorias: {
      colision: true,
      robo: true,
      asistenciaVial: true,
      fenomenosNaturales: true,
      vehiculoSustituto: true,
    },
    prioridades: 'Valora que la asistencia vial sea completa, buen deducible y protección ante inundaciones.',
    formaPago: 'Anual de contado',
  });

  // Proposals state (1 to 3 PDFs)
  const [proposals, setProposals] = useState<ProposalFile[]>([]);
  const [availableSamples, setAvailableSamples] = useState<any[]>([]);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  // Load available sample proposals on mount
  useEffect(() => {
    fetchSamples();
  }, []);

  const fetchSamples = async () => {
    try {
      setIsLoadingSamples(true);
      const res = await fetch('/api/sample-proposals');
      const data = await res.json();
      if (data.success && data.samples) {
        setAvailableSamples(data.samples);
      }
    } catch (err) {
      console.warn('Could not load samples list:', err);
    } finally {
      setIsLoadingSamples(false);
    }
  };

  const handleLoadAllSamples = () => {
    if (availableSamples.length === 0) return;
    const loaded: ProposalFile[] = availableSamples.slice(0, 3).map((s) => ({
      id: s.id,
      name: s.name,
      base64: s.base64,
      isSample: true,
    }));
    setProposals(loaded);
    setErrorMsg(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (proposals.length + files.length > 3) {
      setErrorMsg('Puede cargar un máximo de 3 propuestas (una por aseguradora).');
      return;
    }

    Array.from(files).forEach((file) => {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setErrorMsg(`El archivo ${file.name} no es un PDF válido.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setProposals((prev) => {
          if (prev.length >= 3) return prev;
          return [
            ...prev,
            {
              id: `${Date.now()}-${Math.random()}`,
              name: file.name,
              base64,
              size: file.size,
              isSample: false,
            },
          ];
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
    setErrorMsg(null);
  };

  const handleRemoveProposal = (id: string) => {
    setProposals((prev) => prev.filter((p) => p.id !== id));
  };

  const handleCompare = async () => {
    if (proposals.length === 0) {
      setErrorMsg('Por favor cargue entre 1 y 3 archivos PDF de propuestas para comparar.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientProfile: profile,
          proposals: proposals.map((p) => ({
            name: p.name,
            base64: p.base64,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Ocurrió un error al procesar las propuestas con Gemini.');
      }

      setResult(data.data);
      // Smooth scroll down to result
      setTimeout(() => {
        const resultSection = document.getElementById('seccion-resultado');
        if (resultSection) {
          resultSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al conectar con el servidor.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyMessage = () => {
    if (!result?.mensajeWhatsApp) return;
    navigator.clipboard.writeText(result.mensajeWhatsApp);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 3000);
  };

  const handleNewComparison = () => {
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatColones = (num: number) => {
    return '₡ ' + Number(num || 0).toLocaleString('es-CR');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Header Institucional */}
      <header className="bg-[#002B49] text-white shadow-lg border-b-4 border-[#009A44]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="bg-white/10 p-3 rounded-xl border border-white/20 shadow-inner flex items-center justify-center">
                <ShieldCheck className="w-9 h-9 text-[#68D391]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-semibold bg-[#009A44] text-white px-2 py-0.5 rounded">
                    Banco de Colombia
                  </span>
                  <span className="text-xs text-slate-300 font-medium">Corredora de Seguros</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
                  Comparador de Propuestas Banco de Colombia
                </h1>
                <p className="text-sm sm:text-base text-slate-200 mt-1 font-normal">
                  Compara propuestas de seguro de automóvil en minutos. La IA prepara, el asesor decide.
                </p>
              </div>
            </div>

            <div className="text-right hidden md:block">
              <div className="text-xs text-slate-300">Asistencia al Asesor</div>
              <div className="text-sm font-semibold text-emerald-400 flex items-center justify-end gap-1.5 mt-0.5">
                <Sparkles className="w-4 h-4" /> Gemini 3.8 Multimodal PDF
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-8">
        {/* Error notification banner if any */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-800 shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Atención</p>
              <p className="text-sm">{errorMsg}</p>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-rose-500 hover:text-rose-700 text-sm font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* SECCIÓN 1: PROPUESTAS (PDFs) */}
          <section className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#002B49] text-white font-bold text-sm">
                    1
                  </span>
                  <h2 className="text-lg font-bold text-[#002B49]">Propuestas (PDF)</h2>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                  {proposals.length} de 3 cargadas
                </span>
              </div>

              <p className="text-xs text-slate-500 mb-4">
                Sube de 1 a 3 archivos PDF con las ofertas de las aseguradoras (una propuesta por aseguradora).
              </p>

              {/* Botón rápido para cargar propuestas de prueba del ejercicio */}
              {availableSamples.length > 0 && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-emerald-900">
                        ¿Deseas usar las 3 cotizaciones de prueba?
                      </p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Cordillera, Alborada y Protectora del Valle
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLoadAllSamples}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
                    >
                      Cargar ejemplos
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Dropzone */}
              <label
                className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center cursor-pointer transition ${
                  proposals.length >= 3
                    ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
                    : 'border-slate-300 hover:border-[#002B49] hover:bg-slate-50'
                }`}
              >
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm font-semibold text-slate-700">
                  {proposals.length >= 3 ? 'Límite de 3 archivos alcanzado' : 'Subir archivo PDF'}
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Arrastra o haz clic para seleccionar (PDF)
                </span>
                <input
                  type="file"
                  accept="application/pdf"
                  multiple
                  disabled={proposals.length >= 3}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Lista de archivos cargados */}
              <div className="mt-4 space-y-2.5">
                {proposals.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-3 italic">
                    No has cargado ninguna propuesta todavía.
                  </p>
                ) : (
                  proposals.map((prop, idx) => (
                    <div
                      key={prop.id}
                      className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate" title={prop.name}>
                            {idx + 1}. {prop.name}
                          </p>
                          <span className="text-[10px] text-slate-500">
                            {prop.isSample ? 'Archivo de prueba del sistema' : 'Archivo local adjunto'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveProposal(prop.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                        title="Eliminar propuesta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Máximo: 3 propuestas</span>
              <span>Formato: PDF oficial</span>
            </div>
          </section>

          {/* SECCIÓN 2: PERFIL DEL CLIENTE */}
          <section className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#002B49] text-white font-bold text-sm">
                  2
                </span>
                <h2 className="text-lg font-bold text-[#002B49]">Perfil del Cliente</h2>
              </div>
              <button
                type="button"
                onClick={() =>
                  setProfile({
                    nombre: 'Laura Solís Vargas',
                    vehiculoUso: 'Toyota Corolla XEi 2022, Particular',
                    presupuestoMaximo: 400000,
                    coberturasObligatorias: {
                      colision: true,
                      robo: true,
                      asistenciaVial: true,
                      fenomenosNaturales: true,
                      vehiculoSustituto: true,
                    },
                    prioridades:
                      'Valora que la asistencia vial sea completa, buen deducible y protección ante inundaciones.',
                    formaPago: 'Anual de contado',
                  })
                }
                className="text-xs text-[#002B49] hover:underline font-semibold"
              >
                Restablecer datos de ejemplo
              </button>
            </div>

            <div className="space-y-4">
              {/* Nombre & Vehículo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nombre del Cliente
                  </label>
                  <input
                    type="text"
                    value={profile.nombre}
                    onChange={(e) => setProfile({ ...profile, nombre: e.target.value })}
                    placeholder="Ej. Laura Solís Vargas"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#002B49] focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Vehículo y Uso
                  </label>
                  <input
                    type="text"
                    value={profile.vehiculoUso}
                    onChange={(e) => setProfile({ ...profile, vehiculoUso: e.target.value })}
                    placeholder="Ej. Toyota Corolla XEi 2022, Particular"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#002B49] focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Presupuesto & Forma de Pago */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Presupuesto Máximo Anual (Colones)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                      ₡
                    </span>
                    <input
                      type="number"
                      step="5000"
                      min="0"
                      value={profile.presupuestoMaximo || ''}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          presupuestoMaximo: Number(e.target.value),
                        })
                      }
                      placeholder="400000"
                      className="w-full text-sm pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#002B49] focus:border-transparent transition font-medium"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    {formatColones(profile.presupuestoMaximo)} al año
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Forma de Pago Preferida
                  </label>
                  <select
                    value={profile.formaPago}
                    onChange={(e) => setProfile({ ...profile, formaPago: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#002B49] focus:border-transparent transition bg-white"
                  >
                    <option value="Anual de contado">Anual de contado</option>
                    <option value="Semestral">Semestral (2 cuotas)</option>
                    <option value="Mensual">Mensual (12 cuotas)</option>
                    <option value="Deducción de planilla o débito automático">Deducción de planilla / Débito</option>
                  </select>
                </div>
              </div>

              {/* Coberturas obligatorias */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Coberturas Obligatorias (Exigidas por el cliente)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={profile.coberturasObligatorias.colision}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          coberturasObligatorias: {
                            ...profile.coberturasObligatorias,
                            colision: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 text-[#002B49] rounded border-slate-300 focus:ring-[#002B49]"
                    />
                    <span>Colisión y vuelco</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={profile.coberturasObligatorias.robo}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          coberturasObligatorias: {
                            ...profile.coberturasObligatorias,
                            robo: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 text-[#002B49] rounded border-slate-300 focus:ring-[#002B49]"
                    />
                    <span>Robo total y parcial</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={profile.coberturasObligatorias.asistenciaVial}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          coberturasObligatorias: {
                            ...profile.coberturasObligatorias,
                            asistenciaVial: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 text-[#002B49] rounded border-slate-300 focus:ring-[#002B49]"
                    />
                    <span>Asistencia vial 24/7</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={profile.coberturasObligatorias.fenomenosNaturales}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          coberturasObligatorias: {
                            ...profile.coberturasObligatorias,
                            fenomenosNaturales: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 text-[#002B49] rounded border-slate-300 focus:ring-[#002B49]"
                    />
                    <span>Fenómenos naturales</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={profile.coberturasObligatorias.vehiculoSustituto}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          coberturasObligatorias: {
                            ...profile.coberturasObligatorias,
                            vehiculoSustituto: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 text-[#002B49] rounded border-slate-300 focus:ring-[#002B49]"
                    />
                    <span>Vehículo sustituto</span>
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 italic">
                  * La regla valida que estén formalmente incluidas en la prima base sin costo adicional.
                </p>
              </div>

              {/* Prioridades */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Prioridades del Cliente
                </label>
                <textarea
                  rows={2}
                  value={profile.prioridades}
                  onChange={(e) => setProfile({ ...profile, prioridades: e.target.value })}
                  placeholder="Detalla lo que más le interesa al cliente (ej. deducibles bajos, cobertura ante inundaciones, grúa sin límite)..."
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#002B49] focus:border-transparent transition"
                />
              </div>
            </div>
          </section>
        </div>

        {/* BOTÓN GRANDE: COMPARAR PROPUESTAS */}
        <div className="flex flex-col items-center justify-center pt-2">
          <button
            type="button"
            disabled={isAnalyzing || proposals.length === 0}
            onClick={handleCompare}
            className={`w-full sm:w-auto min-w-[320px] px-8 py-4 rounded-xl text-base font-bold shadow-md transition transform active:scale-95 flex items-center justify-center gap-3 ${
              isAnalyzing || proposals.length === 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-[#002B49] hover:bg-[#003d66] text-white hover:shadow-lg'
            }`}
          >
            {isAnalyzing ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
                <span>Analizando propuestas...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>Comparar propuestas</span>
              </>
            )}
          </button>

          {isAnalyzing && (
            <p className="text-xs text-slate-500 mt-3 animate-pulse text-center">
              Gemini está leyendo los documentos PDF, contrastando coberturas y evaluando el semáforo normativo...
            </p>
          )}
        </div>

        {/* SECCIÓN 3: RESULTADO */}
        {result && (
          <section id="seccion-resultado" className="space-y-8 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#009A44] text-white font-bold text-base">
                  3
                </span>
                <div>
                  <h2 className="text-xl font-bold text-[#002B49]">Resultado de la Comparación</h2>
                  <p className="text-xs text-slate-500">
                    Matriz técnica comparativa por aseguradora y validación de reglas de negocio.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleNewComparison}
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 px-3.5 py-2 rounded-xl transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Nueva comparación
              </button>
            </div>

            {/* TABLA COMPARATIVA */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  {/* Encabezado con aseguradoras */}
                  <thead>
                    <tr className="bg-[#002B49] text-white divide-x divide-slate-700">
                      <th className="py-4 px-4 font-bold text-xs uppercase tracking-wider w-56 sticky left-0 bg-[#002B49] z-10">
                        Criterio / Cobertura
                      </th>
                      {result.proposals.map((prop, idx) => (
                        <th key={idx} className="py-4 px-4 min-w-[240px] text-left">
                          <div className="font-bold text-sm text-white">{prop.aseguradora}</div>
                          {prop.plan && (
                            <div className="text-xs text-slate-300 font-normal mt-0.5">{prop.plan}</div>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {/* Fila: Prima anual */}
                    <tr className="bg-white hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900 bg-slate-50/80 sticky left-0 z-10 border-r border-slate-200">
                        Prima anual
                      </td>
                      {result.proposals.map((prop, idx) => (
                        <td key={idx} className="py-3 px-4 font-bold text-slate-900 text-base">
                          {prop.primaAnual || 'no indicado'}
                        </td>
                      ))}
                    </tr>

                    {/* Fila: Cabe en presupuesto */}
                    <tr className="bg-slate-50/50 hover:bg-slate-100/50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900 bg-slate-50/80 sticky left-0 z-10 border-r border-slate-200">
                        Cabe en presupuesto
                      </td>
                      {result.proposals.map((prop, idx) => {
                        const cabe = prop.cabeEnPresupuesto === 'Sí';
                        return (
                          <td key={idx} className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                cabe
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {cabe ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                              {prop.cabeEnPresupuesto}
                            </span>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              (Máx: {formatColones(profile.presupuestoMaximo)})
                            </span>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Fila: Deducible colisión */}
                    <tr className="bg-white hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900 bg-slate-50/80 sticky left-0 z-10 border-r border-slate-200">
                        Deducible colisión
                      </td>
                      {result.proposals.map((prop, idx) => (
                        <td key={idx} className="py-3 px-4 text-xs text-slate-700">
                          {prop.deducibleColision || 'no indicado'}
                        </td>
                      ))}
                    </tr>

                    {/* Fila: Deducible robo */}
                    <tr className="bg-slate-50/50 hover:bg-slate-100/50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900 bg-slate-50/80 sticky left-0 z-10 border-r border-slate-200">
                        Deducible robo
                      </td>
                      {result.proposals.map((prop, idx) => (
                        <td key={idx} className="py-3 px-4 text-xs text-slate-700">
                          {prop.deducibleRobo || 'no indicado'}
                        </td>
                      ))}
                    </tr>

                    {/* Fila: RC daños a terceros */}
                    <tr className="bg-white hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900 bg-slate-50/80 sticky left-0 z-10 border-r border-slate-200">
                        RC daños a terceros
                      </td>
                      {result.proposals.map((prop, idx) => (
                        <td key={idx} className="py-3 px-4 text-xs font-medium text-slate-800">
                          {prop.rcDanosTerceros || 'no indicado'}
                        </td>
                      ))}
                    </tr>

                    {/* Fila: RC lesiones */}
                    <tr className="bg-slate-50/50 hover:bg-slate-100/50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900 bg-slate-50/80 sticky left-0 z-10 border-r border-slate-200">
                        RC lesiones
                      </td>
                      {result.proposals.map((prop, idx) => (
                        <td key={idx} className="py-3 px-4 text-xs font-medium text-slate-800">
                          {prop.rcLesiones || 'no indicado'}
                        </td>
                      ))}
                    </tr>

                    {/* Fila: Asistencia vial 24/7 */}
                    <tr className="bg-white hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900 bg-slate-50/80 sticky left-0 z-10 border-r border-slate-200">
                        Asistencia vial 24/7
                      </td>
                      {result.proposals.map((prop, idx) => (
                        <td key={idx} className="py-3 px-4 text-xs text-slate-700">
                          {prop.asistenciaVial || 'no indicado'}
                        </td>
                      ))}
                    </tr>

                    {/* Fila: Grúa */}
                    <tr className="bg-slate-50/50 hover:bg-slate-100/50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900 bg-slate-50/80 sticky left-0 z-10 border-r border-slate-200">
                        Grúa
                      </td>
                      {result.proposals.map((prop, idx) => (
                        <td key={idx} className="py-3 px-4 text-xs text-slate-700">
                          {prop.grua || 'no indicado'}
                        </td>
                      ))}
                    </tr>

                    {/* Fila: Vehículo sustituto */}
                    <tr className="bg-white hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900 bg-slate-50/80 sticky left-0 z-10 border-r border-slate-200">
                        Vehículo sustituto
                      </td>
                      {result.proposals.map((prop, idx) => (
                        <td key={idx} className="py-3 px-4 text-xs text-slate-700">
                          {prop.vehiculoSustituto || 'no indicado'}
                        </td>
                      ))}
                    </tr>

                    {/* Fila: Fenómenos naturales */}
                    <tr className="bg-slate-50/50 hover:bg-slate-100/50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900 bg-slate-50/80 sticky left-0 z-10 border-r border-slate-200">
                        Fenómenos naturales
                      </td>
                      {result.proposals.map((prop, idx) => (
                        <td key={idx} className="py-3 px-4 text-xs text-slate-700">
                          {prop.fenomenosNaturales || 'no indicado'}
                        </td>
                      ))}
                    </tr>

                    {/* Fila: Rotura de cristales */}
                    <tr className="bg-white hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900 bg-slate-50/80 sticky left-0 z-10 border-r border-slate-200">
                        Rotura de cristales
                      </td>
                      {result.proposals.map((prop, idx) => (
                        <td key={idx} className="py-3 px-4 text-xs text-slate-700">
                          {prop.roturaCristales || 'no indicado'}
                        </td>
                      ))}
                    </tr>

                    {/* Fila: Exclusiones destacadas */}
                    <tr className="bg-slate-50/50 hover:bg-slate-100/50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900 bg-slate-50/80 sticky left-0 z-10 border-r border-slate-200">
                        Exclusiones destacadas
                      </td>
                      {result.proposals.map((prop, idx) => (
                        <td key={idx} className="py-3 px-4 text-xs text-slate-600 leading-relaxed">
                          {prop.exclusionesDestacadas || 'no indicado'}
                        </td>
                      ))}
                    </tr>

                    {/* Fila: Cumple obligatorias */}
                    <tr className="bg-white hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900 bg-slate-50/80 sticky left-0 z-10 border-r border-slate-200">
                        Cumple obligatorias
                      </td>
                      {result.proposals.map((prop, idx) => {
                        const cumple = prop.cumpleObligatorias === 'Sí';
                        return (
                          <td key={idx} className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                cumple
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {cumple ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                              {prop.cumpleObligatorias}
                            </span>
                            {prop.coberturasFaltantes && prop.coberturasFaltantes.length > 0 && (
                              <p className="text-[11px] text-rose-600 mt-1 font-medium">
                                Faltan: {prop.coberturasFaltantes.join(', ')}
                              </p>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Fila: Semáforo */}
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                      <td className="py-4 px-4 font-bold text-slate-900 bg-slate-200/90 sticky left-0 z-10 border-r border-slate-200 uppercase tracking-wider text-xs">
                        Semáforo
                      </td>
                      {result.proposals.map((prop, idx) => {
                        const sem = prop.semaforo;
                        let badgeBg = 'bg-rose-500 text-white';
                        let badgeLabel = 'ROJO (No cumple)';
                        let icon = <XCircle className="w-5 h-5 text-white" />;
                        let cardBorder = 'border-rose-400 bg-rose-50';

                        if (sem === 'verde') {
                          badgeBg = 'bg-emerald-600 text-white';
                          badgeLabel = 'VERDE (Cumple y cabe)';
                          icon = <CheckCircle2 className="w-5 h-5 text-white" />;
                          cardBorder = 'border-emerald-500 bg-emerald-50';
                        } else if (sem === 'amarillo') {
                          badgeBg = 'bg-amber-500 text-white';
                          badgeLabel = 'AMARILLO (Cumple, excede presupuesto)';
                          icon = <AlertTriangle className="w-5 h-5 text-white" />;
                          cardBorder = 'border-amber-400 bg-amber-50';
                        }

                        return (
                          <td key={idx} className="py-4 px-4">
                            <div className={`p-3 rounded-xl border ${cardBorder}`}>
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className={`p-1 rounded-full ${badgeBg}`}>{icon}</span>
                                <span className="font-bold text-xs uppercase tracking-wide text-slate-900">
                                  {badgeLabel}
                                </span>
                              </div>
                              <p className="text-[11px] font-normal text-slate-700">
                                {prop.semaforoMotivo ||
                                  (sem === 'verde'
                                    ? 'Cabe en presupuesto y cumple todas las coberturas.'
                                    : sem === 'amarillo'
                                    ? 'Cumple coberturas pero supera el presupuesto.'
                                    : 'Falta alguna cobertura obligatoria marcada.')}
                              </p>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* DOS CUADROS: RECOMENDACIÓN Y MENSAJE DE WHATSAPP */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cuadro 1: Recomendación preliminar (borrador) */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-[#002B49] text-white">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#002B49]">
                        Recomendación preliminar (borrador)
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        Máximo 5 líneas con montos según prioridades
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                      {result.recomendacionPreliminar}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Preparado para decisión del asesor
                  </span>
                </div>
              </div>

              {/* Cuadro 2: Mensaje sugerido para el cliente (WhatsApp) */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-600 text-white">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Mensaje sugerido para el cliente (WhatsApp)
                        </h3>
                        <span className="text-[11px] text-slate-400">
                          Máximo 8 líneas, tono cordial y sin tecnicismos
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        copiedWhatsApp
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {copiedWhatsApp ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar mensaje</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* WhatsApp style preview bubble */}
                  <div className="bg-[#E7F6EB] rounded-2xl p-4 border border-emerald-200 relative shadow-inner">
                    <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                      {result.mensajeWhatsApp}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Listo para enviar por WhatsApp</span>
                  <span className="font-medium text-emerald-700">Sin promesas de plazos</span>
                </div>
              </div>
            </div>

            {/* Botones de acción final */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                type="button"
                onClick={handleCopyMessage}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition"
              >
                {copiedWhatsApp ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedWhatsApp ? 'Mensaje copiado' : 'Copiar mensaje'}
              </button>
              <button
                type="button"
                onClick={handleNewComparison}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-semibold transition"
              >
                <RotateCcw className="w-4 h-4" /> Nueva comparación
              </button>
            </div>
          </section>
        )}
      </main>

      {/* TEXTO FIJO AL PIE (Obligatorio) */}
      <footer className="mt-auto bg-slate-100 border-t border-slate-200 py-6 text-center px-4">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="text-xs text-slate-600 font-medium">
            Borrador generado con IA. Debe ser validado por un asesor contra las condiciones reales de la póliza. No suba datos reales de clientes.
          </p>
          <p className="text-[11px] text-slate-400">
            Banco de Colombia · Sistema de Análisis Asistido
          </p>
        </div>
      </footer>
    </div>
  );
}
