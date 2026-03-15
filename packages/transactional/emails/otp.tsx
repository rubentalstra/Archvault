import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface OtpEmailProps {
  otp: string;
  type: "sign-in" | "email-verification" | "forget-password";
}

const typeLabels: Record<OtpEmailProps["type"], string> = {
  "sign-in": "Sign In",
  "email-verification": "Email Verification",
  "forget-password": "Password Reset",
};

OtpEmail.PreviewProps = {
  otp: "123456",
  type: "email-verification",
} satisfies OtpEmailProps;

export function OtpEmail({ otp, type }: OtpEmailProps) {
  const label = typeLabels[type];

  return (
    <Html>
      <Head />
      <Preview>
        Your ArchVault {label} code: {otp}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>ArchVault</Heading>
          <Section style={section}>
            <Text style={text}>
              Use the code below to complete your {label.toLowerCase()}.
            </Text>
            <Text style={code}>{otp}</Text>
            <Text style={text}>
              This code expires in 5 minutes. If you didn't request this, you
              can safely ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default OtpEmail;

const body = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: "40px auto",
  padding: "32px",
  maxWidth: "480px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "700" as const,
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const section = {
  textAlign: "center" as const,
};

const text = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#71717a",
};

const code = {
  fontSize: "32px",
  fontWeight: "700" as const,
  letterSpacing: "0.3em",
  color: "#18181b",
  padding: "16px 0",
};
