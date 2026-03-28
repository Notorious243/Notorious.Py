import React, { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  AtSign,
  ChevronLeft,
  Loader2,
  LockKeyhole,
  TriangleAlert,
  X,
} from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

type Mode = "signin" | "signup" | "reset"
type ResetStep = "email" | "otp"
type OAuthProvider = "google" | "apple" | "github"

const providerLabel: Record<OAuthProvider, string> = {
  google: "Google",
  apple: "Apple",
  github: "GitHub",
}

const supabaseErrorFR: Record<string, string> = {
  "Invalid login credentials": "Adresse e-mail ou mot de passe invalide.",
  "Email not confirmed": "Veuillez confirmer votre e-mail avant de continuer.",
  "User not found": "Aucun compte trouvé avec cette adresse e-mail.",
  "Email rate limit exceeded": "Trop de tentatives. Réessayez plus tard.",
  "For security purposes, you can only request this after":
    "Pour des raisons de sécurité, veuillez patienter avant de réessayer.",
  "User already registered": "Un compte existe déjà avec cette adresse e-mail.",
  "Password should be at least 6 characters":
    "Le mot de passe doit contenir au moins 6 caractères.",
  "Signups not allowed for this instance":
    "Les inscriptions sont temporairement désactivées.",
  "Unable to validate email address: invalid format":
    "Format d'adresse e-mail invalide.",
}

function translateError(message: string, fallback: string): string {
  for (const [en, fr] of Object.entries(supabaseErrorFR)) {
    if (message.toLowerCase().includes(en.toLowerCase())) {
      return fr
    }
  }
  return fallback
}

function BrandLogo({ withText = false }: { withText?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/logo-512x512.png"
        alt="Notorious PY"
        className="size-12 rounded-xl"
      />
      {withText ? (
        <span className="text-xl font-semibold tracking-tight">Notorious PY</span>
      ) : null}
    </div>
  )
}

function AuthBrandBlock({
  className,
}: {
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <BrandLogo withText />
    </div>
  )
}

function CloseCanvasButton({ onClose }: { onClose?: () => void }) {
  if (!onClose) {
    return null
  }

  return (
    <Button
      aria-label="Fermer"
      className="absolute right-6 top-6 z-40 rounded-full"
      size="icon"
      type="button"
      variant="ghost"
      onClick={onClose}
    >
      <X />
    </Button>
  )
}

function AuthDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex w-full items-center">
      <div className="w-full border-t border-border" />
      <div className="px-2 text-nowrap text-xs text-muted-foreground">
        {children}
      </div>
      <div className="w-full border-t border-border" />
    </div>
  )
}

function AuthError({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <TriangleAlert className="size-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

function AuthInfo({ message }: { message: string }) {
  return (
    <Alert variant="info">
      <AtSign className="size-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

function GoogleIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g>
        <path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669   C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62   c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401   c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
      </g>
    </svg>
  )
}

function GithubIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg fill="currentColor" viewBox="0 0 1024 1024" {...props}>
      <path
        clipRule="evenodd"
        d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z"
        fill="currentColor"
        fillRule="evenodd"
        transform="scale(64)"
      />
    </svg>
  )
}

function AppleIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <g>
        <g>
          <path d="M18.546,12.763c0.024-1.87,1.004-3.597,2.597-4.576c-1.009-1.442-2.64-2.323-4.399-2.378 c-1.851-0.194-3.645,1.107-4.588,1.107c-0.961,0-2.413-1.088-3.977-1.056C6.122,5.927,4.25,7.068,3.249,8.867 c-2.131,3.69-0.542,9.114,1.5,12.097c1.022,1.461,2.215,3.092,3.778,3.035c1.529-0.063,2.1-0.975,3.945-0.975 c1.828,0,2.364,0.975,3.958,0.938c1.64-0.027,2.674-1.467,3.66-2.942c0.734-1.041,1.299-2.191,1.673-3.408 C19.815,16.788,18.548,14.879,18.546,12.763z" />
          <path d="M15.535,3.847C16.429,2.773,16.87,1.393,16.763,0c-1.366,0.144-2.629,0.797-3.535,1.829 c-0.895,1.019-1.349,2.351-1.261,3.705C13.352,5.548,14.667,4.926,15.535,3.847z" />
        </g>
      </g>
    </svg>
  )
}

