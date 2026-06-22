import { ResumeData, defaultSections } from "@/types/resume"

export const sampleResumeData: ResumeData = {
  userId: "preview",
  title: "Sample Resume",
  template: "classic",
  personalInfo: {
    fullName: "Alexandra Chen",
    email: "alex@example.com",
    phone: "+1 (555) 234-5678",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/alexchen",
    website: "alexchen.dev",
  },
  summary:
    "Results-driven software engineer with 5+ years of experience building scalable web applications. Passionate about clean architecture, performance, and developer experience.",
  experience: [
    {
      id: "1",
      company: "Acme Technologies",
      position: "Senior Software Engineer",
      startDate: "Jan 2021",
      endDate: "Present",
      current: true,
      location: "San Francisco, CA",
      description:
        "Led migration to microservices architecture serving 2M+ users\nReduced API latency by 40% through caching optimisation\nMentored and grew a team of 4 junior engineers",
    },
    {
      id: "2",
      company: "StartupCo",
      position: "Software Engineer",
      startDate: "Jun 2019",
      endDate: "Dec 2020",
      current: false,
      location: "Remote",
      description:
        "Built React frontend from scratch for B2B SaaS platform\nIntegrated Stripe payments and third-party APIs",
    },
  ],
  education: [
    {
      id: "1",
      school: "University of California, Berkeley",
      degree: "B.Sc. Computer Science",
      field: "Computer Science",
      startDate: "2015",
      endDate: "2019",
      location: "Berkeley, CA",
    },
  ],
  skills: ["React", "TypeScript", "Node.js", "Python", "AWS", "PostgreSQL", "Docker"],
  projects: [
    {
      id: "1",
      name: "OpenMetrics Dashboard",
      description: "Real-time analytics dashboard with WebSocket streaming and D3.js visualisations",
      link: "github.com/alexchen/openmetrics",
      technologies: ["React", "D3.js", "WebSocket", "Node.js"],
    },
  ],
  sections: defaultSections,
  includeCover: false,
  coverTemplate: "modern",
}
