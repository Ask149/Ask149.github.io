// src/content/resume.ts
//
// Typed source-of-truth for the /resume HTML render.
// Hand-authored — NOT parsed from LaTeX. Edit this file to keep the web resume
// accurate; the three PDFs in `public/resume/` are per-role variants (SWE/MLE/Systems)
// generated from `~/Projects/active/resume/`.

export interface ResumeExperience {
  company: string;
  title: string;
  dates: string; // e.g. "Jul 2024 — present"
  location: string;
  bullets: string[];
  url?: string;
}

export interface ResumeEducation {
  school: string;
  degree: string;
  dates: string;
  honors?: string;
  url?: string;
}

export interface ResumeSelectedWork {
  title: string;
  url?: string;
  blurb: string;
}

export interface ResumeData {
  name: string;
  tagline: string;
  now: string;
  experience: ResumeExperience[];
  internships: ResumeExperience[];
  education: ResumeEducation[];
  selectedWork: ResumeSelectedWork[];
  skills: { primary: string[]; secondary: string[] };
  contact: {
    email: string;
    phone?: string;
    location: string;
    github: string;
    linkedin: string;
    twitter?: string;
  };
  lastUpdated: string; // ISO date
}

export const resume: ResumeData = {
  name: "Ashish Kshirsagar",
  tagline:
    "Software Engineer · Microsoft · 5+ years building Java/Scala distributed systems at consumer scale",
  now: "Software Engineer with 5+ years at Microsoft, Amazon, and Barclays designing Java, Spring Boot and microservices-based enterprise systems at consumer scale. At Amazon, architected distributed Java/Scala REST services on Kafka/DynamoDB serving 10B+ low-latency requests/year; at Microsoft, drove LLM-powered log triage cutting cost 9x and MTTR 30%. Strong in concurrent programming, REST API design, data caching, and secure scalable backend platforms.",
  experience: [
    {
      company: "Microsoft Corporation",
      url: "https://www.microsoft.com/",
      title: "Software Engineer",
      dates: "Jul 2024 — present",
      location: "Seattle, WA",
      bullets: [
        "Mitigated 15+ Windows OS update issues by leading incidents and WinDbg post-mortems.",
        "Reduced recovery-update MTTR by 30% by building a C++ CI validation pipeline in Azure DevOps.",
        "Cut on-call onboarding from weeks to days by standardizing runbooks and SLO playbooks into repeatable triage procedures.",
        "Reduced LLM-based log-triage cost by 9× by implementing routing and prompt templates while preserving signal.",
      ],
    },
    {
      company: "Amazon Development Center India Pvt Ltd",
      url: "https://www.amazon.com/",
      title: "Software Development Engineer II",
      dates: "Oct 2021 — Aug 2022",
      location: "Bangalore, India",
      bullets: [
        "Enabled launch of a new UK payment method for 80K customers by owning end-to-end delivery across Scala services and AWS integrations.",
        "Scaled distributed payment components to 10B+ annual requests by architecting Java services backed by DynamoDB and automating operational telemetry.",
        "Reduced payment-method onboarding effort from 3 months to 2 weeks by driving app-to-app redirection/fallback design and coordinating away-team changes.",
      ],
    },
    {
      company: "Barclays Global Service Pvt Ltd",
      url: "https://www.barclays.in/global-service-centre/btci/",
      title: "Software Developer",
      dates: "Jul 2019 — Sep 2021",
      location: "Pune, India",
      bullets: [
        "Reduced QA effort by 33% by automating CI/CD and test pipelines for Java Spring services.",
        "Supported 5M+ US customers by owning Java services and production operations.",
        "Automated 20% of fraud workflows by delivering APIs and integrating Python services with React/Node.js and MySQL.",
      ],
    },
  ],
  internships: [
    {
      company: "Tesla Inc",
      url: "https://www.tesla.com/",
      title: "Software Engineering Intern",
      dates: "Jan 2024 — May 2024",
      location: "San Francisco Bay Area, California",
      bullets: [
        "Reduced quoting manual effort by 60% and increased throughput by 30% by building a containerized .NET/C# service for Megapack (Docker, Kubernetes, Kafka; PostgreSQL, MongoDB).",
      ],
    },
    {
      company: "Google LLC",
      url: "https://www.google.com/",
      title: "Software Engineering Intern",
      dates: "May 2023 — Aug 2023",
      location: "Sunnyvale, California",
      bullets: [
        "Improved p99 latency by 5% for a product serving 1B+ users by developing journey APIs (Java, Protobuf/gRPC) on GCP.",
      ],
    },
  ],
  education: [
    {
      school: "Arizona State University",
      url: "https://www.asu.edu/",
      degree: "M.S. Computer Science",
      dates: "Aug 2022 — May 2024",
      honors: "GPA 4.0/4.0",
    },
    {
      school: "Pune Institute of Computer Technology",
      url: "https://pict.edu/",
      degree: "B.E. Computer Engineering",
      dates: "Jul 2015 — May 2019",
    },
  ],
  selectedWork: [
    {
      title: "klarEDA",
      url: "https://github.com/klarEDA/klar-EDA",
      blurb:
        "Open-source Python library that automates common EDA steps with one-call preprocessing and visualization.",
    },
    {
      title: "High-Throughput Graph Processing Pipeline",
      blurb:
        "Real-time graph pipeline (C++, Docker, Kafka, Neo4j) that improved processing throughput by 50%.",
    },
  ],
  skills: {
    primary: [
      "Java",
      "Go",
      "C++",
      "C#",
      "Python",
      "Scala",
      "Distributed systems",
      "Microservices",
    ],
    secondary: [
      ".NET",
      "Spring",
      "React",
      "Node.js",
      "DynamoDB",
      "PostgreSQL",
      "MySQL",
      "MongoDB",
      "Docker",
      "Kubernetes",
      "Kafka",
      "gRPC",
      "GCP",
      "Azure",
      "Azure DevOps",
      "WinDbg",
    ],
  },
  contact: {
    email: "ashishkshirsagar10@gmail.com",
    phone: "+91 7276422736",
    location: "Pune, India",
    github: "https://github.com/Ask149",
    linkedin: "https://www.linkedin.com/in/ask149/",
  },
  lastUpdated: "2026-05-17",
};
