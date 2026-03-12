"use client";

interface Feature {
  name: string;
  description: string;
  priority: "high" | "medium" | "low";
}

interface TechStack {
  frontend: string[];
  backend: string[];
  database: string[];
  ai: string[];
}

interface Blueprint {
  productName: string;
  tagline: string;
  targetAudience: string[];
  problemSolved: string;
  coreFeatures: Feature[];
  techStack: TechStack;
  integrations: string[];
  revenueModel: string;
  competitiveEdge: string;
}

interface Props {
  data: Blueprint;
}

const priorityColor = {
  high: { bg: "#f3f3f3", text: "#0d0d0d" },
  medium: { bg: "#f3f3f3", text: "#6b6b6b" },
  low: { bg: "#f9f9f9", text: "#a3a3a3" },
};

const Tag = ({ label }: { label: string }) => (
  <span
    style={{
      display: "inline-flex",
      padding: "3px 10px",
      background: "var(--surface-2)",
      border: "1px solid var(--border)",
      borderRadius: 20,
      fontSize: 12,
      color: "var(--text-3)",
      marginRight: 6,
      marginBottom: 6,
    }}
  >
    {label}
  </span>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div
    style={{
      marginBottom: 24,
      paddingBottom: 24,
      borderBottom: "1px solid var(--border)",
    }}
  >
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        color: "var(--text-4)",
        marginBottom: 10,
      }}
    >
      {title}
    </div>
    {children}
  </div>
);

export default function BlueprintViewer({ data }: Props) {
  return (
    <div
      style={{
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        padding: 24,
        width: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: 24,
          paddingBottom: 24,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <h2
          style={{
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "-0.4px",
            marginBottom: 6,
          }}
        >
          {data.productName}
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.6 }}>
          {data.tagline}
        </p>
      </div>

      {/* Problem */}
      <Section title="Problem Solved">
        <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7 }}>
          {data.problemSolved}
        </p>
      </Section>

      {/* Target Audience */}
      <Section title="Target Audience">
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {data.targetAudience.map((a) => (
            <Tag key={a} label={a} />
          ))}
        </div>
      </Section>

      {/* Core Features */}
      <Section title="Core Features">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.coreFeatures.map((f) => (
            <div
              key={f.name}
              style={{
                padding: "12px 14px",
                border: "1px solid var(--border)",
                borderRadius: "var(--r)",
                background: "var(--surface)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>
                  {f.name}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    padding: "2px 8px",
                    borderRadius: 20,
                    background: priorityColor[f.priority]?.bg ?? "#f3f3f3",
                    color: priorityColor[f.priority]?.text ?? "#6b6b6b",
                    border: "1px solid var(--border)",
                    textTransform: "capitalize",
                  }}
                >
                  {f.priority}
                </span>
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-3)",
                  lineHeight: 1.6,
                }}
              >
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Tech Stack */}
      <Section title="Tech Stack">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.entries(data.techStack).map(([key, values]) => (
            <div
              key={key}
              style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "capitalize",
                  color: "var(--text-4)",
                  minWidth: 70,
                  paddingTop: 4,
                }}
              >
                {key}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {values.map((v: string) => (
                  <Tag key={v} label={v} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Revenue Model */}
      <Section title="Revenue Model">
        <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7 }}>
          {data.revenueModel}
        </p>
      </Section>

      {/* Competitive Edge */}
      <Section title="Competitive Edge">
        <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7 }}>
          {data.competitiveEdge}
        </p>
      </Section>

      {/* Integrations */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            color: "var(--text-4)",
            marginBottom: 10,
          }}
        >
          Integrations
        </div>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {data.integrations.map((i) => (
            <Tag key={i} label={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
