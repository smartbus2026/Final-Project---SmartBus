import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const toggleLanguage = async () => {
    const nextLang = i18n.language === "ar" ? "en" : "ar";
    await i18n.changeLanguage(nextLang);
    localStorage.setItem("lang", nextLang);
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="inline-flex items-center gap-2 rounded-xl border border-app-bd/30 bg-app-card2/40 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-app-mu transition-all hover:border-app-am/30 hover:text-app-am"
      title={t("language")}
      aria-label={t("language")}
    >
      <span>{i18n.language === "ar" ? t("arabic") : t("english")}</span>
      <span className="rounded-md bg-app-am/10 px-1.5 py-0.5 text-[9px] text-app-am">
        {i18n.language === "ar" ? t("text_direction_rtl") : t("text_direction_ltr")}
      </span>
    </button>
  );
}
