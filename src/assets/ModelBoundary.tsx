import { Component, Suspense, type ErrorInfo, type ReactNode } from 'react';
import { reportModelError } from './loadErrors';

export interface ModelBoundaryProps {
  children: ReactNode;
  /** Shown (inside the canvas) while models load. Defaults to nothing: the DOM loading bar covers progress. */
  fallback?: ReactNode;
  /** Shown if a model fails to load. */
  errorFallback?: ReactNode;
  /** Reports a failed load, e.g. to raise the error toast. `retry` clears the error and tries the load again. */
  onError?: (error: Error, retry: () => void) => void;
}

interface State {
  error: Error | null;
}

/** Suspense + error boundary in one, for subtrees that call useModel. */
export class ModelBoundary extends Component<ModelBoundaryProps, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    reportModelError(error, this.retry);
    this.props.onError?.(error, this.retry);
  }

  retry = () => this.setState({ error: null });

  render() {
    if (this.state.error) return this.props.errorFallback ?? null;
    return <Suspense fallback={this.props.fallback ?? null}>{this.props.children}</Suspense>;
  }
}
