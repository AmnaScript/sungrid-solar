
import { useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import {
    ArrowRight,
    LockKeyhole,
    Mail,
    ShieldCheck,
    Sun,
    Zap,
} from "lucide-react";
import {
    api,
    getErrorMessage,
    TOKEN_KEY,
    type LoginResponse,
    type StaffUser,
} from "../services/api";

type Props = {
    onLogin: (user: StaffUser) => void;
};

export default function Login({ onLogin }: Props) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        if (!email.trim() || !password) {
            setError("Please enter your email and password.");
            return;
        }

        setLoading(true);

        try {
            const { data } = await api.post<LoginResponse>("/login", {
                email: email.trim(),
                password,
            });

            if (data.user.role !== "staff") {
                setError("This portal is for staff accounts only.");
                return;
            }

            localStorage.setItem(TOKEN_KEY, data.token);
            onLogin(data.user);
        } catch (err) {
            if (
                err instanceof AxiosError &&
                err.response?.status === 400
            ) {
                setError("Please enter a valid email and password.");
            } else {
                setError(getErrorMessage(err));
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-layout">
            <section className="login-hero">
                <div className="brand brand-light">
                    <span className="brand-icon"><Sun size={24} /></span>
                    <span>sungrid<span className="brand-accent">solar.</span></span>
                </div>

                <div className="hero-content">
                    <div className="eyebrow">
                        <Zap size={15} /> POWERING BETTER OPERATIONS
                    </div>

                    <h1>
                        Every installation.
                        <br />
                        <span>One clear view.</span>
                    </h1>

                    <p>
                        A secure workspace to keep your solar projects
                        organized, your team connected, and every order
                        on track.
                    </p>

                    <div className="hero-line" />

                    <div className="hero-footer">
                        <ShieldCheck size={21} />
                        <span>Secure internal staff workspace</span>
                    </div>
                </div>

                <span className="hero-decoration">SG / 01</span>
            </section>

            <section className="login-panel">
                <div className="login-form-wrap">
                    <div className="login-mobile-brand">
                        <Sun size={23} /> sungrid solar.
                    </div>

                    <span className="section-label">STAFF PORTAL</span>
                    <h2>Welcome back</h2>
                    <p className="form-description">
                        Sign in with your staff credentials to continue.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <label htmlFor="email">Work email</label>
                        <div className="input-wrap">
                            <Mail size={19} />
                            <input
                                id="email"
                                type="email"
                                placeholder="name@company.com"
                                autoComplete="username"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <label htmlFor="password">Password</label>
                        <div className="input-wrap">
                            <LockKeyhole size={19} />
                            <input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="error-message" role="alert">
                                {error}
                            </div>
                        )}

                        <button
                            className="primary-button"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Sign in to portal"}
                            {!loading && <ArrowRight size={18} />}
                        </button>
                    </form>

                    <p className="login-help">
                        Need access? Contact your system administrator.
                    </p>
                </div>

                <p className="login-bottom">
                    © {new Date().getFullYear()} SunGrid Solar.
                    Authorized personnel only.
                </p>
            </section>
        </div>
    );
}
