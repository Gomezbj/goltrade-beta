import React, { useContext, useMemo } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { AuthContext, AuthContextType } from '../contexts/AuthContext';
import { ReactionType } from '../types';
import NewspaperIcon from './icons/NewspaperIcon';
import ArrowTopRightOnSquareIcon from './icons/ArrowTopRightOnSquareIcon';
import ThumbUpIcon from './icons/ThumbUpIcon';
import StarIcon from './icons/StarIcon';
import FaceSadTearIcon from './icons/FaceSadTearIcon';
import FaceLaughIcon from './icons/FaceLaughIcon';
import WhatsappIcon from './icons/WhatsappIcon';

const NewsPanel: React.FC = () => {
  const { news, currentUser, toggleReaction } = useContext(AuthContext) as AuthContextType;
  const { t, currentLanguage } = useTranslations();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(currentLanguage, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };
  
  const visibleNews = useMemo(() => {
    if (!currentUser) {
      return [];
    }
    // Admins see all news for management purposes
    if (currentUser.role === 'admin' || currentUser.role === 'sub-admin') {
      return news;
    }

    return news.filter(item => {
      // If no target is specified, it's for everyone
      if (!item.targetAccountTypes || item.targetAccountTypes.length === 0) {
        return true; 
      }
      // Otherwise, check if the user's account type is in the target list
      return item.targetAccountTypes.includes(currentUser.accountType);
    });
  }, [news, currentUser]);


  const ReactionButton: React.FC<{
    item_id: string;
    type: ReactionType;
    Icon: React.FC<{className?: string}>;
    count: number;
    userReaction?: ReactionType;
  }> = ({ item_id, type, Icon, count, userReaction }) => (
    <button 
      title={t(`reaction${type.charAt(0).toUpperCase() + type.slice(1)}` as any)}
      onClick={() => toggleReaction(item_id, type)}
      className={`flex items-center space-x-1.5 p-1.5 rounded-full text-xs font-medium transition-all duration-200 
        ${userReaction === type 
          ? 'bg-primary-600 text-white shadow-md' 
          : 'text-secondary-300 hover:bg-secondary-600 hover:text-white'
        }`}
    >
      <Icon className="w-4 h-4" />
      <span className="min-w-[0.75rem] text-center">{count}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-auto max-h-[calc(100vh-10rem)] md:max-h-[calc(100vh-14rem)] bg-secondary-800 shadow-xl rounded-xl overflow-hidden">
      <header className="p-4 border-b border-secondary-700 flex-shrink-0 flex items-center justify-between">
        <div className="flex-1"></div> {/* Spacer */}
        <div className="flex items-center">
            <NewspaperIcon className="w-6 h-6 mr-2 text-primary-400"/>
            <h2 className="text-xl font-semibold text-primary-300">{t('newsPanelTitle')}</h2>
        </div>
        <div className="flex-1 flex justify-end">
            {currentUser?.accountType === 'pro' && (
                <a 
                    href="https://wa.link/0k1eyq" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-600/20 text-green-300 hover:bg-green-600/40 border border-green-500/30 transition-colors"
                >
                    <WhatsappIcon className="w-3.5 h-3.5" />
                    <span>{t('supportButtonText')}</span>
                </a>
            )}
        </div>
      </header>

      {visibleNews.length === 0 ? (
        <div className="flex-grow flex items-center justify-center p-4 text-center">
          <p className="text-secondary-400">{t('newsPanelEmpty')}</p>
        </div>
      ) : (
        <ul className="flex-grow overflow-y-auto p-3 space-y-4">
          {visibleNews.map((item) => {
            const userReaction = item.reactedBy[currentUser?.id || ''];
            return (
              <li 
                key={item.id} 
                className="bg-secondary-900/50 rounded-lg shadow-lg border border-secondary-700 overflow-hidden flex flex-col md:flex-row"
              >
                {/* Left Column: Image */}
                {item.imageUrl && (
                  <div className="w-full md:w-2/5 lg:w-1/3 flex-shrink-0 bg-secondary-900">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-56 md:h-full object-cover"
                    />
                  </div>
                )}

                {/* Right Column: Information */}
                <div className="flex flex-col flex-grow p-4 sm:p-5">
                  {/* Main content area that pushes footer down */}
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-primary-300 mb-1">{item.title}</h3>
                    <p className="text-xs text-secondary-500 mb-4">
                      {t('newsPanelPostedOn', { date: formatDate(item.timestamp) })}
                    </p>
                    <p className="text-sm text-secondary-200 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                  </div>

                  {/* Footer with actions */}
                  <div className="mt-4 pt-4 border-t border-secondary-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Reactions on the left */}
                    <div className="flex items-center justify-start space-x-2">
                      <ReactionButton type="like" item_id={item.id} Icon={ThumbUpIcon} count={item.reactions.like} userReaction={userReaction} />
                      <ReactionButton type="wow" item_id={item.id} Icon={StarIcon} count={item.reactions.wow} userReaction={userReaction} />
                      <ReactionButton type="sad" item_id={item.id} Icon={FaceSadTearIcon} count={item.reactions.sad} userReaction={userReaction} />
                      <ReactionButton type="funny" item_id={item.id} Icon={FaceLaughIcon} count={item.reactions.funny} userReaction={userReaction} />
                    </div>

                    {/* Link button on the right */}
                    {item.linkUrl && (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center self-start sm:self-center px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-primary-400"
                      >
                        {item.linkText || t('newsPanelDefaultLinkText')}
                        <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-2" />
                      </a>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  );
};

export default NewsPanel;