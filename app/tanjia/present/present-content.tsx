'use client';

import { motion } from "framer-motion";
import { GradientHeading } from "@/src/components/ui/gradient-heading";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { SecondLookShare } from "@/src/components/ui/second-look-share";
import { ArrowRight, Lightbulb, AlertCircle, Check } from "lucide-react";

type LeadAnalysis = {
  leadName: string;
  url: string | null;
  growthChanges: string[];
  frictionPoints: string[];
  calmNextSteps: string[];
  rawSummary: string | null;
  analyzedAt: string;
};

type PresentContentProps = {
  secondLookUrl: string;
  leadAnalysis?: LeadAnalysis | null;
};

const secondLookNote = "This gives you a clearer way to see how growth has changed what you're carrying.";

export function PresentContent({ secondLookUrl, leadAnalysis }: PresentContentProps) {
  // If we have lead-specific analysis, show that
  if (leadAnalysis) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex flex-col gap-8"
      >
        <div className="space-y-4 text-neutral-900">
          <GradientHeading
            leading={`A quiet look at`}
            anchor={leadAnalysis.leadName}
            size="xl"
          />

          {leadAnalysis.rawSummary && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-lg leading-relaxed text-neutral-700 sm:text-xl"
            >
              {leadAnalysis.rawSummary}
            </motion.p>
          )}
        </div>

        {/* Growth Changes */}
        {leadAnalysis.growthChanges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-semibold text-amber-900">How growth changed things</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {leadAnalysis.growthChanges.map((change, i) => (
                  <p key={i} className="text-sm text-amber-800 flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                    {change}
                  </p>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Friction Points */}
        {leadAnalysis.frictionPoints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-rose-200 bg-rose-50/50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  <p className="text-sm font-semibold text-rose-900">Where friction shows up</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {leadAnalysis.frictionPoints.map((point, i) => (
                  <p key={i} className="text-sm text-rose-800 flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                    {point}
                  </p>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Calm Next Steps */}
        {leadAnalysis.calmNextSteps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-900">Calm next steps</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {leadAnalysis.calmNextSteps.map((step, i) => (
                  <p key={i} className="text-sm text-emerald-800 flex items-start gap-2">
                    <span className="shrink-0 text-emerald-500 font-medium">{i + 1}.</span>
                    {step}
                  </p>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <p className="text-sm text-neutral-600">If helpful, share this link</p>
          <SecondLookShare url={secondLookUrl} note={secondLookNote} />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-neutral-400"
        >
          Analyzed {new Date(leadAnalysis.analyzedAt).toLocaleDateString()} · The 2ndmynd Loop: Listen → Clarify → Map → Decide → Support
        </motion.p>
      </motion.div>
    );
  }

  // Default generic presentation
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col gap-8"
    >
      <div className="space-y-4 text-neutral-900">
        <GradientHeading
          leading="Growth doesn't just add work."
          anchor="It changes responsibility."
          size="xl"
        />

        <div className="space-y-4 text-lg leading-relaxed text-neutral-700 sm:text-xl">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Most owner-led businesses don't struggle because they're doing something wrong. 
            They struggle because growth quietly reshapes decisions, follow-ups, and coordination 
            — faster than systems adapt.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            2ndmynd gives you a <strong>Second Look</strong> at what growth changed so you can 
            see what to simplify, what to support, and what to stop carrying alone.
          </motion.p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="pb-2">
            <p className="text-sm font-semibold text-neutral-900">What happens next</p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-relaxed text-neutral-700 sm:text-base">
            <p>We look at what you already use (and how work actually moves today)</p>
            <p>We surface the pressure points that are stealing time and clarity</p>
            <p>We map calm next steps you can take without adding another system</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <p className="text-sm text-neutral-600">If helpful</p>
        <SecondLookShare url={secondLookUrl} note={secondLookNote} />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-xs text-neutral-400"
      >
        The 2ndmynd Loop: Listen → Clarify → Map → Decide → Support
      </motion.p>
    </motion.div>
  );
}
