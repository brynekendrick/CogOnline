import Icon from "./Icons";
import { evaluatePasswordRules } from "../../lib/api";
import "./PasswordChecklist.css";

const RULES = [
  { key: "minLength", label: "8–72 characters" },
  { key: "uppercase", label: "At least 1 uppercase letter (A–Z)" },
  { key: "lowercase", label: "At least 1 lowercase letter (a–z)" },
  { key: "number", label: "At least 1 number (0–9)" },
  { key: "special", label: "At least 1 special character (!@#$...)" },
];

export default function PasswordChecklist({ password = "", confirmPassword }) {
  const checks = evaluatePasswordRules(password);
  const showMatch = confirmPassword !== undefined;
  const matches = Boolean(password) && password === confirmPassword;

  return (
    <div className="pw-checklist" aria-live="polite">
      <div className="pw-checklist-title">Password requirements</div>
      <ul className="pw-checklist-list">
        {RULES.map((rule) => {
          const ok = checks[rule.key];
          return (
            <li key={rule.key} className={`pw-rule ${ok ? "met" : ""}`}>
              <span className="pw-rule-dot">
                {ok && <Icon name="check" size={11} />}
              </span>
              <span>{rule.label}</span>
            </li>
          );
        })}
        {showMatch && (
          <li className={`pw-rule ${matches ? "met" : ""}`}>
            <span className="pw-rule-dot">
              {matches && <Icon name="check" size={11} />}
            </span>
            <span>Passwords match</span>
          </li>
        )}
      </ul>
    </div>
  );
}
