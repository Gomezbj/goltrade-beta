import React from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { TranslationKey } from '../i18n';

interface Plan {
    titleKey: TranslationKey;
    priceKey: TranslationKey;
    creditsKey?: TranslationKey;
    features: TranslationKey[];
    buttonKey: TranslationKey;
    isRecommended: boolean;
    isCustom: boolean;
    contactLink: string;
}

const plansData: Plan[] = [
    {
        titleKey: 'planBasicTitle',
        priceKey: 'planBasicPrice',
        creditsKey: 'planBasicCredits',
        features: [
            'planFeatureDailySignals',
            'planFeaturePrioritySupport',
            'planFeatureRealTimeAlerts',
            'planFeatureAdvancedAnalysis',
            'planFeatureImportantNotifications',
            'planFeatureAIRecommendations',
        ],
        buttonKey: 'plansButtonSelect',
        isRecommended: false,
        isCustom: false,
        contactLink: 'https://wa.link/lov20a',
    },
    {
        titleKey: 'planProfessionalTitle',
        priceKey: 'planProfessionalPrice',
        creditsKey: 'planProfessionalCredits',
        features: [
            'planFeatureDailySignals',
            'planFeaturePrioritySupport',
            'planFeatureRealTimeAlerts',
            'planFeatureAdvancedAnalysis',
            'planFeatureImportantNotifications',
            'planFeatureAIRecommendations',
        ],
        buttonKey: 'plansButtonSelect',
        isRecommended: true,
        isCustom: false,
        contactLink: 'https://wa.link/lov20a',
    },
    {
        titleKey: 'planInstitutionalTitle',
        priceKey: 'planInstitutionalPrice',
        features: [
            'planFeatureUnlimitedSignals',
            'planFeature247Support',
            'planFeaturePersonalAdvisory',
            'planFeatureRealTimeAlerts',
            'planFeatureExplanatoryContent',
            'planFeatureAIRecommendations',
            'planFeatureReferralBenefits',
        ],
        buttonKey: 'plansButtonContact',
        isRecommended: false,
        isCustom: true,
        contactLink: 'https://wa.link/sgvofy',
    },
];

const PlanCard: React.FC<Plan> = ({ titleKey, priceKey, creditsKey, features, buttonKey, isRecommended, isCustom, contactLink }) => {
    const { t } = useTranslations();

    return (
        <div className={`relative bg-[#0d1a44] rounded-2xl p-8 flex flex-col border border-blue-800 shadow-xl shadow-blue-900/30 transition-all duration-300 ${isRecommended ? 'lg:scale-105 border-blue-500' : 'hover:border-blue-600 hover:shadow-blue-700/40'}`}>
            {isRecommended && (
                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                    <div className="bg-blue-600 text-gold-300 text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full shadow-md">
                        {t('plansRecommended')}
                    </div>
                </div>
            )}
            <div className="flex-grow space-y-6 flex flex-col">
                <div className="text-center">
                    <h3 className="text-2xl font-semibold text-gold-400">{t(titleKey)}</h3>
                </div>
                
                <div className="flex-grow text-center">
                    {isCustom ? (
                        <div className="my-6">
                            <p className="text-5xl font-extrabold text-gold-400">{t(priceKey)}</p>
                        </div>
                    ) : (
                        <div className="my-6 flex items-baseline justify-center">
                            <span className="text-5xl font-extrabold text-gold-400">{t(priceKey)}</span>
                            {creditsKey && <span className="ml-2 text-base font-medium text-secondary-400">{t(creditsKey)}</span>}
                        </div>
                    )}
                    <ul className="space-y-4">
                        {features.map((feature, index) => (
                            <li key={index} className="border-t border-blue-900/50 pt-4 text-center">
                                <p className="text-base text-blue-200">{t(feature)}</p>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mt-auto pt-6">
                     <a href={contactLink} target="_blank" rel="noopener noreferrer" className="block w-full text-center rounded-lg py-3 font-semibold transition-all duration-300 text-lg bg-black/50 border border-blue-700 text-gold-300 hover:bg-black/80 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(60,130,246,0.5)]">
                        {t(buttonKey)}
                    </a>
                </div>
            </div>
        </div>
    );
};


const PricingPlans: React.FC = () => {
    const { t } = useTranslations();

    return (
        <div className="w-full py-12 bg-transparent">
            <div className="max-w-[1100px] mx-auto px-4">
                <div className="text-center">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gold-400 mb-4">{t('plansTitle')}</h2>
                    <div className="inline-block h-1 w-24 bg-gold-500 rounded"></div>
                </div>
                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-8">
                    {plansData.map((plan, index) => (
                        <PlanCard key={index} {...plan} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PricingPlans;