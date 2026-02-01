import { SignUp as ClerkSignUp } from "@clerk/clerk-react";

export default function SignUpClerk() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30" data-testid="page-signup">
      <ClerkSignUp 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
          }
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
      />
    </div>
  );
}
