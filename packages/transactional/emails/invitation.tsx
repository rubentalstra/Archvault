import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface InvitationEmailProps {
  organizationName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
}

InvitationEmail.PreviewProps = {
  organizationName: "Acme Corp",
  inviterName: "Jane Doe",
  role: "editor",
  inviteUrl: "http://localhost:3000/accept-invitation/abc123",
} satisfies InvitationEmailProps;

export function InvitationEmail({
  organizationName,
  inviterName,
  role,
  inviteUrl,
}: InvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {inviterName} invited you to join {organizationName} on ArchVault
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>ArchVault</Heading>
          <Section style={section}>
            <Text style={text}>
              <strong>{inviterName}</strong> has invited you to join{" "}
              <strong>{organizationName}</strong> as a{role === "admin" ? "n" : ""}{" "}
              <strong>{role}</strong>.
            </Text>
            <Button style={button} href={inviteUrl}>
              Accept Invitation
            </Button>
            <Text style={text}>
              If you don&apos;t want to join, you can safely ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default InvitationEmail;

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

const button = {
  backgroundColor: "#18181b",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600" as const,
  padding: "12px 24px",
  textDecoration: "none",
  display: "inline-block" as const,
  margin: "16px 0",
};
