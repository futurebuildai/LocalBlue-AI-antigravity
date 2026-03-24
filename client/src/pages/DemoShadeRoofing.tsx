import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Target,
  FileText,
  Mail,
  BarChart3,
  Network,
  Loader2,
  CheckCircle,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Target,
    title: "AI Lead Scoring",
    description:
      "Every lead is auto-scored on urgency, project fit, and conversion probability. High-priority leads surface instantly so you never miss a hot prospect.",
  },
  {
    icon: FileText,
    title: "Bid Advisor",
    description:
      "AI analyzes incoming RFQs, researches market rates, and recommends competitive bid amounts with line-item breakdowns you can review and send.",
  },
  {
    icon: Brain,
    title: "Content Optimizer",
    description:
      "Monthly AI review of your website content. Get suggested headline refreshes, seasonal messaging, and conversion-focused copy — all pending your approval.",
  },
  {
    icon: Mail,
    title: "Outreach Agent",
    description:
      "Automated email drafts to local builders and general contractors. The AI identifies potential partners and crafts personalized introductions for your review.",
  },
  {
    icon: BarChart3,
    title: "Analytics Insights",
    description:
      "Weekly AI-powered traffic summaries highlighting trends, top sources, keyword movements, and actionable recommendations to grow your online presence.",
  },
  {
    icon: Network,
    title: "FB Brain Integration",
    description:
      "Receive RFQs directly from the builder ecosystem. View project details, scope items, and deadlines — then submit bids without leaving your portal.",
  },
];

export default function DemoShadeRoofing() {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLaunchDemo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiRequest("POST", "/api/demo/auto-login");
      const data = await res.json();
      if (data.success) {
        navigate("/tenant/");
      } else {
        setError(data.error || "Failed to start demo session");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0f2744] to-slate-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/demo">
            <Button variant="ghost" className="text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Demo
            </Button>
          </Link>
          <Badge variant="secondary" className="bg-[#1E3A5F]/50 text-blue-200 border-[#1E3A5F]">
            Live Demo Environment
          </Badge>
        </div>

        {/* Hero */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-14 w-14 rounded-2xl bg-[#1E3A5F] flex items-center justify-center border border-blue-400/20">
              <Shield className="h-7 w-7 text-blue-300" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Shade Roofing
          </h1>
          <p className="text-xl text-blue-200 mb-2">
            Admin Portal Demo
          </p>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Explore a fully-featured contractor admin portal with realistic data.
            AI agents, CRM, RFQ management, analytics, and more — all powered by LocalBlue.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="max-w-5xl mx-auto mb-12">
          <h2 className="text-lg font-semibold text-slate-300 text-center mb-6">
            What's Inside the Demo
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="bg-slate-800/60 border-slate-700 hover:border-blue-500/30 transition-colors"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#1E3A5F]/60 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-5 w-5 text-blue-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Demo Data Summary */}
        <div className="max-w-3xl mx-auto mb-10">
          <Card className="bg-slate-800/40 border-slate-700">
            <CardContent className="p-6">
              <h3 className="font-semibold text-white mb-4 text-center">
                Pre-Loaded Demo Data
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {[
                  { label: "CRM Leads", value: "8" },
                  { label: "RFQs", value: "3" },
                  { label: "AI Executions", value: "10" },
                  { label: "Days of Analytics", value: "30" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl font-bold text-blue-300">
                      {stat.value}
                    </div>
                    <div className="text-xs text-slate-400">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {[
                  "5 Pages",
                  "5 Testimonials",
                  "6 Service Prices",
                  "6 AI Agents",
                  "SEO Metrics",
                  "Content Reviews",
                ].map((item) => (
                  <Badge
                    key={item}
                    variant="outline"
                    className="border-slate-600 text-slate-400"
                  >
                    <CheckCircle className="h-3 w-3 mr-1 text-green-400" />
                    {item}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="max-w-xl mx-auto text-center">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
          <Button
            size="lg"
            onClick={handleLaunchDemo}
            disabled={isLoading}
            className="bg-[#1E3A5F] hover:bg-[#264d7a] text-white px-8 py-6 text-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Starting Demo...
              </>
            ) : (
              <>
                Launch Demo Portal
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
          <p className="text-slate-500 text-sm mt-3">
            No sign-up required. You'll be logged in as Marcus Shade, owner.
          </p>
        </div>

        {/* Footer CTA */}
        <div className="max-w-3xl mx-auto mt-16">
          <Card className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-blue-500/30">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-bold text-white mb-3">
                Ready to Build Your Own?
              </h2>
              <p className="text-blue-200 mb-4">
                Create your contractor website in under 5 minutes with AI-guided onboarding.
              </p>
              <Link href="/signup">
                <Button size="lg" variant="secondary">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
