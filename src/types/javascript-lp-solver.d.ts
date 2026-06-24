declare module 'javascript-lp-solver' {
  export interface Model {
    optimize: string;
    opType: 'max' | 'min';
    constraints: Record<string, Partial<{ max: number; min: number; equal: number }>>;
    variables: Record<string, Record<string, number>>;
    options?: Record<string, unknown>;
  }

  export interface SolveResult {
    feasible: boolean;
    result: number;
    bounded?: boolean;
    [variable: string]: number | boolean | undefined;
  }

  const solver: {
    Solve(model: Model): SolveResult;
  };
  export default solver;
}