function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.8 + i * 0.035,
  }))

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg
        className="h-full w-full text-slate-300/80"
        fill="none"
        viewBox="0 0 696 316"
      >
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.18 + path.id * 0.015}
            initial={{ pathLength: 0.4, opacity: 0.55 }}
            animate={{
              pathLength: 1,
              opacity: [0.35, 0.8, 0.35],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 12 + Math.random() * 6,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  )
}

function CornerMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute z-10 size-4 shrink-0 stroke-muted-foreground stroke-[0.5px]",
        className
      )}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}

interface SharedAuthProps {
  initialEmail: string
  onEmailChange: (email: string) => void
  onBackToCanvas?: () => void
}

async function signInWithOAuth(provider: OAuthProvider) {
  return supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin },
  })
}

function SignInAuth11({
  initialEmail,
  onEmailChange,
  onSwitchSignUp,
  onSwitchReset,
  onBackToCanvas,
}: SharedAuthProps & {
  onSwitchSignUp: () => void
  onSwitchReset: () => void
}) {
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")

  const isBusy = loading || loadingProvider !== null

  useEffect(() => {
    onEmailChange(email)
  }, [email, onEmailChange])

  const handleProviderSignIn = async (provider: OAuthProvider) => {
    setError("")
    setInfo("")
    setLoadingProvider(provider)

    const { error: authError } = await signInWithOAuth(provider)

    if (authError) {
      setError(
        translateError(
          authError.message,
          `Connexion ${providerLabel[provider]} indisponible pour le moment.`
        )
      )
    }

    setLoadingProvider(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setInfo("")

    if (!email || !password) {
      setError("Veuillez remplir l'adresse e-mail et le mot de passe.")
      return
    }

    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(
        translateError(authError.message, "Impossible de vous connecter pour le moment.")
      )
    } else {
      setInfo("Connexion réussie. Redirection en cours...")
    }

    setLoading(false)
  }

  return (
    <div className="relative grid h-screen overflow-hidden bg-background md:grid-cols-2 lg:grid-cols-3">
      <div className="relative hidden h-full flex-col items-start justify-between border-r border-border/60 bg-secondary/25 p-8 md:flex">
        <div />

        <div className="space-y-6">
          <h2 className="text-3xl font-medium leading-tight">
            Concevez des interfaces
            <br />
            <span className="text-4xl font-semibold">sans friction.</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Construisez rapidement vos écrans Python avec des blocs modernes.
          </p>
        </div>

        <figure className="z-10 w-full">
          <blockquote className="text-xl leading-tight">
            "Notorious PY m'a fait gagner un temps précieux sur les maquettes UI."
          </blockquote>
          <figcaption className="mt-4 flex items-center gap-3">
            <div className="space-y-0.5">
              <cite className="text-sm not-italic font-medium">Utilisateur Studio</cite>
              <div className="text-xs text-muted-foreground">Product Designer</div>
            </div>
          </figcaption>
        </figure>
      </div>

      <div className="relative lg:col-span-2">
        <CloseCanvasButton onClose={onBackToCanvas} />
        <div className="absolute inset-0 h-3/4 overflow-hidden bg-[radial-gradient(40%_100%_at_49%_0%,rgba(255,255,255,0.07),transparent)]" />
        <div className="absolute inset-x-0 top-0 h-1/2 overflow-hidden [mask-image:linear-gradient(to_bottom,white,transparent)]">
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-1/4 h-full w-full fill-gray-400/20 stroke-border [mask-image:radial-gradient(circle,white_0%,transparent_100%)]"
          >
            <defs>
              <pattern
                id="auth11-pattern"
                x={-1}
                y={-1}
                width={82}
                height={82}
                patternUnits="userSpaceOnUse"
              >
                <path d="M.5 82V.5H82" fill="none" strokeDasharray="4" />
              </pattern>
            </defs>
            <rect fill="url(#auth11-pattern)" width="100%" height="100%" strokeWidth={0} />
          </svg>
        </div>

        <div className="relative z-10 flex h-full flex-col items-center justify-between p-10">
          <AuthBrandBlock />

          <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center gap-6">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold">Connexion</h1>
              <p className="text-sm text-muted-foreground">
                Connectez-vous avec un provider ou votre adresse e-mail.
              </p>
            </div>

            <div className="w-full space-y-3">
              <Button
                className="w-full"
                size="lg"
                variant="outline"
                type="button"
                onClick={() => void handleProviderSignIn("google")}
                disabled={isBusy}
              >
                {loadingProvider === "google" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <GoogleIcon data-icon="inline-start" />
                )}
                Continuer avec Google
              </Button>
              <Button
                className="w-full"
                size="lg"
                variant="outline"
                type="button"
                onClick={() => void handleProviderSignIn("apple")}
                disabled={isBusy}
              >
                {loadingProvider === "apple" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <AppleIcon data-icon="inline-start" />
                )}
                Continuer avec Apple
              </Button>
              <Button
                className="w-full"
                size="lg"
                variant="outline"
                type="button"
                onClick={() => void handleProviderSignIn("github")}
                disabled={isBusy}
              >
                {loadingProvider === "github" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <GithubIcon data-icon="inline-start" />
                )}
                Continuer avec GitHub
              </Button>
            </div>

            <AuthDivider>OU CONNEXION CLASSIQUE</AuthDivider>

            <form className="w-full space-y-4" onSubmit={handleSubmit}>
              <Field>
                <FieldLabel htmlFor="signin-email">Adresse e-mail</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="signin-email"
                    className="pl-10"
                    placeholder="votre.email@exemple.com"
                    type="email"
                    value={email}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setEmail(event.target.value)
                    }
                    required
                  />
                  <InputGroupAddon align="inline-start">
                    <AtSign />
                  </InputGroupAddon>
                </InputGroup>
              </Field>

              <Field>
                <FieldLabel htmlFor="signin-password">Mot de passe</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="signin-password"
                    className="pl-10"
                    placeholder="Votre mot de passe"
                    type="password"
                    value={password}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setPassword(event.target.value)
                    }
                    required
                  />
                  <InputGroupAddon align="inline-start">
                    <LockKeyhole />
                  </InputGroupAddon>
                </InputGroup>
              </Field>

              <button
                type="button"
                className="text-xs text-muted-foreground underline underline-offset-4 hover:text-primary"
                onClick={onSwitchReset}
              >
                Mot de passe oublié ?
              </button>

              <Button className="w-full" type="submit" disabled={isBusy}>
                {loading ? <Loader2 className="animate-spin" /> : null}
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            {error ? <AuthError message={error} /> : null}
            {info ? <AuthInfo message={info} /> : null}

            <p className="text-center text-xs text-muted-foreground">
              Pas encore de compte ?{" "}
              <button
                type="button"
                className="underline underline-offset-4 hover:text-primary"
                onClick={onSwitchSignUp}
              >
                Inscription
              </button>
            </p>
          </div>

          <p className="mt-2 text-center text-xs text-muted-foreground">
            En continuant, vous acceptez les{" "}
            <a className="underline underline-offset-4 hover:text-primary" href="#" onClick={(e) => e.preventDefault()}>
              Conditions
            </a>{" "}
            et la{" "}
            <a className="underline underline-offset-4 hover:text-primary" href="#" onClick={(e) => e.preventDefault()}>
              Politique de confidentialité
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

