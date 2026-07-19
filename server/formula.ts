/**
 * Arithmetic evaluator for service pricing formulas.
 *
 * Pricing formulas are edited by business owners in the admin, so they are
 * untrusted input. This previously went through `eval()` behind a regex
 * character allowlist. That allowlist did hold — injection attempts were
 * blocked — but it was fragile: its safety depended on the pattern staying
 * exactly right, and anyone later permitting another character (`%`, `,`)
 * could open a hole without noticing.
 *
 * This is a real recursive-descent parser instead. There is no code path to
 * JavaScript evaluation at all, so the class of risk is gone rather than
 * guarded against.
 *
 * Supported: + - * / ( ), decimals, exponent notation, unary minus, and
 * variable names. Nothing else parses.
 */

export class FormulaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormulaError";
  }
}

type Token =
  | { kind: "number"; value: number }
  | { kind: "name"; value: string }
  | { kind: "op"; value: "+" | "-" | "*" | "/" }
  | { kind: "lparen" }
  | { kind: "rparen" };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      i++;
      continue;
    }

    if (ch === "(") { tokens.push({ kind: "lparen" }); i++; continue; }
    if (ch === ")") { tokens.push({ kind: "rparen" }); i++; continue; }

    if (ch === "+" || ch === "-" || ch === "*" || ch === "/") {
      tokens.push({ kind: "op", value: ch });
      i++;
      continue;
    }

    // Number, optionally with a decimal part and exponent (1e5, 2.5e-3).
    if (/[0-9.]/.test(ch)) {
      let literal = "";
      while (i < input.length && /[0-9.]/.test(input[i])) literal += input[i++];

      if (i < input.length && (input[i] === "e" || input[i] === "E")) {
        const save = i;
        let exponent = input[i++];
        if (i < input.length && (input[i] === "+" || input[i] === "-")) exponent += input[i++];

        if (i < input.length && /[0-9]/.test(input[i])) {
          while (i < input.length && /[0-9]/.test(input[i])) exponent += input[i++];
          literal += exponent;
        } else {
          i = save; // not an exponent after all, e.g. "2 * end"
        }
      }

      const value = Number(literal);
      if (!Number.isFinite(value)) {
        throw new FormulaError(`"${literal}" is not a valid number.`);
      }
      tokens.push({ kind: "number", value });
      continue;
    }

    // Variable name: letters, digits and underscores, not starting with a digit.
    if (/[A-Za-z_]/.test(ch)) {
      let name = "";
      while (i < input.length && /[A-Za-z0-9_]/.test(input[i])) name += input[i++];
      tokens.push({ kind: "name", value: name });
      continue;
    }

    throw new FormulaError(`Unexpected character "${ch}" in formula.`);
  }

  return tokens;
}

/**
 * Evaluates a pricing formula against a set of named values.
 *
 * Throws FormulaError on anything malformed — an unknown variable, a stray
 * character, unbalanced brackets — so a broken formula is reported rather
 * than silently producing a wrong price.
 */
export function evaluateFormula(formula: string, variables: Record<string, number>): number {
  const tokens = tokenize(formula);
  if (tokens.length === 0) throw new FormulaError("Formula is empty.");

  let pos = 0;
  const peek = () => tokens[pos];

  // expression := term (("+" | "-") term)*
  function parseExpression(): number {
    let left = parseTerm();

    while (pos < tokens.length) {
      const token = peek();
      if (token.kind !== "op" || (token.value !== "+" && token.value !== "-")) break;
      pos++;
      const right = parseTerm();
      left = token.value === "+" ? left + right : left - right;
    }

    return left;
  }

  // term := factor (("*" | "/") factor)*
  function parseTerm(): number {
    let left = parseFactor();

    while (pos < tokens.length) {
      const token = peek();
      if (token.kind !== "op" || (token.value !== "*" && token.value !== "/")) break;
      pos++;
      const right = parseFactor();

      if (token.value === "/") {
        if (right === 0) throw new FormulaError("Formula divides by zero.");
        left = left / right;
      } else {
        left = left * right;
      }
    }

    return left;
  }

  // factor := "-" factor | "(" expression ")" | number | name
  function parseFactor(): number {
    if (pos >= tokens.length) throw new FormulaError("Formula ended unexpectedly.");

    const token = tokens[pos];

    if (token.kind === "op" && token.value === "-") {
      pos++;
      return -parseFactor();
    }
    if (token.kind === "op" && token.value === "+") {
      pos++;
      return parseFactor();
    }

    if (token.kind === "lparen") {
      pos++;
      const value = parseExpression();
      if (pos >= tokens.length || tokens[pos].kind !== "rparen") {
        throw new FormulaError("Missing closing bracket in formula.");
      }
      pos++;
      return value;
    }

    if (token.kind === "number") {
      pos++;
      return token.value;
    }

    if (token.kind === "name") {
      pos++;
      const value = variables[token.value];
      if (value === undefined) {
        throw new FormulaError(
          `Formula uses "${token.value}", which is not one of the available values ` +
          `(${Object.keys(variables).sort().join(", ")}).`
        );
      }
      if (!Number.isFinite(value)) {
        throw new FormulaError(`"${token.value}" is not a number.`);
      }
      return value;
    }

    throw new FormulaError("Formula is malformed.");
  }

  const result = parseExpression();

  if (pos < tokens.length) {
    throw new FormulaError("Formula has unexpected content after the end.");
  }
  if (!Number.isFinite(result)) {
    throw new FormulaError("Formula did not produce a usable number.");
  }

  return result;
}

/**
 * Checks a formula without pricing anything, so the admin can validate what
 * the owner typed before it is saved.
 */
export function validateFormula(
  formula: string,
  availableVariables: string[]
): { valid: boolean; error?: string } {
  // Probe with 1 for every variable: we are checking the shape, not the price.
  const probe: Record<string, number> = {};
  availableVariables.forEach((name) => { probe[name] = 1; });

  try {
    evaluateFormula(formula, probe);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof FormulaError ? error.message : "Formula could not be read.",
    };
  }
}
