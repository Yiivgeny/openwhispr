import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ExternalLink, Settings, Stethoscope } from "lucide-react";
import { Button } from "../ui/button";
import { getTranscriptionProviders } from "../../models/ModelRegistry";
import { USE_CASE_IDS } from "./useCases";

const CORTI_CONSOLE_URL = "https://console.corti.app";

interface FinishStepProps {
  isCloudUser: boolean;
  useCases: string[];
  onFinish: (openSettings: boolean) => void;
  isFinishing: boolean;
}

export default function FinishStep({
  isCloudUser,
  useCases,
  onFinish,
  isFinishing,
}: FinishStepProps) {
  const { t } = useTranslation();

  // The Corti pitch only renders once the Corti provider ships in the model
  // registry (separate PR) — until then healthcare users see the default finish.
  const cortiAvailable = getTranscriptionProviders().some((p) => p.id === "corti");
  const [showCorti, setShowCorti] = useState(
    cortiAvailable && useCases.includes(USE_CASE_IDS.healthcare)
  );

  if (showCorti) {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-0.5">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Stethoscope className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            {t("onboarding.finish.corti.title")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("onboarding.finish.corti.description")}
          </p>
        </div>

        <div className="rounded-md border border-border bg-surface-1 p-3 space-y-2">
          <p className="text-xs text-muted-foreground leading-snug">
            {t("onboarding.finish.corti.credit")}
          </p>
          <button
            onClick={() => window.electronAPI?.openExternal?.(CORTI_CONSOLE_URL)}
            className="inline-flex items-center gap-1 text-xs text-link hover:underline"
          >
            {t("onboarding.finish.corti.createAccount")}
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCorti(false)}
            disabled={isFinishing}
            className="h-8 px-5 rounded-full text-xs"
          >
            {t("onboarding.finish.corti.skip")}
          </Button>
          <Button
            onClick={() => onFinish(true)}
            disabled={isFinishing}
            className="h-8 px-6 rounded-full text-xs"
          >
            <Settings className="w-3.5 h-3.5" />
            {t("onboarding.finish.corti.setUp")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center space-y-0.5">
        <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <Check className="w-6 h-6 text-green-500" />
        </div>
        <h2 className="text-lg font-semibold text-foreground tracking-tight">
          {t("onboarding.finish.title")}
        </h2>
        <p className="text-xs text-muted-foreground">
          {isCloudUser
            ? t("onboarding.finish.cloudDescription")
            : t("onboarding.finish.localDescription")}
        </p>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {t("onboarding.finish.cleanupNote")}
      </p>

      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          onClick={() => onFinish(true)}
          disabled={isFinishing}
          className="h-8 px-5 rounded-full text-xs"
        >
          <Settings className="w-3.5 h-3.5" />
          {t("onboarding.finish.openSettings")}
        </Button>
        <Button
          variant="success"
          onClick={() => onFinish(false)}
          disabled={isFinishing}
          className="h-8 px-6 rounded-full text-xs"
        >
          <Check className="w-3.5 h-3.5" />
          {t("onboarding.finish.skipForNow")}
        </Button>
      </div>
    </div>
  );
}
