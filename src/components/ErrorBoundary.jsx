import React from "react";

/**
 * Robust React Error Boundary
 * Prevents entire app crashes / white screens by displaying a styled fallback
 * with reload and reset actions.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary caught an error]:", error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          reset: this.handleReset,
          reload: this.handleReload
        });
      }

      const isSubfeature = Boolean(this.props.title);

      return (
        <div className={`flex flex-col items-center justify-center p-6 text-center select-none ${
          isSubfeature ? "min-h-[280px] w-full" : "min-h-screen bg-[#052e16] text-white px-4"
        }`}>
          <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl mb-4 shadow-inner">
              ⚠️
            </div>

            <h2 className="text-white text-lg font-bold tracking-tight mb-2">
              {this.props.title || "Something went wrong"}
            </h2>

            <p className="text-white/60 text-xs mb-3 leading-relaxed max-w-xs">
              {this.props.message ||
                "An unexpected display issue occurred. Don't worry — your data is safe."}
            </p>

            {this.state.error && (
              <div className="mb-5 p-2.5 rounded-xl bg-black/60 border border-amber-500/40 text-amber-200 font-mono text-[11px] text-left max-w-xs break-all shadow-inner">
                {String(this.state.error?.message || this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 w-full">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-lg hover:from-emerald-400 hover:to-teal-400 active:scale-95 transition-all"
              >
                🔄 Reload App
              </button>

              {this.props.onReset && (
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-all active:scale-95"
                >
                  🔙 Return
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
