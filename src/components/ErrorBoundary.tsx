import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="max-w-2xl p-8 bg-card border border-destructive/50 rounded-lg shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
              <h1 className="text-2xl font-bold text-foreground">
                Une erreur s'est produite
              </h1>
            </div>
            
            <p className="text-muted-foreground mb-4">
              Une erreur inattendue s'est produite dans l'application. Veuillez recharger la page.
            </p>

            {this.state.error && (
              <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded">
                <p className="font-mono text-sm text-destructive mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                      Détails techniques
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto max-h-48 text-muted-foreground">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
                Recharger la page
              </button>
              
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors"
              >
                Retour
              </button>
            </div>

            <div className="mt-6 p-4 bg-muted/50 rounded border border-border">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Conseil :</strong> Si l'erreur persiste, essayez de :<br />
                • Vider le cache du navigateur (Ctrl+Shift+R)<br />
                • Vérifier la console du navigateur (F12)<br />
                • Contacter le support technique si nécessaire
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
