import { useI18n } from '../../ui/i18n/i18n.tsx';
import { LanguagePackOffer } from '../../ui/language-pack-offer.tsx';
import { UI_LANGUAGES, type UiLanguage } from '../../ui/languages.ts';
import { ChoiceCards, Lead, StepHeading } from './step-parts.tsx';
import type { StepProps } from './step-props.ts';

const OPTIONS = UI_LANGUAGES.map((language) => ({
  value: language.value,
  title: <span lang={language.value}>{language.label}</span>,
}));

/**
 * The interface and explanation language (N7b, N10). Choosing one switches the interface at
 * once; it is saved as `uiLanguage` on Next (D44). French and Spanish offer their pack (N9).
 */
export function StepLanguage({ wizard }: Pick<StepProps, 'wizard'>) {
  const { t, setLanguage } = useI18n();
  const { language } = wizard.draft;
  const choose = (value: UiLanguage) => {
    wizard.setDraft({ language: value });
    void setLanguage(value);
  };
  return (
    <>
      <StepHeading>{t('onboarding.languageHeading')}</StepHeading>
      <Lead>{t('onboarding.languageLead')}</Lead>
      <ChoiceCards<UiLanguage>
        label={t('onboarding.languageHeading')}
        options={OPTIONS}
        value={language}
        onChange={choose}
      />
      <LanguagePackOffer language={language} />
    </>
  );
}