function SignUpAuth5({
  initialEmail,
  onEmailChange,
  onSwitchSignIn,
  onNewUser,
  onBackToCanvas,
}: SharedAuthProps & {
  onSwitchSignIn: () => void
  onNewUser: () => void
}) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")

  const isBusy = loading || loadingProvider !== null

  useEffect(() => {
    onEmailChange(email)
  }, [email, onEmailChange])

  const handleProviderSignUp = async (provider: OAuthProvider) => {
    setError("")
    setInfo("")
    setLoadingProvider(provider)

    const { error: authError } = await signInWithOAuth(provider)

    if (authError) {
      setError(
        translateError(
          authError.message,
          `Inscription ${providerLabel[provider]} indisponible pour le moment.`
        )
      )
    }

    setLoadingProvider(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setInfo("")

    if (!firstName.trim() || !lastName.trim()) {
      setError("Veuillez renseigner le prénom et le nom.")
      return
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.")
      return
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }

    setLoading(true)

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`,
        },
      },
    })

    if (authError) {
      setError(
        translateError(authError.message, "Impossible de créer le compte pour le moment.")
      )
    } else {
      if (data.session) {
        localStorage.setItem("gui_builder_new_user", "true")
        onNewUser()
        setInfo("Compte créé et connecté. Redirection en cours...")
      } else {
        setInfo("Compte créé. Vérifiez votre e-mail pour finaliser l'inscription.")
      }
    }

    setLoading(false)
  }

  return (
    <main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
      <div className="relative hidden h-full flex-col border-r border-border/60 bg-secondary/25 p-10 lg:flex">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />

        <div className="relative z-10">
          <BrandLogo withText />

          <div className="mt-10 max-w-md space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-300/80">
              Animation active
            </p>
            <h2 className="text-3xl font-semibold leading-tight">
              Créez avec providers
              <br />
              ou en mode classique.
            </h2>
            <p className="text-base text-muted-foreground">
              Google, Apple, GitHub ou formulaire complet avec prénom, nom, e-mail
              et mot de passe.
            </p>
          </div>
        </div>

        <div className="z-10 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-xl">
              "Notorious PY nous aide à livrer plus vite, avec une qualité visuelle stable."
            </p>
            <footer className="font-mono text-sm font-semibold">Équipe Produit</footer>
          </blockquote>
        </div>

        <div className="absolute inset-0 opacity-95">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>

      <div className="relative flex min-h-screen flex-col justify-center px-8">
        <CloseCanvasButton onClose={onBackToCanvas} />
        <div aria-hidden className="absolute inset-0 -z-10 opacity-65">
          <div className="absolute right-0 top-0 h-[80rem] w-[35rem] -translate-y-[22rem] rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,rgba(255,255,255,0.07)_0,rgba(255,255,255,0.02)_50%,rgba(255,255,255,0.01)_80%)]" />
          <div className="absolute right-0 top-0 h-[80rem] w-[15rem] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.01)_80%,transparent_100%)] translate-y-[-50%] translate-x-[5%]" />
          <div className="absolute right-0 top-0 h-[80rem] w-[15rem] -translate-y-[22rem] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.01)_80%,transparent_100%)]" />
        </div>

        <Button className="absolute left-5 top-7" variant="ghost" onClick={onSwitchSignIn}>
          <ChevronLeft data-icon="inline-start" />
          Connexion
        </Button>

        <div className="mx-auto w-full max-w-md space-y-5">
          <AuthBrandBlock className="mb-2" />

          <div className="flex flex-col space-y-1">
            <h1 className="text-2xl font-bold tracking-wide">Créer un compte</h1>
            <p className="text-base text-muted-foreground">
              Choisissez un provider ou renseignez les champs classiques.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full"
              variant="outline"
              type="button"
              onClick={() => void handleProviderSignUp("google")}
              disabled={isBusy}
            >
              {loadingProvider === "google" ? (
                <Loader2 className="animate-spin" />
              ) : (
                <GoogleIcon data-icon="inline-start" />
              )}
              Continuer avec Google
            </Button>
            <Button
              className="w-full"
              variant="outline"
              type="button"
              onClick={() => void handleProviderSignUp("apple")}
              disabled={isBusy}
            >
              {loadingProvider === "apple" ? (
                <Loader2 className="animate-spin" />
              ) : (
                <AppleIcon data-icon="inline-start" />
              )}
              Continuer avec Apple
            </Button>
            <Button
              className="w-full"
              variant="outline"
              type="button"
              onClick={() => void handleProviderSignUp("github")}
              disabled={isBusy}
            >
              {loadingProvider === "github" ? (
                <Loader2 className="animate-spin" />
              ) : (
                <GithubIcon data-icon="inline-start" />
              )}
              Continuer avec GitHub
            </Button>
          </div>

          <AuthDivider>OU INSCRIPTION CLASSIQUE</AuthDivider>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="signup-first-name">Prénom</FieldLabel>
                <Input
                  id="signup-first-name"
                  placeholder="Votre prénom"
                  value={firstName}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setFirstName(event.target.value)
                  }
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="signup-last-name">Nom</FieldLabel>
                <Input
                  id="signup-last-name"
                  placeholder="Votre nom"
                  value={lastName}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setLastName(event.target.value)
                  }
                  required
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="signup-email">Adresse e-mail</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="signup-email"
                  className="pl-10"
                  placeholder="votre.email@exemple.com"
                  type="email"
                  value={email}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(event.target.value)
                  }
                  required
                />
                <InputGroupAddon align="inline-start">
                  <AtSign />
                </InputGroupAddon>
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel htmlFor="signup-password">Mot de passe</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="signup-password"
                  className="pl-10"
                  type="password"
                  placeholder="Minimum 6 caractères"
                  value={password}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(event.target.value)
                  }
                  required
                />
                <InputGroupAddon align="inline-start">
                  <LockKeyhole />
                </InputGroupAddon>
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel htmlFor="signup-password-confirm">Confirmer le mot de passe</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="signup-password-confirm"
                  className="pl-10"
                  type="password"
                  placeholder="Répétez le mot de passe"
                  value={confirmPassword}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setConfirmPassword(event.target.value)
                  }
                  required
                />
                <InputGroupAddon align="inline-start">
                  <LockKeyhole />
                </InputGroupAddon>
              </InputGroup>
            </Field>

            <Button className="w-full" type="submit" disabled={isBusy}>
              {loading ? <Loader2 className="animate-spin" /> : null}
              {loading ? "Création..." : "Créer mon compte"}
            </Button>
          </form>

          {error ? <AuthError message={error} /> : null}
          {info ? <AuthInfo message={info} /> : null}

          <p className="mt-8 text-sm text-muted-foreground">
            En continuant, vous acceptez les{" "}
            <a className="underline underline-offset-4 hover:text-primary" href="#" onClick={(e) => e.preventDefault()}>
              Conditions d'utilisation
            </a>{" "}
            et la{" "}
            <a className="underline underline-offset-4 hover:text-primary" href="#" onClick={(e) => e.preventDefault()}>
              Politique de confidentialité
            </a>
            .
          </p>

          <p className="text-center text-xs text-muted-foreground">
            Déjà inscrit ?{" "}
            <button
              className="underline underline-offset-4 hover:text-primary"
              onClick={onSwitchSignIn}
              type="button"
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>
    </main>
  )
}

function ResetOtpAuth7({
  initialEmail,
  onEmailChange,
  onBack,
  onDone,
  onBackToCanvas,
}: SharedAuthProps & {
  onBack: () => void
  onDone: () => void
}) {
  const [step, setStep] = useState<ResetStep>("email")
  const [email, setEmail] = useState(initialEmail)
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")

  useEffect(() => {
    onEmailChange(email)
  }, [email, onEmailChange])

  useEffect(() => {
    let active = true

    if (email) {
      return () => {
        active = false
      }
    }

    void supabase.auth.getUser().then(({ data }) => {
      if (!active) {
        return
      }
      if (data.user?.email) {
        setEmail(data.user.email)
      }
    })

    return () => {
      active = false
    }
  }, [email])

  const transparentCells = useMemo(
    () =>
      new Set([
        0, 4, 9, 14, 18, 22, 26, 31, 36, 40, 44, 48, 53, 58, 62, 66, 70, 76,
        80, 84, 89, 94, 98, 102, 108, 111, 112, 116, 120, 126, 130, 135, 138,
        144, 149, 154, 160, 163, 166, 171, 176, 183, 184, 189, 194, 199, 207,
        212, 217, 222,
      ]),
    []
  )

  const cells = useMemo(() => Array.from({ length: 224 }, (_, i) => i), [])

  const handleSendCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setInfo("")

    if (!email) {
      setError("Saisissez votre e-mail avant de continuer.")
      return
    }

    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: window.location.origin,
      },
    })

    if (authError) {
      setError(
        translateError(authError.message, "Impossible d'envoyer le code OTP.")
      )
    } else {
      setOtp("")
      setStep("otp")
      setInfo("Code OTP envoyé. Vérifiez votre boîte e-mail.")
    }

    setLoading(false)
  }

  const handleResend = async () => {
    setError("")
    setInfo("")

    if (!email) {
      setError("Saisissez votre e-mail avant de renvoyer le code.")
      setStep("email")
      return
    }

    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: window.location.origin,
      },
    })

    if (authError) {
      setError(
        translateError(authError.message, "Impossible de renvoyer le code OTP.")
      )
    } else {
      setInfo("Un nouveau code OTP a été envoyé à votre e-mail.")
    }

    setLoading(false)
  }

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setInfo("")

    if (!email) {
      setError("Saisissez votre e-mail.")
      setStep("email")
      return
    }

    if (otp.length !== 6) {
      setError("Le code OTP doit contenir 6 chiffres.")
      return
    }

    setLoading(true)

    const { error: authError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    })

    if (authError) {
      setError(
        translateError(authError.message, "Code OTP invalide ou expiré.")
      )
      setLoading(false)
      return
    }

    setInfo("Code validé. Redirection...")
    window.setTimeout(() => {
      onDone()
    }, 900)
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      <CloseCanvasButton onClose={onBackToCanvas} />
      <div className="absolute inset-0 grid grid-cols-[repeat(20,6rem)] grid-rows-[repeat(12,7rem)] bg-muted/35 *:border *:border-border/60 md:grid-cols-[repeat(20,7.5rem)] md:grid-rows-[repeat(12,7.5rem)]">
        {cells.map((cell) => (
          <div
            key={cell}
            className={transparentCells.has(cell) ? "bg-transparent" : "bg-background"}
          />
        ))}
      </div>

      <div className="relative z-20 flex h-full w-full items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <div className="relative">
            {step === "email" ? (
              <Card className="mx-auto w-full border-border/70 bg-background/95 shadow-xl">
                <form onSubmit={handleSendCode}>
                  <CardHeader className="text-center">
                    <CardTitle>Réinitialiser le mot de passe</CardTitle>
                    <CardDescription>
                      Entrez votre adresse e-mail pour recevoir le code OTP.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    <Field>
                      <FieldLabel htmlFor="reset-email">Adresse e-mail</FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          id="reset-email"
                          className="pl-10"
                          placeholder="nom@exemple.com"
                          type="email"
                          value={email}
                          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                            setEmail(event.target.value)
                          }
                          required
                        />
                        <InputGroupAddon align="inline-start">
                          <AtSign />
                        </InputGroupAddon>
                      </InputGroup>
                    </Field>

                    {error ? <AuthError message={error} /> : null}
                    {info ? <AuthInfo message={info} /> : null}
                  </CardContent>

                  <CardFooter className="flex-col items-stretch gap-3">
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="animate-spin" /> : null}
                      {loading ? "Envoi..." : "Envoyer le code OTP"}
                    </Button>
                    <button
                      type="button"
                      className="w-full text-center text-xs text-muted-foreground underline underline-offset-4 hover:text-primary"
                      onClick={onBack}
                    >
                      Retour à la connexion
                    </button>
                  </CardFooter>
                </form>
              </Card>
            ) : (
              <Card className="mx-auto w-full border-border/70 bg-background/95 shadow-xl">
                <CardHeader className="text-center">
                  <CardTitle>Vérifier votre connexion</CardTitle>
                  <CardDescription>
                    Entrez le code de vérification envoyé à{" "}
                    <span className="font-medium">{email || "votre e-mail"}</span>.
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleVerify}>
                  <CardContent className="space-y-5">
                    <Field className="items-center">
                      <FieldLabel htmlFor="otp-verification" className="text-center">
                        Code de vérification
                      </FieldLabel>

                      <InputOTP
                        maxLength={6}
                        id="otp-verification"
                        value={otp}
                        onChange={setOtp}
                        containerClassName="justify-center"
                        required
                      >
                        <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-10 *:data-[slot=input-otp-slot]:w-9 *:data-[slot=input-otp-slot]:text-base">
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator className="mx-2" />
                        <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-10 *:data-[slot=input-otp-slot]:w-9 *:data-[slot=input-otp-slot]:text-base">
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>

                      <FieldDescription className="text-center">
                        Je n'ai plus accès à cette adresse e-mail.{" "}
                        <button
                          type="button"
                          className="underline underline-offset-4 hover:text-primary"
                          onClick={handleResend}
                          disabled={loading}
                        >
                          Renvoyer
                        </button>
                      </FieldDescription>
                    </Field>

                    {error ? <AuthError message={error} /> : null}
                    {info ? <AuthInfo message={info} /> : null}
                  </CardContent>

                  <CardFooter className="flex-col items-stretch gap-3">
                    <Field>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : null}
                        {loading ? "Vérification..." : "Vérifier"}
                      </Button>
                      <div className="text-center text-sm text-muted-foreground">
                        Un problème de connexion ?{" "}
                        <a
                          href="#"
                          className="underline underline-offset-4 transition-colors hover:text-primary"
                          onClick={(e) => e.preventDefault()}
                        >
                          Contacter le support
                        </a>
                        <span aria-hidden="true" className="px-1 text-muted-foreground/60">•</span>
                        <button
                          type="button"
                          className="whitespace-nowrap underline underline-offset-4 transition-colors hover:text-primary"
                          onClick={() => {
                            setStep("email")
                            setOtp("")
                            setInfo("")
                            setError("")
                          }}
                        >
                          Changer d'e-mail
                        </button>
                      </div>
                    </Field>
                    <button
                      type="button"
                      className="mt-1 w-full text-center text-xs text-muted-foreground underline underline-offset-4 hover:text-primary"
                      onClick={onBack}
                    >
                      Retour à la connexion
                    </button>
                  </CardFooter>
                </form>
              </Card>
            )}

            <CornerMark className="left-0 top-0 -translate-x-[calc(50%+0.5px)] -translate-y-[calc(50%+0.5px)]" />
            <CornerMark className="right-0 top-0 translate-x-[calc(50%+0.5px)] -translate-y-[calc(50%+0.5px)]" />
            <CornerMark className="bottom-0 left-0 -translate-x-[calc(50%+0.5px)] translate-y-[calc(50%+0.5px)]" />
            <CornerMark className="bottom-0 right-0 translate-x-[calc(50%+0.5px)] translate-y-[calc(50%+0.5px)]" />
          </div>
        </div>
      </div>
    </div>
  )
}

export const AuthPage: React.FC<{
  onNewUser: () => void
  forceResetPassword?: boolean
  onResetComplete?: () => void
  onBackToCanvas?: () => void
}> = ({ onNewUser, forceResetPassword, onResetComplete, onBackToCanvas }) => {
  const [mode, setMode] = useState<Mode>(forceResetPassword ? "reset" : "signin")
  const [sharedEmail, setSharedEmail] = useState("")

  useEffect(() => {
    if (forceResetPassword) {
      setMode("reset")
    }
  }, [forceResetPassword])

  const handleResetDone = () => {
    setMode("signin")
    onResetComplete?.()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="auth-theme-dark h-screen w-screen bg-background text-foreground"
    >
      {mode === "signin" ? (
        <SignInAuth11
          initialEmail={sharedEmail}
          onEmailChange={setSharedEmail}
          onSwitchSignUp={() => setMode("signup")}
          onSwitchReset={() => setMode("reset")}
          onBackToCanvas={onBackToCanvas}
        />
      ) : null}

      {mode === "signup" ? (
        <SignUpAuth5
          initialEmail={sharedEmail}
          onEmailChange={setSharedEmail}
          onSwitchSignIn={() => setMode("signin")}
          onNewUser={onNewUser}
          onBackToCanvas={onBackToCanvas}
        />
      ) : null}

      {mode === "reset" ? (
        <ResetOtpAuth7
          initialEmail={sharedEmail}
          onEmailChange={setSharedEmail}
          onBack={() => setMode("signin")}
          onDone={handleResetDone}
          onBackToCanvas={onBackToCanvas}
        />
      ) : null}
    </motion.div>
  )
}
