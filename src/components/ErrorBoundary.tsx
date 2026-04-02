import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, ArrowLeft, RefreshCcw, RotateCw } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { devError } from '@/lib/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

const MAX_AUTO_RETRIES = 2;

const PythonGlyph = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 110 110"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M53.8,4.1c-24.8,0-23.3,10.7-23.3,10.7l0,11h23.8v3.4H30.4c0,0-15.3,2.4-15.3,21.8c0,19.4,13.3,20.6,13.3,20.6h6.7v-9.6c0,0-0.4-11.2,11.4-11.2h16c0,0,10.1-0.8,10.1-10.5V14.1C72.5,14.1,72.6,4.1,53.8,4.1z M39.4,11.5c2.4,0,4.4,2,4.4,4.4c0,2.4-2,4.4-4.4,4.4c-2.4,0-4.4-2-4.4-4.4C35.1,13.5,37,11.5,39.4,11.5z" />
    <path d="M55.7,105.8c24.8,0,23.3-10.7,23.3-10.7l0-11H55.2v-3.4h23.8c0,0,15.3-2.4,15.3-21.8c0-19.4-13.3-20.6-13.3-20.6H74.3v9.6c0,0,0.4,11.2-11.4,11.2H46.9c0,0-10.1,0.8-10.1,10.5v26.2C36.9,95.8,36.8,105.8,55.7,105.8z M70.1,98.4c-2.4,0-4.4-2-4.4-4.4c0-2.4,2-4.4,4.4-4.4c2.4,0,4.4,2,4.4,4.4C74.5,96.4,72.5,98.4,70.1,98.4z" />
  </svg>
);

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    devError('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleRetry = () => {
    if (this.state.retryCount < MAX_AUTO_RETRIES) {
      this.setState((prev) => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prev.retryCount + 1,
      }));
      return;
    }

    window.location.reload();
  };

  private handleHardReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const canRetry = this.state.retryCount < MAX_AUTO_RETRIES;

      return (
        <div className="relative min-h-screen overflow-hidden bg-[#edf2fa]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,#f9fbff_0%,#eef3fb_55%,#e6edf8_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_15%,rgba(15,52,96,0.14),transparent_38%),radial-gradient(circle_at_85%_80%,rgba(31,90,160,0.1),transparent_42%)]" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.22]"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(15,52,96,0.22) 0.62px, transparent 0.62px)',
              backgroundSize: '22px 22px',
            }}
          />

          <svg
            className="pointer-events-none absolute inset-0 h-full w-full text-[#0F3460]/20"
            viewBox="0 0 1440 900"
            fill="none"
            aria-hidden="true"
          >
            <path d="M-80 220 C 260 70, 560 370, 1100 180" stroke="currentColor" strokeWidth="1.2" strokeDasharray="10 14" />
            <path d="M-80 320 C 280 170, 580 460, 1120 280" stroke="currentColor" strokeWidth="1" strokeDasharray="8 12" />
            <path d="M-80 420 C 300 270, 600 560, 1140 390" stroke="currentColor" strokeWidth="1" strokeDasharray="8 12" />
          </svg>

          <div className="pointer-events-none absolute inset-0 overflow-hidden text-[#0F3460]/14">
            <PythonGlyph className="absolute left-[8%] top-[14%] h-8 w-8" />
            <PythonGlyph className="absolute right-[11%] top-[22%] h-7 w-7" />
            <PythonGlyph className="absolute bottom-[18%] left-[16%] h-7 w-7" />
            <PythonGlyph className="absolute bottom-[14%] right-[10%] h-8 w-8" />
          </div>

          <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
            <Card className="w-full max-w-3xl border-[#0F3460]/18 bg-white/95 shadow-[0_24px_56px_rgba(15,52,96,0.16)]">
              <CardHeader className="space-y-4 border-b border-[#0F3460]/10 pb-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-500">
                      <AlertTriangle className="h-5 w-5" />
                    </span>
                    <div>
                      <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                        Une erreur s'est produite
                      </CardTitle>
                      <p className="mt-1 text-sm text-slate-600">
                        L'espace est temporairement indisponible. Vous pouvez reprendre en quelques secondes.
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="border border-[#0F3460]/20 bg-[#0F3460]/10 text-[#0F3460]">
                    Recuperation assistee
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-5">
                <Alert variant="destructive" className="border-red-200/80 bg-red-50/70">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Incident detecte</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p className="font-mono text-xs text-red-700">{this.state.error?.toString() ?? 'Erreur inconnue.'}</p>
                    {this.state.errorInfo ? (
                      <details>
                        <summary className="cursor-pointer text-xs font-medium text-red-700 hover:text-red-800">
                          Details techniques
                        </summary>
                        <pre className="mt-2 max-h-44 overflow-auto rounded-md border border-red-100 bg-white/85 p-2 text-[11px] text-slate-600">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    ) : null}
                  </AlertDescription>
                </Alert>

                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-600">
                  Si le probleme persiste: actualisez la page, puis relancez la derniere action. Le journal technique est conserve.
                </div>
              </CardContent>

              <Separator className="bg-[#0F3460]/10" />

              <CardFooter className="flex flex-wrap items-center justify-between gap-3 pt-4">
                <div className="text-xs text-slate-500">
                  Tentative {Math.min(this.state.retryCount + 1, MAX_AUTO_RETRIES)} / {MAX_AUTO_RETRIES}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={this.handleRetry}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    {canRetry
                      ? `Reessayer (${this.state.retryCount + 1}/${MAX_AUTO_RETRIES})`
                      : 'Recharger la page'}
                  </Button>
                  <Button variant="outline" onClick={this.handleHardReload}>
                    <RotateCw className="mr-2 h-4 w-4" />
                    Recharger
                  </Button>
                  <Button variant="secondary" onClick={() => window.history.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
