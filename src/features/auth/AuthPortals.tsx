import { useAuthUI } from "./AuthUI";
import { useSession } from "@/features/auth/SessionProvider";
import SignInDialog from "./SignInDialog";

/**
 * Replace <SignInModal/> and <SignUpModal/> with YOUR existing popup components.
 * They should accept: open, onOpenChange, and onSuccess (optional).
 */
export function AuthPortals() {
  const { signInOpen, signUpOpen, closeAll, openSignUp } = useAuthUI();
  const { signIn } = useSession();

  // ---- EXAMPLE WIRING to your existing components ----
  // If your components have different prop names, just adapt below.
  return (
    <>
      {/* SIGN IN */}
      <SignInModal
        open={signInOpen}
        onOpenChange={(v: boolean) => (v ? null : closeAll())}
        onSubmit={async (email: string, password: string) => {
          await signIn(email.trim(), password);
          closeAll();
        }}
        onGoToSignUp={() => openSignUp()}
      />

      {/* SIGN UP */}
      <SignUpModal
        open={signUpOpen}
        onOpenChange={(v: boolean) => (v ? null : closeAll())}
        // You can call your existing signUp() here; if you sign in right after, also call closeAll()
      />
    </>
  );
}

/* ---------- PLACEHOLDERS ----------
Delete these if you already have real components. They're here only to make TS happy.
*/
function SignInModal(_: any) { return null as any; }
function SignUpModal(_: any) { return null as any; }