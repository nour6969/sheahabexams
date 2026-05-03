export const MATH_BRANCHES = [
  { value: "STATICS", label: "Statics" },
  { value: "DYNAMICS", label: "Dynamics" },
  { value: "ALGEBRA", label: "Algebra" },
  { value: "SOLID_GEOMETRY", label: "Solid Geometry" },
  { value: "GEOMETRY", label: "Geometry" },
  { value: "CALCULUS", label: "Calculus" }
] as const;

export type MathBranchValue = (typeof MATH_BRANCHES)[number]["value"];

export const BRANCH_LABELS = MATH_BRANCHES.reduce(
  (labels, branch) => ({
    ...labels,
    [branch.value]: branch.label
  }),
  {} as Record<MathBranchValue, string>
);

export function getBranchLabel(branch: string) {
  return BRANCH_LABELS[branch as MathBranchValue] ?? branch;
}
